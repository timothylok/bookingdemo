import { prisma } from "@calcom/prisma";

import { normalisePatientQuery } from "./patientView";

export async function listPatients(query: string | undefined) {
  const search = normalisePatientQuery(query);
  return prisma.clinicPatient.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search.text, mode: "insensitive" } },
            { email: { contains: search.text.toLowerCase() } },
            ...(search.digits.length >= 3 ? [{ phone: { contains: search.digits } }] : []),
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      _count: { select: { bookings: true } },
      bookings: { select: { startTime: true }, orderBy: { startTime: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function getPatientDetail(id: number) {
  const patient = await prisma.clinicPatient.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      bookings: {
        select: { bookingId: true, status: true, startTime: true, endTime: true },
        orderBy: { startTime: "desc" },
      },
      forms: {
        select: {
          bookingId: true,
          submittedAt: true,
          responseJson: true,
          template: { select: { name: true, schemaJson: true } },
        },
      },
    },
  });
  if (!patient) return null;

  // Booking title and practitioner come from upstream rows (no Prisma relation by design).
  const bookings = await prisma.booking.findMany({
    where: { id: { in: patient.bookings.map((b) => b.bookingId) } },
    select: { id: true, title: true, userId: true, user: { select: { name: true, username: true } } },
  });
  const bookingById = new Map(bookings.map((b) => [b.id, b]));

  return { ...patient, bookingById };
}
