import { db } from "./db";

/**
 * Deterministic round-robin selection of an eligible staff member
 * for a given category & department.
 */
export async function selectNextAssignee(departmentId: string, categoryId: string): Promise<string | null> {
  // 1. Fetch eligible active staff for category
  const eligibleRecords = await db.staffEligibility.findMany({
    where: {
      departmentId,
      categoryId,
      eligible: true,
      active: true,
      user: { active: true },
    },
    include: { user: true },
  });

  let eligibleUsers = eligibleRecords.map((r) => r.user);

  // Fallback: If no specific category eligibility configured, get all active department staff
  if (eligibleUsers.length === 0) {
    eligibleUsers = await db.user.findMany({
      where: {
        departmentId,
        role: "STAFF",
        active: true,
      },
    });
  }

  if (eligibleUsers.length === 0) {
    return null; // No eligible staff available
  }

  if (eligibleUsers.length === 1) {
    return eligibleUsers[0].id;
  }

  // 2. Find last assignment for this department to pick next in line
  const lastAssignment = await db.assignmentHistory.findFirst({
    where: { departmentId },
    orderBy: { assignedAt: "desc" },
  });

  if (!lastAssignment) {
    return eligibleUsers[0].id; // First assignment
  }

  const lastAssigneeIndex = eligibleUsers.findIndex((u) => u.id === lastAssignment.assigneeId);

  if (lastAssigneeIndex === -1 || lastAssigneeIndex === eligibleUsers.length - 1) {
    return eligibleUsers[0].id; // Loop back to start
  }

  return eligibleUsers[lastAssigneeIndex + 1].id;
}
