import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDbSeeded } from "@/lib/seedHelper";
import { randomBytes } from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  try {
    await ensureDbSeeded();
    const { qrToken } = await params;

    // 1. Resolve Room by permanent QR token
    const room = await db.room.findUnique({
      where: { qrToken },
      include: { property: true },
    });

    if (!room || room.linkStatus !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          hasActiveStay: false,
          error: "Invalid or deactivated room QR code.",
        },
        { status: 404 }
      );
    }

    // 2. Resolve Active PMS Stay for Room
    const activeStay = await db.pmsStay.findFirst({
      where: {
        roomId: room.id,
        status: "ACTIVE",
      },
    });

    if (!activeStay) {
      return NextResponse.json({
        success: true,
        hasActiveStay: false,
        roomNumber: room.roomNumber,
        propertyName: room.property.name,
        message: "No active guest stay is currently associated with this room.",
      });
    }

    // 3. Create or retrieve active Guest Stay Session
    let existingSession = await db.guestStaySession.findFirst({
      where: {
        stayId: activeStay.id,
        sessionStatus: "ACTIVE",
      },
    });

    if (!existingSession) {
      const secureAccessToken = "hx-session-" + randomBytes(16).toString("hex");
      existingSession = await db.guestStaySession.create({
        data: {
          tenantId: activeStay.tenantId,
          propertyId: activeStay.propertyId,
          roomId: activeStay.roomId,
          stayId: activeStay.id,
          guestLastName: activeStay.guestLastName,
          checkInAt: activeStay.checkInAt,
          expectedCheckOutAt: activeStay.expectedCheckOutAt,
          sessionStatus: "ACTIVE",
          secureAccessToken,
        },
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveStay: true,
      roomNumber: room.roomNumber,
      guestLastName: activeStay.guestLastName,
      secureAccessToken: existingSession.secureAccessToken,
      stayId: activeStay.reservationId,
    });
  } catch (error) {
    console.error("Error resolving QR room context:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
