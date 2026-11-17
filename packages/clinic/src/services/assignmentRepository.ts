import { ErrorWithCode } from "@calcom/lib/errors";
import { prisma } from "@calcom/prisma";

import { prismaSyncDeps } from "./prismaSyncDeps";
import { syncAssignment } from "./syncAssignment";

export async function listAssignments(serviceId: number) {
  const assignments = await prisma.clinicServiceAssignment.findMany({
    where: { serviceId },
    select: {
      id: true,
      practitionerUserId: true,
      eventTypeId: true,
      location: { select: { id: true, name: true } },
    },
    orderBy: { id: "asc" },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: assignments.map((a) => a.practitionerUserId) } },
    select: { id: true, name: true, username: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return assignments.map((a) => ({ ...a, practitioner: byId.get(a.practitionerUserId) ?? null }));
}

/** Every active, non-locked user can practise in a single-clinic deployment. */
export function listPractitioners() {
  return prisma.user.findMany({
    where: { locked: false },
    select: { id: true, name: true, username: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 500,
  });
}

export async function assignPractitioner(input: {
  serviceId: number;
  practitionerUserId: number;
  locationId: number | null;
}) {
  // Postgres treats NULL locationIds as distinct, so the unique index alone does not stop duplicates.
  const existing = await prisma.clinicServiceAssignment.findFirst({
    where: input,
    select: { id: true },
  });
  if (existing) {
    throw ErrorWithCode.Factory.BadRequest("This practitioner is already assigned at that location");
  }

  const assignment = await prisma.clinicServiceAssignment.create({ data: input, select: { id: true } });
  return syncAssignment(assignment.id, prismaSyncDeps);
}

/** Hides the EventType instead of deleting it so past and upcoming bookings keep their event type. */
export async function unassignPractitioner(assignmentId: number) {
  const assignment = await prisma.clinicServiceAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, eventTypeId: true },
  });
  if (!assignment) return;

  if (assignment.eventTypeId !== null) {
    await prisma.eventType.updateMany({ where: { id: assignment.eventTypeId }, data: { hidden: true } });
  }
  await prisma.clinicServiceAssignment.delete({ where: { id: assignment.id }, select: { id: true } });
}
