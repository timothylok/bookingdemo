import { describe, expect, it, vi } from "vitest";

import type { ReminderDeps } from "./reminders";
import { EMAIL_24H, planReminder, processDueReminders } from "./reminders";

const now = new Date("2026-11-17T10:00:00Z");

describe("planReminder", () => {
  it("schedules an email 24h before a new or rescheduled appointment", () => {
    const start = new Date("2026-11-20T01:00:00Z");
    const expected = { action: "schedule", kind: EMAIL_24H, sendAt: new Date("2026-11-19T01:00:00Z") };
    expect(planReminder("BOOKING_CREATED", start, now)).toEqual(expected);
    expect(planReminder("BOOKING_RESCHEDULED", start, now)).toEqual(expected);
  });

  it("skips the reminder when the appointment is less than 24h away", () => {
    expect(planReminder("BOOKING_CREATED", new Date("2026-11-18T09:00:00Z"), now)).toEqual({ action: "none" });
  });

  it("cancels on cancellation or rejection", () => {
    expect(planReminder("BOOKING_CANCELLED", new Date("2026-11-20T01:00:00Z"), now)).toEqual({ action: "cancel" });
    expect(planReminder("BOOKING_REJECTED", new Date("2026-11-20T01:00:00Z"), now)).toEqual({ action: "cancel" });
  });
});

describe("processDueReminders", () => {
  const makeDeps = (overrides: Partial<ReminderDeps> = {}): ReminderDeps => ({
    findDue: vi.fn().mockResolvedValue([
      { id: 1, bookingId: 10, attempts: 0 },
      { id: 2, bookingId: 11, attempts: 2 },
    ]),
    claim: vi.fn().mockResolvedValue(true),
    send: vi.fn().mockResolvedValue("sent"),
    markSent: vi.fn().mockResolvedValue(undefined),
    markCancelled: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  it("sends every claimed reminder once", async () => {
    const deps = makeDeps();
    expect(await processDueReminders(now, deps)).toEqual({ claimed: 2, sent: 2, skipped: 0, failed: 0 });
    expect(deps.markSent).toHaveBeenCalledWith(1, now);
    expect(deps.markSent).toHaveBeenCalledWith(2, now);
  });

  it("does not send reminders another run already claimed", async () => {
    const deps = makeDeps({ claim: vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true) });
    const summary = await processDueReminders(now, deps);
    expect(summary.claimed).toBe(1);
    expect(deps.send).toHaveBeenCalledTimes(1);
  });

  it("cancels reminders whose booking no longer needs one", async () => {
    const deps = makeDeps({ send: vi.fn().mockResolvedValue("skip") });
    expect((await processDueReminders(now, deps)).skipped).toBe(2);
    expect(deps.markCancelled).toHaveBeenCalledTimes(2);
  });

  it("retries failures until the attempt limit, recording only the error class", async () => {
    const failure = Object.assign(new Error("SMTP refused jane@example.com"), { name: "SmtpError" });
    const deps = makeDeps({ send: vi.fn().mockRejectedValue(failure) });
    expect((await processDueReminders(now, deps)).failed).toBe(2);
    expect(deps.markFailed).toHaveBeenCalledWith(1, true, "SmtpError");
    expect(deps.markFailed).toHaveBeenCalledWith(2, false, "SmtpError");
  });
});
