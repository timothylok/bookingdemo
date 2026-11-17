import { prisma } from "@calcom/prisma";

import { buildBookingCatalog } from "./bookingCatalog";

export async function getBookingCatalog() {
  const rows = await prisma.clinicServiceAssignment.findMany({
    where: { eventTypeId: { not: null }, service: { active: true } },
    select: {
      practitionerUserId: true,
      eventTypeId: true,
      service: {
        select: {
          id: true,
          name: true,
          durationMin: true,
          priceCents: true,
          currency: true,
          description: true,
          deliveryType: true,
          active: true,
        },
      },
      location: { select: { name: true, active: true } },
    },
  });

  const eventTypeIds = rows.flatMap((row) => (row.eventTypeId === null ? [] : [row.eventTypeId]));
  const [eventTypes, users] = await Promise.all([
    prisma.eventType.findMany({ where: { id: { in: eventTypeIds } }, select: { id: true, slug: true, hidden: true } }),
    prisma.user.findMany({
      where: { id: { in: rows.map((row) => row.practitionerUserId) }, locked: false },
      select: { id: true, name: true, username: true },
    }),
  ]);

  return buildBookingCatalog(rows, eventTypes, users);
}
