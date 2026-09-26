import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { selectNextAssignee } from "@/lib/roundRobin";

export async function POST(req: NextRequest) {
  try {
    const { requestId, supervisorId, reason } = await req.json();

    const request = await db.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const srDept = await db.department.findFirst({
      where: { code: "SR" },
    });

    if (!srDept) {
      return NextResponse.json({ error: "Service Recovery department not found" }, { status: 404 });
    }

    const srCategory = await db.category.findFirst({
      where: { departmentId: srDept.id },
    });

    const newAssigneeId = await selectNextAssignee(srDept.id, srCategory?.id || "");
    const now = new Date();

    const previousDeptId = request.currentDepartmentId;

    // Update same request record
    const updated = await db.request.update({
      where: { id: requestId },
      data: {
        currentDepartmentId: srDept.id,
        currentAssigneeId: newAssigneeId,
        priority: "URGENT",
        type: "COMPLAINT",
      },
    });

    // Create assignment history entry
    if (newAssigneeId) {
      await db.assignmentHistory.create({
        data: {
          requestId,
          assigneeId: newAssigneeId,
          departmentId: srDept.id,
          actorId: supervisorId,
          reason: reason || "Escalated to Service Recovery",
        },
      });
    }

    // Audit Event
    await db.requestEvent.create({
      data: {
        requestId,
        eventType: "TRANSFERRED_TO_SERVICE_RECOVERY",
        fromValue: previousDeptId,
        toValue: srDept.id,
        actorId: supervisorId,
        metadata: JSON.stringify({ reason }),
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("SR Transfer error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
