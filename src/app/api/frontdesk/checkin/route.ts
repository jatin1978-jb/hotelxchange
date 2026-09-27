import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDbSeeded } from "@/lib/seedHelper";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    await ensureDbSeeded();
    const body = await req.json();
    const { action, roomId, reservationId, guestLastName, newRoomId, newCheckoutDate } = body;

    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // ACTION 1: CHECK_OUT
    if (action === "CHECK_OUT") {
      // Find active PMS stay for this room
      const activeStay = await db.pmsStay.findFirst({
        where: { roomId: room.id, status: "ACTIVE" },
      });

      if (activeStay) {
        await db.pmsStay.update({
          where: { id: activeStay.id },
          data: { status: "CHECKED_OUT", actualCheckOutAt: new Date() },
        });

        await db.guestStaySession.updateMany({
          where: { stayId: activeStay.id, sessionStatus: "ACTIVE" },
          data: { sessionStatus: "CHECKED_OUT", actualCheckOutAt: new Date() },
        });
      }

      const updatedRoom = await db.room.update({
        where: { id: roomId },
        data: { registeredGuest: "Vacant / Available" },
      });

      return NextResponse.json({
        success: true,
        action: "CHECK_OUT",
        room: updatedRoom,
        message: "PMS Check-out completed. Active stay closed and guest session revoked.",
      });
    }

    // ACTION 2: ROOM_CHANGE
    if (action === "ROOM_CHANGE") {
      if (!newRoomId) {
        return NextResponse.json({ error: "Target room ID required for room change" }, { status: 400 });
      }

      const newRoom = await db.room.findUnique({ where: { id: newRoomId } });
      if (!newRoom) {
        return NextResponse.json({ error: "Target room not found" }, { status: 404 });
      }

      const activeStay = await db.pmsStay.findFirst({
        where: { roomId: room.id, status: "ACTIVE" },
      });

      if (!activeStay) {
        return NextResponse.json({ error: "No active stay found in source room to transfer" }, { status: 400 });
      }

      // 1. Transfer active stay to new room
      await db.pmsStay.update({
        where: { id: activeStay.id },
        data: { roomId: newRoom.id },
      });

      // 2. Transfer active sessions to new room
      await db.guestStaySession.updateMany({
        where: { stayId: activeStay.id },
        data: { roomId: newRoom.id },
      });

      // 3. Update room guest strings
      await db.room.update({
        where: { id: room.id },
        data: { registeredGuest: "Vacant / Available" },
      });

      const updatedNewRoom = await db.room.update({
        where: { id: newRoom.id },
        data: { registeredGuest: activeStay.guestLastName },
      });

      return NextResponse.json({
        success: true,
        action: "ROOM_CHANGE",
        oldRoomNumber: room.roomNumber,
        newRoomNumber: newRoom.roomNumber,
        guestLastName: activeStay.guestLastName,
        message: `Room Change successful! Transferred stay for ${activeStay.guestLastName} from Room ${room.roomNumber} to Room ${newRoom.roomNumber}.`,
      });
    }

    // ACTION 3: EXTEND_STAY
    if (action === "EXTEND_STAY") {
      const activeStay = await db.pmsStay.findFirst({
        where: { roomId: room.id, status: "ACTIVE" },
      });

      if (!activeStay) {
        return NextResponse.json({ error: "No active stay found to extend" }, { status: 400 });
      }

      const targetCheckout = newCheckoutDate
        ? new Date(newCheckoutDate)
        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await db.pmsStay.update({
        where: { id: activeStay.id },
        data: { expectedCheckOutAt: targetCheckout },
      });

      await db.guestStaySession.updateMany({
        where: { stayId: activeStay.id },
        data: { expectedCheckOutAt: targetCheckout },
      });

      return NextResponse.json({
        success: true,
        action: "EXTEND_STAY",
        newCheckout: targetCheckout.toISOString(),
        message: `Stay extended until ${targetCheckout.toLocaleDateString()}.`,
      });
    }

    // ACTION 4: CHECK_IN
    const resId = reservationId || `STAY-${Math.floor(10000 + Math.random() * 90000)}`;
    const lastName = guestLastName || "Sharma";

    // Close any prior active stay in this room
    await db.pmsStay.updateMany({
      where: { roomId: room.id, status: "ACTIVE" },
      data: { status: "CHECKED_OUT", actualCheckOutAt: new Date() },
    });
    await db.guestStaySession.updateMany({
      where: { roomId: room.id, sessionStatus: "ACTIVE" },
      data: { sessionStatus: "CHECKED_OUT", actualCheckOutAt: new Date() },
    });

    const expectedCheckout = newCheckoutDate
      ? new Date(newCheckoutDate)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Create new active PMS Stay
    const newStay = await db.pmsStay.create({
      data: {
        propertyId: room.propertyId,
        roomId: room.id,
        reservationId: resId,
        guestLastName: lastName,
        checkInAt: new Date(),
        expectedCheckOutAt: expectedCheckout,
        status: "ACTIVE",
      },
    });

    const updatedRoom = await db.room.update({
      where: { id: room.id },
      data: { registeredGuest: lastName, linkStatus: "ACTIVE" },
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const guestUrl = `${protocol}://${host}/guest/room/${updatedRoom.qrToken}`;

    const qrDataUrl = await QRCode.toDataURL(guestUrl, {
      margin: 2,
      width: 320,
      color: { dark: "#0A4D7E", light: "#FFFFFF" },
    });

    return NextResponse.json({
      success: true,
      action: "CHECK_IN",
      stay: newStay,
      room: updatedRoom,
      guestUrl,
      qrDataUrl,
      message: `PMS Check-In complete for ${lastName} in Room ${room.roomNumber} (Stay: ${resId}).`,
    });
  } catch (error) {
    console.error("Front Desk PMS Action error:", error);
    return NextResponse.json({ error: "PMS action failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureDbSeeded();
    const rooms = await db.room.findMany({
      include: {
        property: true,
        pmsStays: {
          where: { status: "ACTIVE" },
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
          color: { dark: "#0A4D7E", light: "#FFFFFF" },
        });
        const activeStay = room.pmsStays[0] || null;

        return {
          ...room,
          activeStay,
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
