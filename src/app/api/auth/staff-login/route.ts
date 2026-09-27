import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDbSeeded } from "@/lib/seedHelper";
import { getPropertyBranding } from "@/lib/branding";

export async function POST(req: NextRequest) {
  try {
    await ensureDbSeeded();
    const { identifier, password } = await req.json();

    if (!identifier) {
      return NextResponse.json({ error: "Please enter your Employee Staff ID or Email." }, { status: 400 });
    }

    const cleanId = identifier.trim();

    // Look up staff user by Staff ID, email, or employeeCode
    const user = await db.user.findFirst({
      where: {
        OR: [
          { staffId: cleanId },
          { email: cleanId.toLowerCase() },
          { employeeCode: cleanId },
        ],
        active: true,
      },
      include: {
        department: true,
        property: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid Employee Staff ID or Email. Please check with Property Admin." },
        { status: 401 }
      );
    }

    const branding = await getPropertyBranding(user.propertyId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        staffId: user.staffId,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        property: user.property,
        assignedFloors: user.assignedFloors,
        availabilityStatus: user.availabilityStatus,
      },
      branding,
      token: `hx-staff-token-${user.id}`,
    });
  } catch (error) {
    console.error("Staff Login API error:", error);
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}
