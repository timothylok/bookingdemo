import { createIntakeToken } from "../forms/intakeToken";
import type { BookingEvent } from "./parseBookingEvent";

export type BookingEventDeps = {
  upsertPatient(patient: BookingEvent["patient"]): Promise<{ id: number }>;
  upsertPatientBooking(input: {
    patientId: number;
    bookingId: number;
    bookingUid: string;
    status: string;
    startTime: Date;
    endTime: Date;
  }): Promise<void>;
  hasIntakeForm(bookingId: number): Promise<boolean>;
  createIntakeForm(input: {
    patientId: number;
    bookingId: number;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{ created: boolean }>;
  sendIntakeEmail(input: { to: string; patientName: string; token: string; startTime: Date }): Promise<void>;
};

export type HandleResult = { patientId: number; intakeFormCreated: boolean };

/**
 * Idempotent: Cal.com may redeliver a webhook, so every write is an upsert and the intake form
 * (and its email) is only created once per booking.
 */
export async function handleBookingEvent(event: BookingEvent, deps: BookingEventDeps): Promise<HandleResult> {
  const patient = await deps.upsertPatient(event.patient);
  await deps.upsertPatientBooking({
    patientId: patient.id,
    bookingId: event.bookingId,
    bookingUid: event.bookingUid,
    status: event.status,
    startTime: event.startTime,
    endTime: event.endTime,
  });

  if (event.trigger !== "BOOKING_CREATED" || (await deps.hasIntakeForm(event.bookingId))) {
    return { patientId: patient.id, intakeFormCreated: false };
  }

  const { token, tokenHash, expiresAt } = createIntakeToken(event.endTime);
  const { created } = await deps.createIntakeForm({
    patientId: patient.id,
    bookingId: event.bookingId,
    tokenHash,
    expiresAt,
  });
  if (created) {
    await deps.sendIntakeEmail({
      to: event.patient.email,
      patientName: event.patient.name,
      token,
      startTime: event.startTime,
    });
  }
  return { patientId: patient.id, intakeFormCreated: created };
}
