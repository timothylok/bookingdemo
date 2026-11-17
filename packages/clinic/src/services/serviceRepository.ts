import { prisma } from "@calcom/prisma";

import { prismaSyncDeps } from "./prismaSyncDeps";
import type { ServiceFormValues } from "./serviceForm";
import { syncAssignment } from "./syncAssignment";

const serviceSelect = {
  id: true,
  name: true,
  durationMin: true,
  priceCents: true,
  currency: true,
  description: true,
  color: true,
  deliveryType: true,
  active: true,
  _count: { select: { assignments: true } },
} as const;

export function listServices() {
  return prisma.clinicService.findMany({ select: serviceSelect, orderBy: [{ active: "desc" }, { name: "asc" }] });
}

export function getService(id: number) {
  return prisma.clinicService.findUnique({ where: { id }, select: serviceSelect });
}

export function createService(values: ServiceFormValues) {
  return prisma.clinicService.create({ data: values, select: { id: true } });
}

export async function updateService(id: number, values: ServiceFormValues) {
  await prisma.clinicService.update({ where: { id }, data: values, select: { id: true } });
  await resyncService(id);
}

export async function setServiceActive(id: number, active: boolean) {
  await prisma.clinicService.update({ where: { id }, data: { active }, select: { id: true } });
  await resyncService(id);
}

// Practitioners' EventTypes must follow catalog edits (title, length, colour, visibility).
async function resyncService(serviceId: number) {
  const assignments = await prisma.clinicServiceAssignment.findMany({
    where: { serviceId },
    select: { id: true },
  });
  for (const assignment of assignments) {
    await syncAssignment(assignment.id, prismaSyncDeps);
  }
}
