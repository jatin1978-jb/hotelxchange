import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDbSeeded } from "@/lib/seedHelper";

export async function GET(req: NextRequest) {
  try {
    await ensureDbSeeded();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = await db.notificationLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbSeeded();
    const body = await req.json();
    const { action, userId, deviceType, pushSubscription } = body;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { property: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
    }

    // ACTION: REGISTER_DEVICE
    if (action === "REGISTER_DEVICE") {
      const deviceId = `dev-${user.id}-${deviceType || "DESKTOP"}`;

      const device = await db.notificationDevice.upsert({
        where: { deviceId },
        create: {
          tenantId: user.tenantId,
          propertyId: user.propertyId,
          userId: user.id,
          deviceId,
          deviceType: deviceType || "DESKTOP",
          pushSubscription: JSON.stringify(pushSubscription || {}),
          enabled: true,
          lastSeen: new Date(),
        },
        update: {
          lastSeen: new Date(),
          pushSubscription: JSON.stringify(pushSubscription || {}),
        },
      });

      return NextResponse.json({
        success: true,
        device,
        message: "Device registered for Web Push notifications.",
      });
    }

    // ACTION: SEND_TEST_NOTIFICATION (Section 64)
    if (action === "SEND_TEST_NOTIFICATION") {
      const testNotif = await db.notificationLog.create({
        data: {
          tenantId: user.tenantId,
          propertyId: user.propertyId,
          userId: user.id,
          channel: "WEB_PUSH",
          type: "ASSIGNMENT_NOTIFICATION",
          title: "HotelXchange Test Notification",
          body: "If you can see this notification, your device is configured correctly.",
          status: "DELIVERED",
        },
      });

      return NextResponse.json({
        success: true,
        notification: testNotif,
        message: "HotelXchange Test Notification dispatched to your device!",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Notification POST error:", error);
    return NextResponse.json({ error: "Failed to process notification request" }, { status: 500 });
  }
}
