import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.adminAudit.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuSection.deleteMany();
  await prisma.requestEvent.deleteMany();
  await prisma.assignmentHistory.deleteMany();
  await prisma.request.deleteMany();
  await prisma.guestStaySession.deleteMany();
  await prisma.pmsStay.deleteMany();
  await prisma.staffEligibility.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.room.deleteMany();
  await prisma.property.deleteMany();

  console.log("Seeding Property...");
  const property = await prisma.property.create({
    data: {
      name: "HotelXchange Demo Hotel",
      timezone: "Asia/Dubai",
      status: "ACTIVE",
    },
  });

  console.log("Seeding 6 Departments...");
  const hkDept = await prisma.department.create({
    data: { propertyId: property.id, name: "Housekeeping", code: "HK" },
  });
  const engDept = await prisma.department.create({
    data: { propertyId: property.id, name: "Engineering", code: "ENG" },
  });
  const fnbDept = await prisma.department.create({
    data: { propertyId: property.id, name: "Food & Beverage", code: "FNB" },
  });
  const conDept = await prisma.department.create({
    data: { propertyId: property.id, name: "Concierge", code: "CON" },
  });
  const foDept = await prisma.department.create({
    data: { propertyId: property.id, name: "Front Office", code: "FO" },
  });
  const srDept = await prisma.department.create({
    data: { propertyId: property.id, name: "Service Recovery", code: "SR" },
  });

  console.log("Seeding Categories...");
  const catTowels = await prisma.category.create({
    data: {
      departmentId: hkDept.id,
      name: "Towels, Glassware & Amenities",
      slug: "towels-amenities",
      slaTargetMinutes: 15,
      acceptanceTimeoutMinutes: 5,
      formSchema: JSON.stringify([
        "Extra Bath Towels",
        "Hand Towels",
        "Whisky Glass",
        "Wine Glass",
        "Plates & Cutlery Set",
        "Extra Pillow",
        "Warm Blanket",
        "Ice Bucket with Ice",
        "Bottled Mineral Water (500ml)",
        "Dental Kit (Toothbrush)",
        "Shaving Kit",
        "Room Slippers"
      ]),
    },
  });

  const catCleaning = await prisma.category.create({
    data: {
      departmentId: hkDept.id,
      name: "Room Housekeeping & Turn",
      slug: "room-cleaning",
      slaTargetMinutes: 30,
      acceptanceTimeoutMinutes: 5,
      formSchema: JSON.stringify([
        "Full Room Refresh & Cleaning",
        "Bed Linen & Sheet Change",
        "Trash Can Emptying",
        "Bathroom Sanitization"
      ]),
    },
  });

  const catAC = await prisma.category.create({
    data: {
      departmentId: engDept.id,
      name: "AC & Maintenance Issues",
      slug: "ac-maintenance",
      slaTargetMinutes: 25,
      acceptanceTimeoutMinutes: 5,
      formSchema: JSON.stringify([
        "AC Temperature Control Help",
        "Remote Control Battery Replacement",
        "TV / Cable Signal Issue",
        "Room Light Bulb Replacement",
        "Electronic Safe Lock Assistance"
      ]),
    },
  });

  const catPlumbing = await prisma.category.create({
    data: {
      departmentId: engDept.id,
      name: "Plumbing & Hot Water",
      slug: "plumbing-hot-water",
      slaTargetMinutes: 20,
      acceptanceTimeoutMinutes: 5,
      formSchema: JSON.stringify([
        "No Hot Water in Shower",
        "Low Water Pressure",
        "Clogged Sink / Bathroom Drain"
      ]),
    },
  });

  const catFnb = await prisma.category.create({
    data: {
      departmentId: fnbDept.id,
      name: "In-Room Dining Order",
      slug: "fnb-order",
      slaTargetMinutes: 35,
      acceptanceTimeoutMinutes: 5,
      formSchema: JSON.stringify([]),
    },
  });

  const catConcierge = await prisma.category.create({
    data: {
      departmentId: conDept.id,
      name: "Concierge & Local Tours",
      slug: "concierge-assistance",
      slaTargetMinutes: 20,
      acceptanceTimeoutMinutes: 5,
      formSchema: JSON.stringify([
        "Airport Taxi / Shuttle Booking",
        "Luggage Assistance / Storage",
        "City Tour & Attractions Map"
      ]),
    },
  });

  const catFrontOffice = await prisma.category.create({
    data: {
      departmentId: foDept.id,
      name: "Front Desk & Key Cards",
      slug: "front-office-query",
      slaTargetMinutes: 15,
      acceptanceTimeoutMinutes: 5,
      formSchema: JSON.stringify([
        "Key Card Reprogramming / Duplicate",
        "Late Checkout Request",
        "Folio / Bill Invoice Copy"
      ]),
    },
  });

  const catComplaint = await prisma.category.create({
    data: {
      departmentId: srDept.id,
      name: "Guest Complaint & Service Recovery",
      slug: "service-recovery",
      slaTargetMinutes: 15,
      acceptanceTimeoutMinutes: 3,
      priorityRule: "URGENT",
      formSchema: JSON.stringify([
        "Delayed Service Complaint",
        "Room Noise Disturbance",
        "Unresolved Maintenance Issue"
      ]),
    },
  });

  console.log("Seeding Users...");
  await prisma.user.create({
    data: {
      propertyId: property.id,
      name: "Alex Vance (Admin)",
      email: "admin@hotelxchange.com",
      role: UserRole.ADMIN,
    },
  });

  const hkSup = await prisma.user.create({
    data: {
      propertyId: property.id,
      departmentId: hkDept.id,
      name: "Maria Santos (HK Sup)",
      email: "hk.supervisor@hotelxchange.com",
      role: UserRole.SUPERVISOR,
    },
  });
  await prisma.department.update({
    where: { id: hkDept.id },
    data: { supervisorId: hkSup.id },
  });

  const hkStaff1 = await prisma.user.create({
    data: {
      propertyId: property.id,
      departmentId: hkDept.id,
      name: "Carlos Mendez (HK)",
      email: "hk.staff1@hotelxchange.com",
      role: UserRole.STAFF,
    },
  });

  const engStaff1 = await prisma.user.create({
    data: {
      propertyId: property.id,
      departmentId: engDept.id,
      name: "Samir Patel (Eng)",
      email: "eng.staff1@hotelxchange.com",
      role: UserRole.STAFF,
    },
  });

  const fnbStaff1 = await prisma.user.create({
    data: {
      propertyId: property.id,
      departmentId: fnbDept.id,
      name: "Lukas Weber (F&B)",
      email: "fnb.staff1@hotelxchange.com",
      role: UserRole.STAFF,
    },
  });

  console.log("Seeding Staff Eligibility...");
  await prisma.staffEligibility.createMany({
    data: [
      { userId: hkStaff1.id, departmentId: hkDept.id, categoryId: catTowels.id, eligible: true },
      { userId: hkStaff1.id, departmentId: hkDept.id, categoryId: catCleaning.id, eligible: true },
      { userId: engStaff1.id, departmentId: engDept.id, categoryId: catAC.id, eligible: true },
      { userId: fnbStaff1.id, departmentId: fnbDept.id, categoryId: catFnb.id, eligible: true },
    ],
  });

  console.log("Seeding Demo Scenario Section 19: Room 1204 & PMS Stay STAY-10045 (Sharma)...");
  const room1204 = await prisma.room.create({
    data: {
      propertyId: property.id,
      roomNumber: "1204",
      qrToken: "hx-room-1204-qr",
      registeredGuest: "Sharma",
    },
  });

  const room1508 = await prisma.room.create({
    data: {
      propertyId: property.id,
      roomNumber: "1508",
      qrToken: "hx-room-1508-qr",
      registeredGuest: "Vacant / Available",
    },
  });

  const room101 = await prisma.room.create({
    data: {
      propertyId: property.id,
      roomNumber: "101",
      qrToken: "room-101-demo",
      registeredGuest: "Bhai",
    },
  });

  // Seed PMS Stay STAY-10045 for Sharma in Room 1204
  const staySharma = await prisma.pmsStay.create({
    data: {
      propertyId: property.id,
      roomId: room1204.id,
      reservationId: "STAY-10045",
      guestLastName: "Sharma",
      checkInAt: new Date("2026-09-20T10:00:00Z"),
      expectedCheckOutAt: new Date("2026-09-28T12:00:00Z"),
      status: "ACTIVE",
    },
  });

  // Seed PMS Stay STAY-10088 for Bhai in Room 101
  await prisma.pmsStay.create({
    data: {
      propertyId: property.id,
      roomId: room101.id,
      reservationId: "STAY-10088",
      guestLastName: "Bhai",
      checkInAt: new Date("2026-09-21T14:00:00Z"),
      expectedCheckOutAt: new Date("2026-09-29T12:00:00Z"),
      status: "ACTIVE",
    },
  });

  console.log("Seeding F&B Menu...");
  const mainSec = await prisma.menuSection.create({
    data: { propertyId: property.id, name: "Mains & Classics", sortOrder: 1 },
  });
  const drinkSec = await prisma.menuSection.create({
    data: { propertyId: property.id, name: "Beverages & Cocktails", sortOrder: 2 },
  });

  await prisma.menuItem.create({
    data: {
      sectionId: mainSec.id,
      name: "Continental Breakfast Set",
      description: "Fresh croissants, artisan jams, seasonal fruits, freshly squeezed orange juice, coffee/tea.",
      displayPrice: 22.0,
      available: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      sectionId: mainSec.id,
      name: "Wagyu Reserve Beef Burger",
      description: "200g Aged Wagyu beef patty, brioche bun, truffle aioli, aged cheddar & crispy shallots.",
      displayPrice: 28.0,
      available: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      sectionId: drinkSec.id,
      name: "Fresh Mint & Citrus Lemonade",
      description: "Hand-squeezed fresh lemons infused with organic mint leaves.",
      displayPrice: 9.0,
      available: true,
    },
  });

  console.log("Seeding Complete with PMS Stay & Demo Scenario Section 19!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
