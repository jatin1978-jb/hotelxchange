import { db } from "./db";

export interface SlaStatus {
  elapsedMinutes: number;
  targetMinutes: number;
  isBreached: boolean;
  isAtRisk: boolean;
  acceptedTimeoutExpired: boolean;
  percentageUsed: number;
}

export function calculateSlaStatus(
  createdAt: Date,
  acceptedAt: Date | null,
  completedAt: Date | null,
  targetMinutes: number,
  timeoutMinutes: number
): SlaStatus {
  const now = completedAt ? new Date(completedAt) : new Date();
  const elapsedMs = now.getTime() - new Date(createdAt).getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / (1000 * 60)));

  const percentageUsed = Math.min(100, Math.round((elapsedMinutes / targetMinutes) * 100));
  const isBreached = elapsedMinutes > targetMinutes;
  const isAtRisk = !isBreached && percentageUsed >= 75;

  let acceptedTimeoutExpired = false;
  if (!acceptedAt && !completedAt) {
    const unacceptedMs = new Date().getTime() - new Date(createdAt).getTime();
    const unacceptedMinutes = Math.floor(unacceptedMs / (1000 * 60));
    acceptedTimeoutExpired = unacceptedMinutes >= timeoutMinutes;
  }

  return {
    elapsedMinutes,
    targetMinutes,
    isBreached,
    isAtRisk,
    acceptedTimeoutExpired,
    percentageUsed,
  };
}

/**
 * Sweeps active requests to create acceptance timeout & SLA breach alerts
 */
export async function checkAndUpdateAlerts() {
  const openRequests = await db.request.findMany({
    where: {
      status: {
        notIn: ["COMPLETED", "DELIVERED"],
      },
    },
    include: {
      category: true,
      currentDepartment: true,
      alerts: true,
    },
  });

  const now = new Date();

  for (const req of openRequests) {
    const elapsedMinutes = Math.floor((now.getTime() - new Date(req.created_at).getTime()) / (1000 * 60));

    // 1. Check Acceptance Timeout Alert
    if (!req.accepted_at && elapsedMinutes >= req.category.acceptanceTimeoutMinutes) {
      const existingTimeoutAlert = req.alerts.find((a) => a.type === "ACCEPTANCE_TIMEOUT" && a.status === "ACTIVE");
      if (!existingTimeoutAlert) {
        await db.alert.create({
          data: {
            propertyId: req.propertyId,
            requestId: req.id,
            type: "ACCEPTANCE_TIMEOUT",
            severity: "HIGH",
            assignedSupervisorId: req.currentDepartment.supervisorId,
            status: "ACTIVE",
          },
        });
      }
    }

    // 2. Check SLA Breach Alert
    if (elapsedMinutes > req.category.slaTargetMinutes) {
      const existingBreachAlert = req.alerts.find((a) => a.type === "SLA_BREACH" && a.status === "ACTIVE");
      if (!existingBreachAlert) {
        await db.alert.create({
          data: {
            propertyId: req.propertyId,
            requestId: req.id,
            type: "SLA_BREACH",
            severity: "CRITICAL",
            assignedSupervisorId: req.currentDepartment.supervisorId,
            status: "ACTIVE",
          },
        });
      }
    }
  }
}
