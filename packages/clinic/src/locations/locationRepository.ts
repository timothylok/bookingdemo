import { prisma } from "@calcom/prisma";

import { prismaSyncDeps } from "../services/prismaSyncDeps";
import { syncAssignment } from "../services/syncAssignment";
import type { LocationFormValues } from "./locationForm";

const locationSelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
  kind: true,
  active: true,
  _count: { select: { assignments: true } },
} as const;

export function listLocations() {
  return prisma.clinicLocation.findMany({
    select: locationSelect,
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export function getLocation(id: number) {
  return prisma.clinicLocation.findUnique({ where: { id }, select: locationSelect });
}

export function createLocation(values: LocationFormValues) {
  return prisma.clinicLocation.create({ data: values, select: { id: true } });
}

export async function updateLocation(id: number, values: LocationFormValues) {
  await prisma.clinicLocation.update({ where: { id }, data: values, select: { id: true } });
  await resyncLocation(id);
}

export async function setLocationActive(id: number, active: boolean) {
  await prisma.clinicLocation.update({ where: { id }, data: { active }, select: { id: true } });
  await resyncLocation(id);
}

// Address or kind changes must reach every EventType offered at this location.
async function resyncLocation(locationId: number) {
  const assignments = await prisma.clinicServiceAssignment.findMany({
    where: { locationId },
    select: { id: true },
  });
  for (const assignment of assignments) {
    await syncAssignment(assignment.id, prismaSyncDeps);
  }
}
