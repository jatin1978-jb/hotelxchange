import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  try {
    const { qrToken } = await params;

    const room = await db.room.findUnique({
      where: { qrToken },
      include: { property: true },
    });

    if (!room || room.linkStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "Invalid or expired QR code. Please contact the Front Desk for assistance." },
        { status: 404 }
      );
    }

    const categories = await db.category.findMany({
      where: { active: true },
      include: { department: true },
      orderBy: { name: "asc" },
    });

    const menuSections = await db.menuSection.findMany({
      where: { propertyId: room.propertyId, active: true },
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
      property: room.property,
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        qrToken: room.qrToken,
        registeredGuest: room.registeredGuest,
      },
      categories,
      menuSections,
    });
  } catch (error) {
    console.error("Error resolving room context:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
