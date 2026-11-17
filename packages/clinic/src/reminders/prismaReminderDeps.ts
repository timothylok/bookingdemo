import { APP_NAME, WEBAPP_URL } from "@calcom/lib/constants";
import { prisma } from "@calcom/prisma";

import { buildReminderEmail, deliverReminderEmail } from "./reminderEmail";
import type { ReminderDeps } from "./reminders";

const TIME_ZONE = process.env.CLINIC_TIME_ZONE ?? "Pacific/Auckland";

export const prismaReminderDeps: ReminderDeps = {
  findDue(now, limit) {
    return prisma.clinicReminder.findMany({
      where: { status: "pending", sendAt: { lte: now } },
      select: { id: true, bookingId: true, attempts: true },
      orderBy: { sendAt: "asc" },
      take: limit,
    });
  },

  async claim(id) {
    const result = await prisma.clinicReminder.updateMany({
      where: { id, status: "pending" },
      data: { status: "sending", attempts: { increment: 1 } },
    });
    return result.count === 1;
  },

  async send(reminder) {
    const booking = await prisma.booking.findUnique({
      where: { id: reminder.bookingId },
      select: {
        uid: true,
        title: true,
        status: true,
        startTime: true,
        location: true,
        attendees: { select: { name: true, email: true }, orderBy: { id: "asc" }, take: 1 },
      },
    });
    // Rescheduled/cancelled bookings or ones already started no longer need a reminder.
    if (!booking || booking.status !== "ACCEPTED" || booking.startTime.getTime() <= Date.now()) return "skip";
    const attendee = booking.attendees[0];
    if (!attendee) return "skip";

    const email = buildReminderEmail({
      to: attendee.email,
      patientName: attendee.name,
      title: booking.title,
      startTime: booking.startTime,
      location: booking.location,
      clinicName: APP_NAME,
      timeZone: TIME_ZONE,
      manageLink: `${WEBAPP_URL}/booking/${booking.uid}`,
    });
    await deliverReminderEmail(email, reminder.bookingId);
    return "sent";
  },

  async markSent(id, now) {
    await prisma.clinicReminder.update({ where: { id }, data: { status: "sent", sentAt: now }, select: { id: true } });
  },

  async markCancelled(id) {
    await prisma.clinicReminder.update({ where: { id }, data: { status: "cancelled" }, select: { id: true } });
  },

  async markFailed(id, retry, error) {
    await prisma.clinicReminder.update({
      where: { id },
      data: { status: retry ? "pending" : "failed", lastError: error },
      select: { id: true },
    });
  },
};
