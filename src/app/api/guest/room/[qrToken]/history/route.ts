import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateSlaStatus } from "@/lib/slaEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  try {
    const { qrToken } = await params;

    const room = await db.room.findUnique({
      where: { qrToken },
    });

    if (!room) {
      return NextResponse.json({ error: "Invalid room QR" }, { status: 404 });
    }

    const requests = await db.request.findMany({
      where: { roomId: room.id },
      include: {
        category: true,
        currentDepartment: true,
        orderLines: {
          include: { menuItem: true },
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

    return NextResponse.json({
      room: {
        roomNumber: room.roomNumber,
        registeredGuest: room.registeredGuest,
      },
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("Room request history error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
