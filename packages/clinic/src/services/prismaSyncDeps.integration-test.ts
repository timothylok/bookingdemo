import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@calcom/prisma";

import { prismaSyncDeps } from "./prismaSyncDeps";
import { syncAssignment } from "./syncAssignment";

// Needs a migrated + seeded local database (uses the seeded pro@example.com user).
describe("syncAssignment with the Prisma adapter", () => {
  let userId: number;
  let serviceId: number;
  let locationId: number;
  let assignmentId: number;
  const createdEventTypeIds: number[] = [];

  beforeAll(async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "pro@example.com" },
      select: { id: true },
    });
    userId = user.id;

    const location = await prisma.clinicLocation.create({
      data: { name: "IT Clinic", address: "1 Test St", kind: "clinic" },
      select: { id: true },
    });
    locationId = location.id;

    const service = await prisma.clinicService.create({
      data: { name: "IT Consultation", durationMin: 45, color: "#3b82f6", deliveryType: "clinic" },
      select: { id: true },
    });
    serviceId = service.id;

    const assignment = await prisma.clinicServiceAssignment.create({
      data: { serviceId, practitionerUserId: userId, locationId },
      select: { id: true },
    });
    assignmentId = assignment.id;
  });

  afterAll(async () => {
    await prisma.clinicServiceAssignment.deleteMany({ where: { id: assignmentId } });
    await prisma.eventType.deleteMany({ where: { id: { in: createdEventTypeIds } } });
    await prisma.clinicService.deleteMany({ where: { id: serviceId } });
    await prisma.clinicLocation.deleteMany({ where: { id: locationId } });
  });

  it("creates a visible EventType owned by the practitioner and links it", async () => {
    const result = await syncAssignment(assignmentId, prismaSyncDeps);
    createdEventTypeIds.push(result.eventTypeId);

    expect(result.action).toBe("created");
    const eventType = await prisma.eventType.findUniqueOrThrow({
      where: { id: result.eventTypeId },
      select: { title: true, slug: true, length: true, hidden: true, userId: true, locations: true },
    });
    expect(eventType).toMatchObject({
      title: "IT Consultation - IT Clinic",
      slug: "it-consultation-it-clinic",
      length: 45,
      hidden: false,
      userId,
    });
    expect(eventType.locations).toEqual([{ type: "inPerson", address: "1 Test St", displayLocationPublicly: true }]);

    const link = await prisma.clinicServiceAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
      select: { eventTypeId: true },
    });
    expect(link.eventTypeId).toBe(result.eventTypeId);
  });

  it("updates in place, keeps the slug and hides it when the service is deactivated", async () => {
    await prisma.clinicService.update({
      where: { id: serviceId },
      data: { name: "IT Consultation Renamed", active: false },
      select: { id: true },
    });

    const result = await syncAssignment(assignmentId, prismaSyncDeps);
    expect(result.action).toBe("updated");

    const eventType = await prisma.eventType.findUniqueOrThrow({
      where: { id: result.eventTypeId },
      select: { title: true, slug: true, hidden: true },
    });
    expect(eventType).toEqual({
      title: "IT Consultation Renamed - IT Clinic",
      slug: "it-consultation-it-clinic",
      hidden: true,
    });
  });

  it("recreates the EventType if the practitioner deleted it", async () => {
    const link = await prisma.clinicServiceAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
      select: { eventTypeId: true },
    });
    await prisma.eventType.delete({ where: { id: link.eventTypeId ?? -1 } });

    const result = await syncAssignment(assignmentId, prismaSyncDeps);
    createdEventTypeIds.push(result.eventTypeId);
    expect(result.action).toBe("created");
  });
});
