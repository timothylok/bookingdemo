import { createIntakeToken, intakeExpiry } from "../forms/intakeToken";
import { planReminder } from "../reminders/reminders";
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
  sendIntakeEmail(input: { bookingId: number; to: string; patientName: string; token: string; startTime: Date }): Promise<void>;
  scheduleReminder(input: { bookingId: number; kind: string; sendAt: Date }): Promise<void>;
  cancelReminders(bookingId: number): Promise<void>;
  markBookingRescheduled(bookingId: number): Promise<void>;
  /** Re-points the original booking's intake form at the new booking; false if there was none. */
  moveIntakeForm(input: { fromBookingId: number; toBookingId: number; expiresAt: Date }): Promise<boolean>;
};

export type HandleResult = { patientId: number; intakeFormCreated: boolean };

/**
 * Idempotent: Cal.com may redeliver a webhook, so every write is an upsert and the intake form
 * (and its email) is only created once per booking.
 */
export async function handleBookingEvent(
  event: BookingEvent,
  deps: BookingEventDeps,
  now: Date = new Date()
): Promise<HandleResult> {
  const patient = await deps.upsertPatient(event.patient);
  await deps.upsertPatientBooking({
    patientId: patient.id,
    bookingId: event.bookingId,
    bookingUid: event.bookingUid,
    status: event.status,
    startTime: event.startTime,
    endTime: event.endTime,
  });

  const reminder = planReminder(event.trigger, event.startTime, now);
  if (reminder.action === "schedule") {
    await deps.scheduleReminder({ bookingId: event.bookingId, kind: reminder.kind, sendAt: reminder.sendAt });
  } else if (reminder.action === "cancel") {
    await deps.cancelReminders(event.bookingId);
  }

  if (event.trigger === "BOOKING_RESCHEDULED" && event.previousBookingId !== null) {
    // The original booking was cancelled by upstream without its own cancellation webhook.
    await deps.markBookingRescheduled(event.previousBookingId);
    await deps.cancelReminders(event.previousBookingId);
    const moved = await deps.moveIntakeForm({
      fromBookingId: event.previousBookingId,
      toBookingId: event.bookingId,
      expiresAt: intakeExpiry(event.endTime),
    });
    if (moved) return { patientId: patient.id, intakeFormCreated: false };
  }

  const needsForm = event.trigger === "BOOKING_CREATED" || event.trigger === "BOOKING_RESCHEDULED";
  if (!needsForm || (await deps.hasIntakeForm(event.bookingId))) {
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
      bookingId: event.bookingId,
      to: event.patient.email,
      patientName: event.patient.name,
      token,
      startTime: event.startTime,
    });
  }
  return { patientId: patient.id, intakeFormCreated: created };
}
