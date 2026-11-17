import { prisma } from "@calcom/prisma";

import type { EventTypeData } from "./eventTypeMapping";
import { uniqueSlug } from "./eventTypeMapping";
import type { SyncDeps } from "./syncAssignment";

export const prismaSyncDeps: SyncDeps = {
  async findAssignment(id) {
    const row = await prisma.clinicServiceAssignment.findUnique({
      where: { id },
      select: {
        id: true,
        practitionerUserId: true,
        eventTypeId: true,
        service: {
          select: {
            name: true,
            durationMin: true,
            description: true,
            color: true,
            deliveryType: true,
            active: true,
          },
        },
        location: { select: { name: true, address: true, phone: true, kind: true, active: true } },
      },
    });
    return row;
  },

  async createEventType(userId, data) {
    const existing = await prisma.eventType.findMany({
      where: { userId, slug: { startsWith: data.slug } },
      select: { slug: true },
    });
    const slug = uniqueSlug(data.slug, new Set(existing.map((e) => e.slug)));

    return prisma.eventType.create({
      data: {
        ...data,
        slug,
        userId,
        users: { connect: { id: userId } },
      },
      select: { id: true },
    });
  },

  async updateEventType(eventTypeId, data: EventTypeData) {
    // Slug is left alone so a renamed service does not break the practitioner's public booking link.
    const { slug: _keepExistingSlug, ...rest } = data;
    const result = await prisma.eventType.updateMany({ where: { id: eventTypeId }, data: rest });
    return result.count > 0;
  },

  async linkAssignment(assignmentId, eventTypeId) {
    await prisma.clinicServiceAssignment.update({
      where: { id: assignmentId },
      data: { eventTypeId },
      select: { id: true },
    });
  },
};
