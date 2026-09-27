import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDbSeeded } from "@/lib/seedHelper";
import { StaffStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await ensureDbSeeded();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const property = propertyId
      ? await db.property.findUnique({ where: { id: propertyId } })
      : await db.property.findFirst();

    if (!property) {
      return NextResponse.json({ roster: [] });
    }

    const staffShifts = await db.staffShift.findMany({
      where: { propertyId: property.id },
      include: {
        user: true,
        department: true,
        shift: true,
      },
      orderBy: { date: "desc" },
    });

    const staffList = await db.user.findMany({
      where: { propertyId: property.id },
      include: { department: true },
      orderBy: { name: "asc" },
    });

    const shifts = await db.shift.findMany({
      where: { propertyId: property.id },
    });

    return NextResponse.json({
      property,
      staffShifts,
      staffList,
      shifts,
    });
  } catch (error) {
    console.error("GET roster error:", error);
    return NextResponse.json({ error: "Failed to fetch roster" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbSeeded();
    const body = await req.json();
    const { userId, shiftId, assignedFloor, rosterStatus } = body;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user assignedFloors and availabilityStatus
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        assignedFloors: JSON.stringify([parseInt(assignedFloor.replace(/\D/g, "")) || 10]),
        availabilityStatus: rosterStatus as StaffStatus,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Roster updated for ${user.name} (${assignedFloor}, ${rosterStatus}).`,
    });
  } catch (error) {
    console.error("POST roster error:", error);
    return NextResponse.json({ error: "Failed to update roster" }, { status: 500 });
  }
}
