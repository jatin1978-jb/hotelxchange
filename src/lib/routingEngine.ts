import { db } from "./db";
import { UserRole, StaffStatus, AlertSeverity, AlertType } from "@prisma/client";

export interface RoutingInput {
  propertyId: string;
  departmentId: string;
  categoryId: string;
  roomId: string;
  floorId?: string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface RoutingResult {
  assignedUserId: string | null;
  status: "ASSIGNED" | "UNASSIGNED";
  eligiblePoolCount: number;
  message: string;
}

export async function routeRequest(input: RoutingInput): Promise<RoutingResult> {
  try {
    const { propertyId, departmentId, categoryId, roomId } = input;

    // 1. Resolve Room & Floor Details
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { floor: true },
    });

    const floorNumber = room?.floor?.floorNumber || (room ? parseInt(room.roomNumber.slice(0, -2)) || 10 : 10);

    // 2. Fetch all staff members in department
    const candidateStaff = await db.user.findMany({
      where: {
        propertyId,
        departmentId,
        active: true,
        role: { in: [UserRole.STAFF, UserRole.SUPERVISOR] },
      },
      include: {
        eligibility: true,
        assignedRequests: {
          where: {
            status: { in: ["ACCEPTED", "IN_PROGRESS", "PREPARING"] },
          },
        },
      },
    });

    // 3. Filter Eligible Pool:
    // a. Availability Status must be AVAILABLE (not BUSY, ON_BREAK, OFFLINE)
    // b. Must not exceed maxActiveRequests
    // c. Category Eligibility (if category eligibility exists for category)
    // d. Floor Eligibility (assignedFloors matches floorNumber or is empty/all)
    const eligiblePool = candidateStaff.filter((staff) => {
      // Must be AVAILABLE
      if (staff.availabilityStatus !== StaffStatus.AVAILABLE) return false;

      // Active workload limit
      if (staff.assignedRequests.length >= staff.maxActiveRequests) return false;

      // Check floor match if assignedFloors specified
      if (staff.assignedFloors && staff.assignedFloors !== "[]") {
        try {
          const floors: number[] = JSON.parse(staff.assignedFloors);
          if (floors.length > 0 && !floors.includes(floorNumber)) {
            return false;
          }
        } catch (e) {
          // ignore parse error
        }
      }

      // Check category eligibility
      if (staff.eligibility.length > 0) {
        const hasMatch = staff.eligibility.some(
          (e) => e.eligible && (e.categoryId === categoryId || e.categoryId === null)
        );
        if (!hasMatch) return false;
      }

      return true;
    });

    // 4. Handle Case: NO STAFF AVAILABLE
    if (eligiblePool.length === 0) {
      console.warn(`No eligible staff available for Dept: ${departmentId}, Floor: ${floorNumber}`);
      return {
        assignedUserId: null,
        status: "UNASSIGNED",
        eligiblePoolCount: 0,
        message: "No staff member is currently available. Request flagged as UNASSIGNED for Supervisor.",
      };
    }

    // 5. Apply Round-Robin Strategy across Eligible Pool
    // Get last assignment history for this department to determine next candidate
    const lastAssignment = await db.assignmentHistory.findFirst({
      where: { departmentId },
      orderBy: { assignedAt: "desc" },
    });

    let selectedStaff = eligiblePool[0];

    if (lastAssignment && eligiblePool.length > 1) {
      const lastIndex = eligiblePool.findIndex((s) => s.id === lastAssignment.assigneeId);
      if (lastIndex !== -1) {
        const nextIndex = (lastIndex + 1) % eligiblePool.length;
        selectedStaff = eligiblePool[nextIndex];
      }
    }

    return {
      assignedUserId: selectedStaff.id,
      status: "ASSIGNED",
      eligiblePoolCount: eligiblePool.length,
      message: `Assigned to ${selectedStaff.name} (${selectedStaff.staffId || selectedStaff.designation}) via Round-Robin.`,
    };
  } catch (error) {
    console.error("Routing Engine error:", error);
    return {
      assignedUserId: null,
      status: "UNASSIGNED",
      eligiblePoolCount: 0,
      message: "Routing calculation error",
    };
  }
}
