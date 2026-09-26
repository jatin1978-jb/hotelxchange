import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { selectNextAssignee } from "@/lib/roundRobin";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      accessToken,
      qrToken,
      categoryId,
      urgency = "NORMAL",
      details,
      guestName,
      guestPhone,
      items,
    } = body;

    let session = null;
    let room = null;
    let stayId = null;
    let guestSessionId = null;

    if (accessToken) {
      session = await db.guestStaySession.findUnique({
        where: { secureAccessToken: accessToken },
        include: { room: true },
      });

      if (!session || session.sessionStatus !== "ACTIVE") {
        return NextResponse.json(
          { error: "Your stay has ended. Thank you for staying with us." },
          { status: 403 }
        );
      }

      room = session.room;
      stayId = session.stayId;
      guestSessionId = session.id;
    } else if (qrToken) {
      room = await db.room.findUnique({
        where: { qrToken },
      });
    }

    if (!room) {
      return NextResponse.json({ error: "Invalid room link or session" }, { status: 400 });
    }

    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: { department: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Generate non-guessable tracking token
    const trackingToken = "hx-" + randomBytes(8).toString("hex");

    // Determine priority
    let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
    if (urgency === "HIGH") priority = "HIGH";
    if (urgency === "URGENT" || category.priorityRule === "URGENT") priority = "URGENT";

    // Round-robin assignee selection
    const assigneeId = await selectNextAssignee(category.departmentId, category.id);

    const isFnb = category.slug === "fnb-order" || items?.length > 0;
    const requestType = isFnb ? "FNB" : category.slug === "service-recovery" ? "COMPLAINT" : "GENERAL";
    const initialStatus = isFnb ? "SUBMITTED" : "SUBMITTED";

    const newRequest = await db.request.create({
      data: {
        propertyId: room.propertyId,
        roomId: room.id,
        categoryId: category.id,
        stayId: stayId,
        guestSessionId: guestSessionId,
        type: requestType,
        priority,
        status: initialStatus,
        currentDepartmentId: category.departmentId,
        currentAssigneeId: assigneeId,
        trackingToken,
        urgency,
        details,
        guestName: guestName || session?.guestLastName || "Guest",
        guestPhone,
      },
    });

    // Handle Assignment History
    if (assigneeId) {
      await db.assignmentHistory.create({
        data: {
          requestId: newRequest.id,
          assigneeId: assigneeId,
          departmentId: category.departmentId,
        },
      });
    } else {
      await db.alert.create({
        data: {
          propertyId: room.propertyId,
          requestId: newRequest.id,
          type: "ACCEPTANCE_TIMEOUT",
          severity: "HIGH",
          assignedSupervisorId: category.department.supervisorId,
          status: "ACTIVE",
        },
      });
    }

    // Log Creation Event
    await db.requestEvent.create({
      data: {
        requestId: newRequest.id,
        eventType: "REQUEST_SUBMITTED",
        toValue: initialStatus,
        metadata: JSON.stringify({ category: category.name, roomNumber: room.roomNumber, priority }),
      },
    });

    // Handle F&B Order Lines
    if (isFnb && items && Array.isArray(items)) {
      for (const item of items) {
        const menuItem = await db.menuItem.findUnique({
          where: { id: item.menuItemId },
        });

        if (menuItem) {
          await db.orderLine.create({
            data: {
              requestId: newRequest.id,
              menuItemId: menuItem.id,
              quantity: item.quantity || 1,
              selectedModifiers: JSON.stringify(item.selectedModifiers || []),
              specialInstructions: item.specialInstructions || "",
              itemSnapshot: JSON.stringify(menuItem),
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      trackingToken,
      requestId: newRequest.id,
    });
  } catch (error) {
    console.error("Error submitting guest request:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
