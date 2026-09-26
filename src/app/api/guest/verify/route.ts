import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { secureRoomToken, guestLastName } = await req.json();

    if (!secureRoomToken || !guestLastName) {
      return NextResponse.json(
        { error: "We couldn't verify your stay. Please check the details and try again." },
        { status: 400 }
      );
    }

    // 1. Resolve Room by secure room token
    const room = await db.room.findUnique({
      where: { qrToken: secureRoomToken },
      include: { property: true },
    });

    if (!room || room.linkStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "We couldn't verify your stay. Please check the details and try again." },
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
      return NextResponse.json(
        { error: "We couldn't verify your stay. Please check the details and try again." },
        { status: 400 }
      );
    }

    // 3. Case-insensitive Last Name Match
    const cleanEntered = guestLastName.trim().toLowerCase();
    const cleanPmsName = activeStay.guestLastName.trim().toLowerCase();

    if (cleanEntered !== cleanPmsName) {
      return NextResponse.json(
        { error: "We couldn't verify your stay. Please check the details and try again." },
        { status: 401 }
      );
    }

    // 4. Create or reuse active Guest Stay Session
    const existingSession = await db.guestStaySession.findFirst({
      where: {
        stayId: activeStay.id,
        sessionStatus: "ACTIVE",
      },
    });

    if (existingSession) {
      return NextResponse.json({
        success: true,
        secureAccessToken: existingSession.secureAccessToken,
        session: existingSession,
      });
    }

    // Generate secure opaque access token
    const secureAccessToken = "hx-session-" + randomBytes(16).toString("hex");

    const newSession = await db.guestStaySession.create({
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

    return NextResponse.json({
      success: true,
      secureAccessToken: newSession.secureAccessToken,
      session: newSession,
    });
  } catch (error) {
    console.error("Guest Stay Verification error:", error);
    return NextResponse.json(
      { error: "We couldn't verify your stay. Please check the details and try again." },
      { status: 500 }
    );
  }
}
