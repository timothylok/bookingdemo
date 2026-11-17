import { APP_NAME, WEBAPP_URL } from "@calcom/lib/constants";
import { prisma } from "@calcom/prisma";
import { Prisma } from "@calcom/prisma/client";

import { buildIntakeEmail, deliverIntakeEmail } from "../forms/intakeEmail";
import type { BookingEventDeps } from "./handleBookingEvent";

const CLINIC_TIME_ZONE = process.env.CLINIC_TIME_ZONE ?? "Pacific/Auckland";

export const prismaBookingEventDeps: BookingEventDeps = {
  async upsertPatient(patient) {
    return prisma.clinicPatient.upsert({
      where: { email: patient.email },
      // Keep the latest contact details the patient gave us.
      update: { name: patient.name, ...(patient.phone ? { phone: patient.phone } : {}) },
      create: patient,
      select: { id: true },
    });
  },

  async upsertPatientBooking(input) {
    const { bookingId, ...rest } = input;
    await prisma.clinicPatientBooking.upsert({
      where: { bookingId },
      update: rest,
      create: input,
      select: { id: true },
    });
  },

  async hasIntakeForm(bookingId) {
    const form = await prisma.clinicPatientForm.findUnique({ where: { bookingId }, select: { id: true } });
    return form !== null;
  },

  async createIntakeForm(input) {
    const template = await prisma.clinicFormTemplate.findFirst({
      where: { isDefault: true, active: true },
      select: { id: true },
      orderBy: { id: "asc" },
    });
    if (!template) return { created: false };

    try {
      await prisma.clinicPatientForm.create({
        data: { ...input, templateId: template.id },
        select: { id: true },
      });
      return { created: true };
    } catch (error) {
      // A concurrent redelivery already created the form for this booking.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { created: false };
      throw error;
    }
  },

  async sendIntakeEmail({ to, patientName, token, startTime }) {
    const link = `${WEBAPP_URL}/intake/${token}`;
    const email = buildIntakeEmail({
      to,
      patientName,
      link,
      startTime,
      clinicName: APP_NAME,
      timeZone: CLINIC_TIME_ZONE,
    });
    await deliverIntakeEmail(email, link);
  },
};
