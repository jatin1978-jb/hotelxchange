import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateSlaStatus } from "@/lib/slaEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;

    const session = await db.guestStaySession.findUnique({
      where: { secureAccessToken: accessToken },
      include: {
        property: true,
        room: true,
        stay: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { checkedOut: true, message: "Your stay has ended. Thank you for staying with us." },
        { status: 404 }
      );
    }

    // SECTION 8: CRITICAL CHECKOUT REQUIREMENT
    if (session.sessionStatus === "CHECKED_OUT" || session.stay.status === "CHECKED_OUT") {
      return NextResponse.json({
        checkedOut: true,
        message: "Your stay has ended. Thank you for staying with us.",
      });
    }

    // Fetch requests belonging strictly to this GuestStaySession (Section 6 & 13)
    const requests = await db.request.findMany({
      where: { guestSessionId: session.id },
      include: {
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
      orderBy: { created_at: "desc" },
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

    // Build Chronological Stay Activity Timeline (Section 7)
    // Exclude internal operational staff notes/SLA details
    const eventsList = requests.flatMap((r) =>
      r.events.map((evt) => ({
        id: evt.id,
        requestId: r.id,
        categoryName: r.category.name,
        eventType: evt.eventType,
        details: r.details,
        occurredAt: evt.occurredAt,
      }))
    );

    eventsList.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    // Fetch Categories & Menu
    const categories = await db.category.findMany({
      where: { active: true },
      include: { department: true },
      orderBy: { name: "asc" },
    });

    const menuSections = await db.menuSection.findMany({
      where: { propertyId: session.propertyId, active: true },
      include: {
        items: {
          where: { available: true },
          include: {
            modifierGroups: {
              include: { options: true },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      checkedOut: false,
      session: {
        id: session.id,
        secureAccessToken: session.secureAccessToken,
        guestLastName: session.guestLastName,
        roomNumber: session.room.roomNumber,
        propertyName: session.property.name,
        expectedCheckOutAt: session.expectedCheckOutAt,
        sessionStatus: session.sessionStatus,
      },
      requests: formattedRequests,
      activityTimeline: eventsList,
      categories,
      menuSections,
    });
  } catch (error) {
    console.error("Guest session fetch error:", error);
    return NextResponse.json(
      { checkedOut: true, message: "Your stay has ended. Thank you for staying with us." },
      { status: 500 }
    );
  }
}
