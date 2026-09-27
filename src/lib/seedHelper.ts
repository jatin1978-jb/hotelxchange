import { db } from "./db";
import { UserRole, StaffStatus } from "@prisma/client";

let isSeeding = false;

export async function ensureDbSeeded() {
  try {
    const propertyCount = await db.property.count();
    if (propertyCount > 0) return;

    if (isSeeding) return;
    isSeeding = true;

    console.log("Auto-seeding Fortune Park Hotel demo property...");

    // 1. Create Tenant & Property
    const tenant = await db.tenant.create({
      data: {
        name: "Fortune Group",
        code: "fortune-group",
      },
    });

    const chain = await db.chain.create({
      data: {
        tenantId: tenant.id,
        name: "Fortune Hotels",
      },
    });

    const property = await db.property.create({
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

    // 2. Create Property Branding
    await db.propertyBranding.create({
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

    // 3. Create 11 Floors (Ground, Floor 1 to Floor 10)
    const floorList = [];
    for (let f = 1; f <= 10; f++) {
      const fl = await db.floor.create({
        data: {
          propertyId: property.id,
          floorNumber: f,
          name: `Floor ${f}`,
          sortOrder: f,
        },
      });
      floorList.push(fl);
    }

    // 4. Create 6 Departments
    const hkDept = await db.department.create({
      data: { propertyId: property.id, name: "Housekeeping", code: "HK" },
    });
    const engDept = await db.department.create({
      data: { propertyId: property.id, name: "Engineering", code: "ENG" },
    });
    const fnbDept = await db.department.create({
      data: { propertyId: property.id, name: "Food & Beverage", code: "FNB" },
    });
    const conDept = await db.department.create({
      data: { propertyId: property.id, name: "Concierge", code: "CON" },
    });
    const foDept = await db.department.create({
      data: { propertyId: property.id, name: "Front Office", code: "FO" },
    });
    const srDept = await db.department.create({
      data: { propertyId: property.id, name: "Service Recovery", code: "SR" },
    });

    // 5. Create Categories
    const catTowels = await db.category.create({
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

    const catCleaning = await db.category.create({
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

    const catAC = await db.category.create({
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

    const catFnb = await db.category.create({
      data: {
        departmentId: fnbDept.id,
        name: "In-Room Dining Order",
        slug: "fnb-order",
        slaTargetMinutes: 35,
        acceptanceTimeoutMinutes: 5,
        formSchema: JSON.stringify([]),
      },
    });

    const catComplaint = await db.category.create({
      data: {
        departmentId: srDept.id,
        name: "Guest Complaint & Service Recovery",
        slug: "service-recovery",
        slaTargetMinutes: 15,
        acceptanceTimeoutMinutes: 2,
        priorityRule: "URGENT",
        formSchema: JSON.stringify([
          "Delayed Service Complaint",
          "Room Noise Disturbance",
          "Unresolved Maintenance Issue",
        ]),
      },
    });

    // 6. Create Demo Staff Roster (Section 54)
    const adminUser = await db.user.create({
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

    const hkSup = await db.user.create({
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

    await db.department.update({
      where: { id: hkDept.id },
      data: { supervisorId: hkSup.id },
    });

    const hkStaff1 = await db.user.create({
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

    const hkStaff2 = await db.user.create({
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

    const hkStaff3 = await db.user.create({
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

    const fnbManager = await db.user.create({
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

    const fnbStaff = await db.user.create({
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

    const engStaff = await db.user.create({
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

    // 7. Seed Staff Eligibility
    await db.staffEligibility.createMany({
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

    // 8. Create Demo Rooms
    const floor10 = floorList.find((f) => f.floorNumber === 10);
    const floor9 = floorList.find((f) => f.floorNumber === 9);

    const room1008 = await db.room.create({
      data: {
        propertyId: property.id,
        floorId: floor10?.id,
        roomNumber: "1008",
        qrToken: "room-1008-demo",
        registeredGuest: "Sharma",
      },
    });

    const room1204 = await db.room.create({
      data: {
        propertyId: property.id,
        floorId: floor10?.id,
        roomNumber: "1204",
        qrToken: "hx-room-1204-qr",
        registeredGuest: "Sharma",
      },
    });

    const room101 = await db.room.create({
      data: {
        propertyId: property.id,
        floorId: floorList[0]?.id,
        roomNumber: "101",
        qrToken: "room-101-demo",
        registeredGuest: "Bhai",
      },
    });

    const room1508 = await db.room.create({
      data: {
        propertyId: property.id,
        floorId: floor10?.id,
        roomNumber: "1508",
        qrToken: "hx-room-1508-qr",
        registeredGuest: "Vacant / Available",
      },
    });

    // 9. Seed PMS Stays
    await db.pmsStay.create({
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

    await db.pmsStay.create({
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

    await db.pmsStay.create({
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

    // 10. Seed F&B Menu
    const mainSec = await db.menuSection.create({
      data: { propertyId: property.id, name: "Mains & Classics", sortOrder: 1 },
    });
    const drinkSec = await db.menuSection.create({
      data: { propertyId: property.id, name: "Beverages & Cocktails", sortOrder: 2 },
    });

    await db.menuItem.create({
      data: {
        sectionId: mainSec.id,
        name: "Continental Breakfast Set",
        description: "Fresh croissants, artisan jams, seasonal fruits, freshly squeezed orange juice, coffee/tea.",
        displayPrice: 85.0, // AED
        available: true,
      },
    });

    await db.menuItem.create({
      data: {
        sectionId: mainSec.id,
        name: "Wagyu Reserve Beef Burger",
        description: "200g Aged Wagyu beef patty, brioche bun, truffle aioli, aged cheddar & crispy shallots.",
        displayPrice: 110.0, // AED
        available: true,
      },
    });

    await db.menuItem.create({
      data: {
        sectionId: drinkSec.id,
        name: "Fresh Mint & Citrus Lemonade",
        description: "Hand-squeezed fresh lemons infused with organic mint leaves.",
        displayPrice: 35.0, // AED
        available: true,
      },
    });

    console.log("Fortune Park Hotel Phase 2 auto-seeding complete!");
  } catch (err) {
    console.error("Error during Phase 2 auto-seeding:", err);
  } finally {
    isSeeding = false;
  }
}
