import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@calcom/prisma";

import { assignPractitioner, listAssignments, unassignPractitioner } from "./assignmentRepository";

// Needs a migrated + seeded local database (uses the seeded pro@example.com user).
describe("assignment repository", () => {
  let userId: number;
  let serviceId: number;
  let eventTypeId: number;

  beforeAll(async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "pro@example.com" },
      select: { id: true },
    });
    userId = user.id;
    const service = await prisma.clinicService.create({
      data: { name: "IT Assign Check", durationMin: 30, deliveryType: "video" },
      select: { id: true },
    });
    serviceId = service.id;
  });

  afterAll(async () => {
    await prisma.clinicServiceAssignment.deleteMany({ where: { serviceId } });
    if (eventTypeId) await prisma.eventType.deleteMany({ where: { id: eventTypeId } });
    await prisma.clinicService.deleteMany({ where: { id: serviceId } });
  });

  it("assigns a practitioner, creating a linked EventType", async () => {
    const result = await assignPractitioner({ serviceId, practitionerUserId: userId, locationId: null });
    eventTypeId = result.eventTypeId;

    const assignments = await listAssignments(serviceId);
    expect(assignments).toHaveLength(1);
    expect(assignments[0]).toMatchObject({ practitionerUserId: userId, eventTypeId, location: null });
    expect(assignments[0].practitioner?.id).toBe(userId);
  });

  it("refuses a duplicate assignment even with a null location", async () => {
    await expect(
      assignPractitioner({ serviceId, practitionerUserId: userId, locationId: null })
    ).rejects.toThrow("already assigned");
  });

  it("unassigning hides the EventType and removes the assignment", async () => {
    const [assignment] = await listAssignments(serviceId);
    await unassignPractitioner(assignment.id);

    expect(await listAssignments(serviceId)).toHaveLength(0);
    const eventType = await prisma.eventType.findUniqueOrThrow({
      where: { id: eventTypeId },
      select: { hidden: true },
    });
    expect(eventType.hidden).toBe(true);
  });
});
