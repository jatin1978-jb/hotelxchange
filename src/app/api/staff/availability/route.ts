import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StaffStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing userId or status" }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        availabilityStatus: status as StaffStatus,
      },
    });

    return NextResponse.json({
      success: true,
      userId: updatedUser.id,
      availabilityStatus: updatedUser.availabilityStatus,
      message: `Staff availability status updated to ${updatedUser.availabilityStatus}.`,
    });
  } catch (error) {
    console.error("Update availability error:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
