import { z } from "zod";

export const HANDLED_TRIGGERS = [
  "BOOKING_CREATED",
  "BOOKING_RESCHEDULED",
  "BOOKING_CANCELLED",
  "BOOKING_REJECTED",
] as const;
export type HandledTrigger = (typeof HANDLED_TRIGGERS)[number];

const attendeeSchema = z.object({
  name: z.string().default(""),
  email: z.string().email(),
  phoneNumber: z.string().nullish(),
});

const webhookSchema = z.object({
  triggerEvent: z.string(),
  payload: z.object({
    bookingId: z.number().int(),
    uid: z.string().min(1),
    startTime: z.string(),
    endTime: z.string(),
    status: z.string().optional(),
    attendees: z.array(attendeeSchema).min(1),
    responses: z.record(z.unknown()).optional(),
    // On BOOKING_RESCHEDULED upstream cancels the original booking and sends its id here.
    rescheduleId: z.number().int().nullish(),
  }),
});

export type BookingEvent = {
  trigger: HandledTrigger;
  bookingId: number;
  bookingUid: string;
  startTime: Date;
  endTime: Date;
  status: string;
  previousBookingId: number | null;
  patient: { name: string; email: string; phone: string | null };
};

export type ParseOutcome = { kind: "event"; event: BookingEvent } | { kind: "ignored" } | { kind: "invalid"; reason: string };

const STATUS_BY_TRIGGER: Record<HandledTrigger, string> = {
  BOOKING_CREATED: "ACCEPTED",
  BOOKING_RESCHEDULED: "ACCEPTED",
  BOOKING_CANCELLED: "CANCELLED",
  BOOKING_REJECTED: "REJECTED",
};

function phoneFromResponses(responses: Record<string, unknown> | undefined): string | null {
  const field = responses?.attendeePhoneNumber;
  if (typeof field === "string") return field || null;
  if (field && typeof field === "object" && "value" in field && typeof field.value === "string") {
    return field.value || null;
  }
  return null;
}

export function parseBookingEvent(body: unknown): ParseOutcome {
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    // Only the field path is reported: payloads contain patient details that must not end up in logs.
    return { kind: "invalid", reason: parsed.error.issues[0]?.path.join(".") || "payload" };
  }

  const { triggerEvent, payload } = parsed.data;
  if (!(HANDLED_TRIGGERS as readonly string[]).includes(triggerEvent)) return { kind: "ignored" };
  const trigger = triggerEvent as HandledTrigger;

  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return { kind: "invalid", reason: "payload.startTime" };
  }

  const attendee = payload.attendees[0];
  return {
    kind: "event",
    event: {
      trigger,
      bookingId: payload.bookingId,
      bookingUid: payload.uid,
      startTime,
      endTime,
      status: STATUS_BY_TRIGGER[trigger],
      previousBookingId: trigger === "BOOKING_RESCHEDULED" ? (payload.rescheduleId ?? null) : null,
      patient: {
        name: attendee.name.trim() || attendee.email,
        email: attendee.email.trim().toLowerCase(),
        phone: phoneFromResponses(payload.responses) ?? attendee.phoneNumber ?? null,
      },
    },
  };
}
