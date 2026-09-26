import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, guestName, action } = body; // action: 'CHECK_IN' | 'CHECK_OUT'

    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (action === "CHECK_OUT") {
      const updatedRoom = await db.room.update({
        where: { id: roomId },
        data: {
          registeredGuest: "Vacant / Available",
        },
      });

      return NextResponse.json({
        success: true,
        action: "CHECK_OUT",
        room: updatedRoom,
      });
    }

    // CHECK-IN ACTION
    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: {
        registeredGuest: guestName || "Valued Guest",
        linkStatus: "ACTIVE",
      },
    });

    // Determine host URL
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const guestUrl = `${protocol}://${host}/guest/room/${updatedRoom.qrToken}`;

    // Generate Scannable QR Code Data URL (PNG)
    const qrDataUrl = await QRCode.toDataURL(guestUrl, {
      margin: 2,
      width: 320,
      color: {
        dark: "#0A4D7E", // HotelXchange Navy
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      success: true,
      action: "CHECK_IN",
      room: updatedRoom,
      guestUrl,
      qrDataUrl,
    });
  } catch (error) {
    console.error("Check-in API error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const rooms = await db.room.findMany({
      include: {
        property: true,
        requests: {
          where: {
            status: { notIn: ["COMPLETED", "DELIVERED"] },
          },
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";

    const roomsWithQr = await Promise.all(
      rooms.map(async (room) => {
        const guestUrl = `${protocol}://${host}/guest/room/${room.qrToken}`;
        const qrDataUrl = await QRCode.toDataURL(guestUrl, {
          margin: 2,
          width: 320,
          color: {
            dark: "#0A4D7E",
            light: "#FFFFFF",
          },
        });
        return {
          ...room,
          guestUrl,
          qrDataUrl,
        };
      })
    );

    return NextResponse.json({ rooms: roomsWithQr });
  } catch (error) {
    console.error("Get Front Desk Rooms error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
