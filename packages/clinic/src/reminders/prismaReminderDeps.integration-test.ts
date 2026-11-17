import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@calcom/prisma";

import { prismaReminderDeps } from "./prismaReminderDeps";
import { processDueReminders } from "./reminders";

// Needs a migrated + seeded local database (uses an upcoming accepted booking of pro@example.com).
describe("processDueReminders with Prisma", () => {
  const MISSING_BOOKING_ID = 2_000_000_001;
  let liveBookingId: number;
  let reminderIds: number[] = [];

  beforeAll(async () => {
    const booking = await prisma.booking.findFirstOrThrow({
      where: { user: { email: "pro@example.com" }, status: "ACCEPTED", startTime: { gt: new Date() } },
      select: { id: true },
      orderBy: { startTime: "asc" },
    });
    liveBookingId = booking.id;

    const past = new Date(Date.now() - 60_000);
    const created = await Promise.all([
      prisma.clinicReminder.create({
        data: { bookingId: liveBookingId, kind: "it_test", sendAt: past },
        select: { id: true },
      }),
      prisma.clinicReminder.create({
        data: { bookingId: MISSING_BOOKING_ID, kind: "it_test", sendAt: past },
        select: { id: true },
      }),
    ]);
    reminderIds = created.map((r) => r.id);
  });

  afterAll(async () => {
    await prisma.clinicReminder.deleteMany({ where: { id: { in: reminderIds } } });
  });

  it("sends reminders for live bookings and cancels ones whose booking is gone", async () => {
    await processDueReminders(new Date(), prismaReminderDeps);

    const rows = await prisma.clinicReminder.findMany({
      where: { id: { in: reminderIds } },
      select: { bookingId: true, status: true, attempts: true, sentAt: true },
    });
    const live = rows.find((r) => r.bookingId === liveBookingId);
    const missing = rows.find((r) => r.bookingId === MISSING_BOOKING_ID);
    expect(live).toMatchObject({ status: "sent", attempts: 1 });
    expect(live?.sentAt).not.toBeNull();
    expect(missing).toMatchObject({ status: "cancelled" });
  });

  it("does nothing on a second run (idempotent)", async () => {
    const summary = await processDueReminders(new Date(), {
      ...prismaReminderDeps,
      findDue: async (now, limit) =>
        (await prismaReminderDeps.findDue(now, limit)).filter((r) => reminderIds.includes(r.id)),
    });
    expect(summary.claimed).toBe(0);
  });
});
