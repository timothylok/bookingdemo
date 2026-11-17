import { describe, expect, it, vi } from "vitest";

import { createIntakeToken, hashIntakeToken, isIntakeTokenUsable } from "../forms/intakeToken";
import type { BookingEventDeps } from "./handleBookingEvent";
import { handleBookingEvent } from "./handleBookingEvent";
import type { BookingEvent } from "./parseBookingEvent";
import { parseBookingEvent } from "./parseBookingEvent";
import { signBody, verifyCalSignature } from "./verifySignature";

const payload = (triggerEvent: string, extra: Record<string, unknown> = {}) => ({
  triggerEvent,
  createdAt: "2026-11-17T10:00:00Z",
  payload: {
    bookingId: 42,
    uid: "abc123",
    startTime: "2026-11-20T01:00:00Z",
    endTime: "2026-11-20T02:00:00Z",
    attendees: [{ name: " Jane Patient ", email: "Jane@Example.com", phoneNumber: "+6421000000" }],
    responses: { attendeePhoneNumber: { value: "+6421999999" } },
    ...extra,
  },
});

describe("verifyCalSignature", () => {
  const body = JSON.stringify(payload("BOOKING_CREATED"));

  it("accepts a signature made with the shared secret", () => {
    expect(verifyCalSignature(body, signBody(body, "s3cret"), "s3cret")).toBe(true);
  });

  it("rejects a wrong secret, tampered body, missing header or missing secret", () => {
    const signature = signBody(body, "s3cret");
    expect(verifyCalSignature(body, signBody(body, "other"), "s3cret")).toBe(false);
    expect(verifyCalSignature(`${body} `, signature, "s3cret")).toBe(false);
    expect(verifyCalSignature(body, null, "s3cret")).toBe(false);
    expect(verifyCalSignature(body, signature, undefined)).toBe(false);
    expect(verifyCalSignature(body, "not-hex", "s3cret")).toBe(false);
  });
});

describe("parseBookingEvent", () => {
  it("normalises the patient and prefers the phone from booking responses", () => {
    const outcome = parseBookingEvent(payload("BOOKING_CREATED"));
    expect(outcome).toEqual({
      kind: "event",
      event: {
        trigger: "BOOKING_CREATED",
        bookingId: 42,
        bookingUid: "abc123",
        startTime: new Date("2026-11-20T01:00:00Z"),
        endTime: new Date("2026-11-20T02:00:00Z"),
        status: "ACCEPTED",
        patient: { name: "Jane Patient", email: "jane@example.com", phone: "+6421999999" },
      },
    });
  });

  it("falls back to the attendee phone and maps cancellation status", () => {
    const outcome = parseBookingEvent(payload("BOOKING_CANCELLED", { responses: {} }));
    expect(outcome.kind === "event" && outcome.event.patient.phone).toBe("+6421000000");
    expect(outcome.kind === "event" && outcome.event.status).toBe("CANCELLED");
  });

  it("ignores triggers the clinic does not use", () => {
    expect(parseBookingEvent(payload("MEETING_ENDED"))).toEqual({ kind: "ignored" });
  });

  it("reports only the failing field path for invalid payloads", () => {
    const outcome = parseBookingEvent(payload("BOOKING_CREATED", { attendees: [{ email: "not-an-email" }] }));
    expect(outcome).toEqual({ kind: "invalid", reason: "payload.attendees.0.email" });
  });
});

describe("intake tokens", () => {
  it("hashes the token and expires 24h after the appointment ends", () => {
    const fixed = () => Buffer.alloc(24, 7);
    const { token, tokenHash, expiresAt } = createIntakeToken(new Date("2026-11-20T02:00:00Z"), fixed);
    expect(tokenHash).toBe(hashIntakeToken(token));
    expect(tokenHash).not.toContain(token);
    expect(expiresAt).toEqual(new Date("2026-11-21T02:00:00Z"));
  });

  it("is usable only before expiry and before submission", () => {
    const now = new Date("2026-11-20T00:00:00Z");
    expect(isIntakeTokenUsable({ expiresAt: new Date("2026-11-21T00:00:00Z"), submittedAt: null }, now)).toBe(true);
    expect(isIntakeTokenUsable({ expiresAt: new Date("2026-11-19T00:00:00Z"), submittedAt: null }, now)).toBe(false);
    expect(isIntakeTokenUsable({ expiresAt: new Date("2026-11-21T00:00:00Z"), submittedAt: now }, now)).toBe(false);
  });
});

describe("handleBookingEvent", () => {
  const event = (trigger: BookingEvent["trigger"]): BookingEvent => {
    const outcome = parseBookingEvent(payload(trigger));
    if (outcome.kind !== "event") throw new Error("fixture should parse");
    return outcome.event;
  };

  const makeDeps = (overrides: Partial<BookingEventDeps> = {}): BookingEventDeps => ({
    upsertPatient: vi.fn().mockResolvedValue({ id: 7 }),
    upsertPatientBooking: vi.fn().mockResolvedValue(undefined),
    hasIntakeForm: vi.fn().mockResolvedValue(false),
    createIntakeForm: vi.fn().mockResolvedValue({ created: true }),
    sendIntakeEmail: vi.fn().mockResolvedValue(undefined),
    scheduleReminder: vi.fn().mockResolvedValue(undefined),
    cancelReminders: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  it("creates the patient, booking link, intake form and email for a new booking", async () => {
    const deps = makeDeps();
    expect(await handleBookingEvent(event("BOOKING_CREATED"), deps)).toEqual({ patientId: 7, intakeFormCreated: true });
    expect(deps.upsertPatientBooking).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 7, bookingId: 42, status: "ACCEPTED" })
    );
    expect(deps.createIntakeForm).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 7, bookingId: 42, tokenHash: expect.any(String) })
    );
    expect(deps.sendIntakeEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "jane@example.com", token: expect.any(String) })
    );
  });

  it("does not create a second form or email on redelivery", async () => {
    const deps = makeDeps({ hasIntakeForm: vi.fn().mockResolvedValue(true) });
    expect((await handleBookingEvent(event("BOOKING_CREATED"), deps)).intakeFormCreated).toBe(false);
    expect(deps.createIntakeForm).not.toHaveBeenCalled();
    expect(deps.sendIntakeEmail).not.toHaveBeenCalled();
  });

  it("skips the email when a concurrent delivery won the insert race", async () => {
    const deps = makeDeps({ createIntakeForm: vi.fn().mockResolvedValue({ created: false }) });
    await handleBookingEvent(event("BOOKING_CREATED"), deps);
    expect(deps.sendIntakeEmail).not.toHaveBeenCalled();
  });

  it("schedules the 24h reminder for a new booking", async () => {
    const deps = makeDeps();
    await handleBookingEvent(event("BOOKING_CREATED"), deps, new Date("2026-11-17T10:00:00Z"));
    expect(deps.scheduleReminder).toHaveBeenCalledWith({
      bookingId: 42,
      kind: "email_24h",
      sendAt: new Date("2026-11-19T01:00:00Z"),
    });
  });

  it("only updates the booking status and cancels reminders on cancellation", async () => {
    const deps = makeDeps();
    await handleBookingEvent(event("BOOKING_CANCELLED"), deps);
    expect(deps.cancelReminders).toHaveBeenCalledWith(42);
    expect(deps.upsertPatientBooking).toHaveBeenCalledWith(expect.objectContaining({ status: "CANCELLED" }));
    expect(deps.createIntakeForm).not.toHaveBeenCalled();
  });
});
