import { prisma } from "@calcom/prisma";

import type { AppointmentInput } from "./receptionView";

/** Clinic practitioners are users with at least one clinic service assignment. */
export async function listClinicPractitioners() {
  const assigned = await prisma.clinicServiceAssignment.findMany({
    distinct: ["practitionerUserId"],
    select: { practitionerUserId: true },
  });
  return prisma.user.findMany({
    where: { id: { in: assigned.map((a) => a.practitionerUserId) } },
    select: { id: true, name: true, username: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export async function listAppointments(input: {
  start: Date;
  end: Date;
  practitionerIds: number[];
}): Promise<{ bookings: AppointmentInput[]; intakeByBookingId: Map<number, { submittedAt: Date | null }> }> {
  if (input.practitionerIds.length === 0) return { bookings: [], intakeByBookingId: new Map() };

  const bookings = await prisma.booking.findMany({
    where: {
      userId: { in: input.practitionerIds },
      startTime: { gte: input.start, lt: input.end },
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      status: true,
      userId: true,
      attendees: { select: { name: true, email: true, noShow: true }, orderBy: { id: "asc" } },
    },
    orderBy: { startTime: "asc" },
    take: 1000,
  });

  const forms = await prisma.clinicPatientForm.findMany({
    where: { bookingId: { in: bookings.map((b) => b.id) } },
    select: { bookingId: true, submittedAt: true },
  });

  return {
    bookings: bookings.map((b) => ({ ...b, status: b.status.toUpperCase() })),
    intakeByBookingId: new Map(forms.map((f) => [f.bookingId, { submittedAt: f.submittedAt }])),
  };
}

/** Only bookings of clinic practitioners can be changed from reception. */
export async function setAppointmentNoShow(bookingId: number, noShow: boolean): Promise<boolean> {
  const practitionerIds = (await listClinicPractitioners()).map((p) => p.id);
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: { in: practitionerIds } },
    select: { id: true },
  });
  if (!booking) return false;

  await prisma.attendee.updateMany({ where: { bookingId: booking.id }, data: { noShow } });
  return true;
}
