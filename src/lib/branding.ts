import { db } from "./db";

export interface BrandingConfig {
  hotelName: string;
  shortName: string;
  logoUrl: string;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  loginBgUrl?: string | null;
  loginWelcomeText: string;
  staffPortalTitle: string;
  footerText: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  timezone: string;
  phone: string;
  email: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  hotelName: "Fortune Park Hotel",
  shortName: "Fortune Park",
  logoUrl: "https://fortunehotels.ae/wp-content/uploads/2021/04/fortune-logo-1.png",
  faviconUrl: null,
  primaryColor: "#0A4D7E",
  secondaryColor: "#B89759",
  accentColor: "#10B981",
  loginBgUrl: null,
  loginWelcomeText: "Welcome to Fortune Park Hotel",
  staffPortalTitle: "HotelXchange Operations",
  footerText: "© 2026 Fortune Park Hotel • Powered by HotelXchange",
  address: "Dubai Investment Park, Dubai, UAE",
  city: "Dubai",
  country: "UAE",
  currency: "AED",
  timezone: "Asia/Dubai",
  phone: "+971 4 885 4888",
  email: "info@fortuneparkhotel.ae",
};

export async function getPropertyBranding(propertyId?: string): Promise<BrandingConfig> {
  try {
    const property = propertyId
      ? await db.property.findUnique({
          where: { id: propertyId },
          include: { branding: true },
        })
      : await db.property.findFirst({
          include: { branding: true },
        });

    if (!property) return DEFAULT_BRANDING;

    const b = property.branding;
    return {
      hotelName: b?.hotelName || property.name || DEFAULT_BRANDING.hotelName,
      shortName: b?.shortName || property.shortName || DEFAULT_BRANDING.shortName,
      logoUrl: b?.logoUrl || DEFAULT_BRANDING.logoUrl,
      faviconUrl: b?.faviconUrl || DEFAULT_BRANDING.faviconUrl,
      primaryColor: b?.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: b?.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      accentColor: b?.accentColor || DEFAULT_BRANDING.accentColor,
      loginBgUrl: b?.loginBgUrl || DEFAULT_BRANDING.loginBgUrl,
      loginWelcomeText: b?.loginWelcomeText || DEFAULT_BRANDING.loginWelcomeText,
      staffPortalTitle: b?.staffPortalTitle || DEFAULT_BRANDING.staffPortalTitle,
      footerText: b?.footerText || DEFAULT_BRANDING.footerText,
      address: property.address || DEFAULT_BRANDING.address,
      city: property.city || DEFAULT_BRANDING.city,
      country: property.country || DEFAULT_BRANDING.country,
      currency: property.currency || DEFAULT_BRANDING.currency,
      timezone: property.timezone || DEFAULT_BRANDING.timezone,
      phone: property.phone || DEFAULT_BRANDING.phone,
      email: property.email || DEFAULT_BRANDING.email,
    };
  } catch (error) {
    console.error("Error fetching branding:", error);
    return DEFAULT_BRANDING;
  }
}
