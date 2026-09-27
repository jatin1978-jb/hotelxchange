import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDbSeeded } from "@/lib/seedHelper";
import { getPropertyBranding } from "@/lib/branding";

export async function GET(req: NextRequest) {
  try {
    await ensureDbSeeded();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || undefined;

    const branding = await getPropertyBranding(propertyId);
    return NextResponse.json({ success: true, branding });
  } catch (error) {
    console.error("GET branding error:", error);
    return NextResponse.json({ error: "Failed to fetch branding" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbSeeded();
    const body = await req.json();

    const {
      propertyId,
      hotelName,
      shortName,
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      loginWelcomeText,
      staffPortalTitle,
      footerText,
      address,
      city,
      country,
      currency,
      phone,
      email,
    } = body;

    const property = propertyId
      ? await db.property.findUnique({ where: { id: propertyId } })
      : await db.property.findFirst();

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Update Property Fields
    await db.property.update({
      where: { id: property.id },
      data: {
        name: hotelName || property.name,
        shortName: shortName || property.shortName,
        address: address || property.address,
        city: city || property.city,
        country: country || property.country,
        currency: currency || property.currency,
        phone: phone || property.phone,
        email: email || property.email,
      },
    });

    // Upsert PropertyBranding
    const branding = await db.propertyBranding.upsert({
      where: { propertyId: property.id },
      create: {
        propertyId: property.id,
        hotelName: hotelName || property.name,
        shortName: shortName || property.shortName,
        logoUrl: logoUrl || "https://fortunehotels.ae/wp-content/uploads/2021/04/fortune-logo-1.png",
        primaryColor: primaryColor || "#0A4D7E",
        secondaryColor: secondaryColor || "#B89759",
        accentColor: accentColor || "#10B981",
        loginWelcomeText: loginWelcomeText || "Welcome to Fortune Park Hotel",
        staffPortalTitle: staffPortalTitle || "HotelXchange Operations",
        footerText: footerText || "© 2026 Fortune Park Hotel • Powered by HotelXchange",
      },
      update: {
        hotelName: hotelName || undefined,
        shortName: shortName || undefined,
        logoUrl: logoUrl || undefined,
        primaryColor: primaryColor || undefined,
        secondaryColor: secondaryColor || undefined,
        accentColor: accentColor || undefined,
        loginWelcomeText: loginWelcomeText || undefined,
        staffPortalTitle: staffPortalTitle || undefined,
        footerText: footerText || undefined,
      },
    });

    const updatedBranding = await getPropertyBranding(property.id);

    return NextResponse.json({
      success: true,
      message: "Hotel branding configuration updated successfully!",
      branding: updatedBranding,
    });
  } catch (error) {
    console.error("POST branding error:", error);
    return NextResponse.json({ error: "Failed to update branding" }, { status: 500 });
  }
}
