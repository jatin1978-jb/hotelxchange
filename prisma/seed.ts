import { PrismaClient, UserRole, StaffStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.adminAudit.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.notificationDevice.deleteMany();
  await prisma.routingRule.deleteMany();
  await prisma.staffShift.deleteMany();
  await prisma.shift.deleteMany();
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
  await prisma.floor.deleteMany();
  await prisma.propertyBranding.deleteMany();
  await prisma.property.deleteMany();
  await prisma.chain.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("Seeding Tenant & Property (Fortune Park Hotel)...");
  const tenant = await prisma.tenant.create({
    data: {
      id: "tenant-fortune",
      name: "Fortune Group",
      code: "fortune-group",
    },
  });

  const chain = await prisma.chain.create({
    data: {
      tenantId: tenant.id,
      name: "Fortune Hotels",
    },
  });

  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      chainId: chain.id,
      name: "Fortune Park Hotel",
      shortName: "Fortune Park",
      address: "Dubai Investment Park, Dubai, UAE",
      city: "Dubai",
      country: "UAE",
      timezone: "Asia/Dubai",
      currency: "AED",
      phone: "+971 4 885 4888",
      email: "info@fortuneparkhotel.ae",
      status: "ACTIVE",
    },
  });

  await prisma.propertyBranding.create({
    data: {
      propertyId: property.id,
      hotelName: "Fortune Park Hotel",
      shortName: "Fortune Park",
      logoUrl: "https://fortunehotels.ae/wp-content/uploads/2021/04/fortune-logo-1.png",
      primaryColor: "#0A4D7E",
      secondaryColor: "#B89759",
      accentColor: "#10B981",
      loginWelcomeText: "Welcome to Fortune Park Hotel",
      staffPortalTitle: "HotelXchange Operations",
      footerText: "© 2026 Fortune Park Hotel • Powered by HotelXchange",
    },
  });

  console.log("Seeding 10 Floors...");
  const floorList = [];
  for (let f = 1; f <= 10; f++) {
    const fl = await prisma.floor.create({
      data: {
        propertyId: property.id,
        floorNumber: f,
        name: `Floor ${f}`,
        sortOrder: f,
      },
    });
    floorList.push(fl);
  }

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
      acceptanceTimeoutMinutes: 2,
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
        "Room Slippers",
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
        "Bathroom Sanitization",
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
        "Electronic Safe Lock Assistance",
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

  console.log("Seeding Demo Staff Roster (Section 54)...");
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      staffId: "ADM001",
      employeeCode: "EMP-001",
      name: "Alex Vance (Admin)",
      email: "admin@fortuneparkhotel.ae",
      role: UserRole.PROPERTY_ADMIN,
      designation: "Property General Manager",
      availabilityStatus: StaffStatus.AVAILABLE,
    },
  });

  const hkSup = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      departmentId: hkDept.id,
      staffId: "HK1004",
      employeeCode: "EMP-1004",
      name: "David Thomas (HK Sup)",
      email: "hk.supervisor@fortuneparkhotel.ae",
      role: UserRole.SUPERVISOR,
      designation: "Housekeeping Supervisor",
      assignedFloors: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      availabilityStatus: StaffStatus.AVAILABLE,
    },
  });

  await prisma.department.update({
    where: { id: hkDept.id },
    data: { supervisorId: hkSup.id },
  });

  const hkStaff1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      departmentId: hkDept.id,
      staffId: "HK1001",
      employeeCode: "EMP-1001",
      name: "Ahmed Khan (HK)",
      email: "hk.staff1@fortuneparkhotel.ae",
      role: UserRole.STAFF,
      designation: "Room Attendant",
      assignedFloors: JSON.stringify([10]),
      availabilityStatus: StaffStatus.AVAILABLE,
    },
  });

  const hkStaff2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      departmentId: hkDept.id,
      staffId: "HK1002",
      employeeCode: "EMP-1002",
      name: "Maria Joseph (HK)",
      email: "hk.staff2@fortuneparkhotel.ae",
      role: UserRole.STAFF,
      designation: "Room Attendant",
      assignedFloors: JSON.stringify([10]),
      availabilityStatus: StaffStatus.AVAILABLE,
    },
  });

  const hkStaff3 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      departmentId: hkDept.id,
      staffId: "HK1003",
      employeeCode: "EMP-1003",
      name: "John Mathew (HK)",
      email: "hk.staff3@fortuneparkhotel.ae",
      role: UserRole.STAFF,
      designation: "Room Attendant",
      assignedFloors: JSON.stringify([9]),
      availabilityStatus: StaffStatus.AVAILABLE,
    },
  });

  const fnbManager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      departmentId: fnbDept.id,
      staffId: "FB2001",
      employeeCode: "EMP-2001",
      name: "Sarah (F&B Mgr)",
      email: "fnb.manager@fortuneparkhotel.ae",
      role: UserRole.FNB_MANAGER,
      designation: "F&B Operations Manager",
      assignedFloors: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      availabilityStatus: StaffStatus.AVAILABLE,
    },
  });

  const fnbStaff = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      departmentId: fnbDept.id,
      staffId: "FB2002",
      employeeCode: "EMP-2002",
      name: "Ali (F&B Staff)",
      email: "fnb.staff@fortuneparkhotel.ae",
      role: UserRole.STAFF,
      designation: "In-Room Dining Server",
      assignedFloors: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      availabilityStatus: StaffStatus.AVAILABLE,
    },
  });

  const engStaff = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      departmentId: engDept.id,
      staffId: "EN3001",
      employeeCode: "EMP-3001",
      name: "David (Engineer)",
      email: "eng.staff@fortuneparkhotel.ae",
      role: UserRole.STAFF,
      designation: "Duty Maintenance Engineer",
      assignedFloors: JSON.stringify([8, 9, 10]),
      availabilityStatus: StaffStatus.AVAILABLE,
    },
  });

  console.log("Seeding Staff Eligibility...");
  await prisma.staffEligibility.createMany({
    data: [
      { userId: hkStaff1.id, departmentId: hkDept.id, categoryId: catTowels.id, eligible: true },
      { userId: hkStaff1.id, departmentId: hkDept.id, categoryId: catCleaning.id, eligible: true },
      { userId: hkStaff2.id, departmentId: hkDept.id, categoryId: catTowels.id, eligible: true },
      { userId: hkStaff2.id, departmentId: hkDept.id, categoryId: catCleaning.id, eligible: true },
      { userId: hkStaff3.id, departmentId: hkDept.id, categoryId: catTowels.id, eligible: true },
      { userId: engStaff.id, departmentId: engDept.id, categoryId: catAC.id, eligible: true },
      { userId: fnbStaff.id, departmentId: fnbDept.id, categoryId: catFnb.id, eligible: true },
    ],
  });

  console.log("Seeding Demo Rooms...");
  const floor10 = floorList.find((f) => f.floorNumber === 10);

  const room1008 = await prisma.room.create({
    data: {
      propertyId: property.id,
      floorId: floor10?.id,
      roomNumber: "1008",
      qrToken: "room-1008-demo",
      registeredGuest: "Sharma",
    },
  });

  const room1204 = await prisma.room.create({
    data: {
      propertyId: property.id,
      floorId: floor10?.id,
      roomNumber: "1204",
      qrToken: "hx-room-1204-qr",
      registeredGuest: "Sharma",
    },
  });

  const room101 = await prisma.room.create({
    data: {
      propertyId: property.id,
      floorId: floorList[0]?.id,
      roomNumber: "101",
      qrToken: "room-101-demo",
      registeredGuest: "Bhai",
    },
  });

  const room1508 = await prisma.room.create({
    data: {
      propertyId: property.id,
      floorId: floor10?.id,
      roomNumber: "1508",
      qrToken: "hx-room-1508-qr",
      registeredGuest: "Vacant / Available",
    },
  });

  console.log("Seeding PMS Stays...");
  await prisma.pmsStay.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      roomId: room1204.id,
      reservationId: "STAY-10045",
      guestLastName: "Sharma",
      checkInAt: new Date("2026-09-20T10:00:00Z"),
      expectedCheckOutAt: new Date("2026-09-30T12:00:00Z"),
      status: "ACTIVE",
    },
  });

  await prisma.pmsStay.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      roomId: room1008.id,
      reservationId: "STAY-10008",
      guestLastName: "Sharma",
      checkInAt: new Date("2026-09-21T10:00:00Z"),
      expectedCheckOutAt: new Date("2026-09-30T12:00:00Z"),
      status: "ACTIVE",
    },
  });

  await prisma.pmsStay.create({
    data: {
      tenantId: tenant.id,
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
      displayPrice: 85.0,
      available: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      sectionId: mainSec.id,
      name: "Wagyu Reserve Beef Burger",
      description: "200g Aged Wagyu beef patty, brioche bun, truffle aioli, aged cheddar & crispy shallots.",
      displayPrice: 110.0,
      available: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      sectionId: drinkSec.id,
      name: "Fresh Mint & Citrus Lemonade",
      description: "Hand-squeezed fresh lemons infused with organic mint leaves.",
      displayPrice: 35.0,
      available: true,
    },
  });

  console.log("Seeding Complete for Fortune Park Hotel Phase 2!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
