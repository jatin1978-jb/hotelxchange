import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { routeRequest } from "@/lib/routingEngine";
import { dispatchNotification } from "@/lib/notificationEngine";
import { ensureDbSeeded } from "@/lib/seedHelper";
import { randomBytes } from "crypto";
import { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    await ensureDbSeeded();
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

    // 1. Central Routing Engine Execution
    const routingResult = await routeRequest({
      propertyId: room.propertyId,
      departmentId: category.departmentId,
      categoryId: category.id,
      roomId: room.id,
      priority,
    });

    const assigneeId = routingResult.assignedUserId;
    const isFnb = category.slug === "fnb-order" || items?.length > 0;
    const requestType = isFnb ? "FNB" : category.slug === "service-recovery" ? "COMPLAINT" : "GENERAL";
    const initialStatus = assigneeId ? "SUBMITTED" : "UNASSIGNED";

    // Calculate SLA due and Acceptance due times
    const slaDueAt = new Date(Date.now() + (category.slaTargetMinutes || 20) * 60 * 1000);
    const acceptanceDueAt = new Date(Date.now() + (category.acceptanceTimeoutMinutes || 2) * 60 * 1000);

    const newRequest = await db.request.create({
      data: {
        tenantId: room.propertyId,
        propertyId: room.propertyId,
        roomId: room.id,
        categoryId: category.id,
        stayId: stayId,
        guestSessionId: guestSessionId,
        type: requestType,
        priority,
        status: initialStatus,
        assigned_at: assigneeId ? new Date() : null,
        sla_due_at: slaDueAt,
        acceptance_due_at: acceptanceDueAt,
        currentDepartmentId: category.departmentId,
        currentAssigneeId: assigneeId,
        trackingToken,
        urgency,
        details,
        guestName: guestName || session?.guestLastName || "Guest",
        guestPhone,
      },
    });

    // 2. Record Assignment History
    if (assigneeId) {
      await db.assignmentHistory.create({
        data: {
          requestId: newRequest.id,
          assigneeId: assigneeId,
          departmentId: category.departmentId,
        },
      });

      // Dispatch Notification to assigned staff member
      await dispatchNotification({
        propertyId: room.propertyId,
        requestId: newRequest.id,
        targetUserId: assigneeId,
        type: "ASSIGNMENT_NOTIFICATION",
        title: `New Request — Room ${room.roomNumber}`,
        body: `${category.name}: "${details || "Standard Request"}" (SLA: ${category.slaTargetMinutes}m)`,
        roomNumber: room.roomNumber,
      });
    } else {
      // Unassigned Alert for Supervisor
      await db.alert.create({
        data: {
          propertyId: room.propertyId,
          requestId: newRequest.id,
          type: "UNASSIGNED_ALERT",
          severity: "HIGH",
          assignedSupervisorId: category.department.supervisorId,
          status: "ACTIVE",
        },
      });

      await dispatchNotification({
        propertyId: room.propertyId,
        requestId: newRequest.id,
        targetDepartmentId: category.departmentId,
        type: "DEPARTMENT_ALERT",
        title: `[URGENT] Unassigned Request — Room ${room.roomNumber}`,
        body: `No available staff in ${category.department.name} for Room ${room.roomNumber}. Manual assignment required.`,
        roomNumber: room.roomNumber,
      });
    }

    // 3. F&B Manager Alert (Section 27)
    if (isFnb) {
      await dispatchNotification({
        propertyId: room.propertyId,
        requestId: newRequest.id,
        targetRole: UserRole.FNB_MANAGER,
        type: "MANAGER_ALERT",
        title: `New In-Room Dining Order — Room ${room.roomNumber}`,
        body: `Order #${newRequest.id.slice(-5)} placed for Room ${room.roomNumber}. Items: ${items?.length || 1}`,
        roomNumber: room.roomNumber,
      });
    }

    // 4. Log Request Event
    await db.requestEvent.create({
      data: {
        requestId: newRequest.id,
        eventType: "REQUEST_SUBMITTED",
        toValue: initialStatus,
        metadata: JSON.stringify({ category: category.name, roomNumber: room.roomNumber, priority, routingResult }),
      },
    });

    // 5. Save F&B Order Lines
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
      routingMessage: routingResult.message,
    });
  } catch (error) {
    console.error("Error submitting guest request:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
