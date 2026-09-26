import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateSlaStatus } from "@/lib/slaEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingToken: string }> }
) {
  try {
    const { trackingToken } = await params;

    const request = await db.request.findUnique({
      where: { trackingToken },
      include: {
        room: true,
        category: true,
        currentDepartment: true,
        orderLines: {
          include: { menuItem: true },
        },
        events: {
          orderBy: { occurredAt: "asc" },
        },
        feedback: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Tracking link expired or invalid." },
        { status: 404 }
      );
    }

    const slaStatus = calculateSlaStatus(
      request.created_at,
      request.accepted_at,
      request.completed_at || request.delivered_at,
      request.category.slaTargetMinutes,
      request.category.acceptanceTimeoutMinutes
    );

    return NextResponse.json({
      request: {
        id: request.id,
        trackingToken: request.trackingToken,
        roomNumber: request.room.roomNumber,
        categoryName: request.category.name,
        departmentName: request.currentDepartment.name,
        type: request.type,
        status: request.status,
        priority: request.priority,
        created_at: request.created_at,
        accepted_at: request.accepted_at,
        completed_at: request.completed_at,
        delivered_at: request.delivered_at,
        details: request.details,
      },
      orderLines: request.orderLines,
      events: request.events,
      feedback: request.feedback,
      slaStatus,
    });
  } catch (error) {
    console.error("Tracking API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trackingToken: string }> }
) {
  try {
    const { trackingToken } = await params;
    const { rating } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const request = await db.request.findUnique({
      where: { trackingToken },
      include: { currentDepartment: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Save Feedback
    const feedback = await db.feedback.upsert({
      where: { requestId: request.id },
      create: {
        requestId: request.id,
        rating1To5: rating,
      },
      update: {
        rating1To5: rating,
      },
    });

    // Check Low Rating Alert (FR-017 / FR-022)
    if (rating <= 2) {
      await db.alert.create({
        data: {
          propertyId: request.propertyId,
          requestId: request.id,
          type: "LOW_RATING",
          severity: "HIGH",
          assignedSupervisorId: request.currentDepartment.supervisorId,
          status: "ACTIVE",
        },
      });
    }

    // Log Event
    await db.requestEvent.create({
      data: {
        requestId: request.id,
        eventType: "GUEST_FEEDBACK_SUBMITTED",
        metadata: JSON.stringify({ rating }),
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("Feedback submit error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
