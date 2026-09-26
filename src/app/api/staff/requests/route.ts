import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAndUpdateAlerts, calculateSlaStatus } from "@/lib/slaEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const staffId = searchParams.get("staffId");

    // Trigger alert sweep
    await checkAndUpdateAlerts();

    const whereClause: any = {};
    if (departmentId) whereClause.currentDepartmentId = departmentId;
    if (staffId) whereClause.currentAssigneeId = staffId;

    const requests = await db.request.findMany({
      where: whereClause,
      include: {
        room: true,
        category: true,
        currentDepartment: true,
        currentAssignee: true,
        orderLines: {
          include: { menuItem: true },
        },
        alerts: {
          where: { status: "ACTIVE" },
        },
        feedback: true,
      },
      orderBy: [{ priority: "desc" }, { created_at: "asc" }],
    });

    const formattedRequests = requests.map((reqItem) => {
      const sla = calculateSlaStatus(
        reqItem.created_at,
        reqItem.accepted_at,
        reqItem.completed_at || reqItem.delivered_at,
        reqItem.category.slaTargetMinutes,
        reqItem.category.acceptanceTimeoutMinutes
      );

      return {
        ...reqItem,
        slaStatus: sla,
      };
    });

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Error fetching staff queue:", error);
    return NextResponse.json({ error: "Failed to fetch staff queue" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, action, staffId } = body;

    const request = await db.request.findUnique({
      where: { id: requestId },
      include: { category: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const now = new Date();
    let newStatus = request.status;
    let acceptedAt = request.accepted_at;
    let completedAt = request.completed_at;
    let deliveredAt = request.delivered_at;

    if (action === "ACCEPT") {
      newStatus = "ACCEPTED";
      acceptedAt = now;

      // Update current assignment history record
      await db.assignmentHistory.updateMany({
        where: { requestId: request.id, endedAt: null },
        data: { acceptedAt: now },
      });

      // Resolve acceptance timeout alerts
      await db.alert.updateMany({
        where: { requestId: request.id, type: "ACCEPTANCE_TIMEOUT", status: "ACTIVE" },
        data: { status: "RESOLVED", resolvedAt: now },
      });
    } else if (action === "IN_PROGRESS") {
      newStatus = "IN_PROGRESS";
    } else if (action === "PREPARING") {
      newStatus = "PREPARING";
    } else if (action === "READY") {
      newStatus = "READY";
    } else if (action === "DELIVERED") {
      newStatus = "DELIVERED";
      deliveredAt = now;
      completedAt = now;
    } else if (action === "COMPLETE") {
      newStatus = "COMPLETED";
      completedAt = now;
    }

    const updated = await db.request.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        accepted_at: acceptedAt,
        completed_at: completedAt,
        delivered_at: deliveredAt,
      },
    });

    // Log Event
    await db.requestEvent.create({
      data: {
        requestId,
        eventType: `STATUS_${action}`,
        fromValue: request.status,
        toValue: newStatus,
        actorId: staffId || "STAFF",
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Error updating request status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
