import { db } from "./db";
import { UserRole } from "@prisma/client";

export interface NotificationPayload {
  tenantId?: string;
  propertyId: string;
  requestId?: string;
  targetUserId?: string; // Specific staff member if assignment notif
  targetDepartmentId?: string; // If department/manager alert
  targetRole?: UserRole; // e.g. FNB_MANAGER or SUPERVISOR
  type: "ASSIGNMENT_NOTIFICATION" | "DEPARTMENT_ALERT" | "MANAGER_ALERT" | "SLA_WARNING" | "ACCEPTANCE_TIMEOUT";
  title: string;
  body: string;
  roomNumber?: string;
}

export async function dispatchNotification(payload: NotificationPayload) {
  try {
    const { propertyId, requestId, targetUserId, targetDepartmentId, targetRole, type, title, body } = payload;

    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    const tenantId = property?.tenantId || "tenant-fortune";
    const notificationLogs = [];

    // 1. If targeting specific assigned user:
    if (targetUserId) {
      const notif = await db.notificationLog.create({
        data: {
          tenantId,
          propertyId,
          requestId,
          userId: targetUserId,
          channel: "IN_APP",
          type,
          title,
          body,
          status: "DELIVERED",
        },
      });
      notificationLogs.push(notif);
    }

    // 2. If targeting Manager / Supervisor (e.g. F&B Manager on new F&B orders, Supervisor on unassigned alerts):
    if (targetRole || targetDepartmentId) {
      const managers = await db.user.findMany({
        where: {
          propertyId,
          active: true,
          OR: [
            ...(targetRole ? [{ role: targetRole }] : []),
            ...(targetDepartmentId ? [{ departmentId: targetDepartmentId, role: UserRole.SUPERVISOR }] : []),
            { role: UserRole.OPERATIONS_MANAGER },
          ],
        },
      });

      for (const mgr of managers) {
        if (mgr.id !== targetUserId) {
          const mgrNotif = await db.notificationLog.create({
            data: {
              tenantId,
              propertyId,
              requestId,
              userId: mgr.id,
              channel: "IN_APP",
              type: type === "ASSIGNMENT_NOTIFICATION" ? "MANAGER_ALERT" : type,
              title: `[MANAGER ALERT] ${title}`,
              body,
              status: "DELIVERED",
            },
          });
          notificationLogs.push(mgrNotif);
        }
      }
    }

    return {
      success: true,
      deliveredCount: notificationLogs.length,
      notifications: notificationLogs,
    };
  } catch (error) {
    console.error("Notification Engine dispatch error:", error);
    return { success: false, error: "Notification dispatch failed" };
  }
}
