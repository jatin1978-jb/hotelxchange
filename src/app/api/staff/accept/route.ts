import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RequestStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { requestId, userId } = await req.json();

    if (!requestId || !userId) {
      return NextResponse.json({ error: "Missing requestId or userId" }, { status: 400 });
    }

    // Perform atomic transaction check
    const result = await db.$transaction(async (tx) => {
      const currentReq = await tx.request.findUnique({
        where: { id: requestId },
      });

      if (!currentReq) {
        throw new Error("NOT_FOUND");
      }

      // Check if request has already been accepted
      if (currentReq.status !== RequestStatus.SUBMITTED && currentReq.status !== RequestStatus.UNASSIGNED) {
        throw new Error("ALREADY_ACCEPTED");
      }

      // Atomically update request status to ACCEPTED
      const updatedReq = await tx.request.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.ACCEPTED,
          currentAssigneeId: userId,
          accepted_at: new Date(),
        },
      });

      // Record assignment history
      await tx.assignmentHistory.create({
        data: {
          requestId: currentReq.id,
          assigneeId: userId,
          departmentId: currentReq.currentDepartmentId,
          acceptedAt: new Date(),
          actorId: userId,
        },
      });

      return updatedReq;
    });

    return NextResponse.json({
      success: true,
      request: result,
      message: "Request successfully accepted!",
    });
  } catch (error: any) {
    if (error.message === "ALREADY_ACCEPTED") {
      return NextResponse.json(
        { error: "This request has already been accepted by another staff member." },
        { status: 409 }
      );
    }
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    console.error("Accept request error:", error);
    return NextResponse.json({ error: "Failed to accept request" }, { status: 500 });
  }
}
