import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { requestId, newAssigneeId, supervisorId, reason } = await req.json();

    const request = await db.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const previousAssigneeId = request.currentAssigneeId;
    const now = new Date();

    // Close existing active assignment history record
    await db.assignmentHistory.updateMany({
      where: { requestId, endedAt: null },
      data: { endedAt: now },
    });

    // Create new assignment history record
    await db.assignmentHistory.create({
      data: {
        requestId,
        assigneeId: newAssigneeId,
        departmentId: request.currentDepartmentId,
        actorId: supervisorId,
        reason: reason || "Supervisor Manual Reassignment",
      },
    });

    // Update Request
    const updated = await db.request.update({
      where: { id: requestId },
      data: {
        currentAssigneeId: newAssigneeId,
      },
    });

    // Audit Event
    await db.requestEvent.create({
      data: {
        requestId,
        eventType: "SUPERVISOR_REASSIGNED",
        fromValue: previousAssigneeId || "UNASSIGNED",
        toValue: newAssigneeId,
        actorId: supervisorId,
        metadata: JSON.stringify({ reason }),
      },
    });

    // Resolve any active ACCEPTANCE_TIMEOUT alerts
    await db.alert.updateMany({
      where: { requestId, type: "ACCEPTANCE_TIMEOUT", status: "ACTIVE" },
      data: { status: "RESOLVED", resolvedAt: now },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Reassign error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
