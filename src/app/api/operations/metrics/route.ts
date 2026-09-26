import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateSlaStatus, checkAndUpdateAlerts } from "@/lib/slaEngine";

export async function GET(req: NextRequest) {
  try {
    await checkAndUpdateAlerts();

    const allRequests = await db.request.findMany({
      include: {
        category: true,
        currentDepartment: true,
        alerts: true,
        feedback: true,
      },
    });

    const openRequests = allRequests.filter((r) => r.status !== "COMPLETED" && r.status !== "DELIVERED");
    const completedRequests = allRequests.filter((r) => r.status === "COMPLETED" || r.status === "DELIVERED");

    let breachedCount = 0;
    let atRiskCount = 0;
    let totalFulfillmentMinutes = 0;
    let completedWithinSla = 0;

    allRequests.forEach((req) => {
      const sla = calculateSlaStatus(
        req.created_at,
        req.accepted_at,
        req.completed_at || req.delivered_at,
        req.category.slaTargetMinutes,
        req.category.acceptanceTimeoutMinutes
      );

      if (sla.isBreached) breachedCount++;
      if (sla.isAtRisk && req.status !== "COMPLETED" && req.status !== "DELIVERED") atRiskCount++;
    });

    completedRequests.forEach((req) => {
      const sla = calculateSlaStatus(
        req.created_at,
        req.accepted_at,
        req.completed_at || req.delivered_at,
        req.category.slaTargetMinutes,
        req.category.acceptanceTimeoutMinutes
      );
      totalFulfillmentMinutes += sla.elapsedMinutes;
      if (!sla.isBreached) completedWithinSla++;
    });

    const withinSlaRate = completedRequests.length > 0
      ? Math.round((completedWithinSla / completedRequests.length) * 100)
      : 100;

    const avgFulfillmentMinutes = completedRequests.length > 0
      ? Math.round(totalFulfillmentMinutes / completedRequests.length)
      : 0;

    const timeoutAlerts = await db.alert.count({
      where: { type: "ACCEPTANCE_TIMEOUT" },
    });

    const departments = await db.department.findMany({
      include: {
        requests: {
          include: { category: true },
        },
      },
    });

    const departmentBreakdown = departments.map((dept) => {
      const deptOpen = dept.requests.filter((r) => r.status !== "COMPLETED" && r.status !== "DELIVERED").length;
      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        totalRequests: dept.requests.length,
        openRequests: deptOpen,
      };
    });

    return NextResponse.json({
      totalRequests: allRequests.length,
      openRequests: openRequests.length,
      slaBreached: breachedCount,
      atRisk: atRiskCount,
      acceptanceTimeouts: timeoutAlerts,
      withinSlaRate,
      avgFulfillmentMinutes,
      departmentBreakdown,
    });
  } catch (error) {
    console.error("Operations metrics error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
