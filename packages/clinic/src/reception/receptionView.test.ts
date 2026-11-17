import { describe, expect, it } from "vitest";

import type { AppointmentInput } from "./receptionView";
import { buildReceptionRows, getReceptionRange, summarizeReception } from "./receptionView";

const TZ = "Pacific/Auckland";

describe("getReceptionRange", () => {
  it("uses the clinic's local midnight for a day (NZDT = UTC+13)", () => {
    const range = getReceptionRange("day", "2026-11-18", TZ, new Date());
    expect(range.start.toISOString()).toBe("2026-11-17T11:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-11-18T11:00:00.000Z");
    expect(range.days).toEqual(["2026-11-18"]);
  });

  it("defaults to today in the clinic time zone, not UTC", () => {
    // 22:30 UTC on the 17th is already the 18th in Auckland.
    const range = getReceptionRange("day", undefined, TZ, new Date("2026-11-17T22:30:00Z"));
    expect(range.days).toEqual(["2026-11-18"]);
  });

  it("spans Monday to Sunday for the week view", () => {
    const range = getReceptionRange("week", "2026-11-18", TZ, new Date());
    expect(range.days).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
  });

  it("ignores malformed dates", () => {
    const range = getReceptionRange("day", "18/11/2026", TZ, new Date("2026-11-17T22:30:00Z"));
    expect(range.days).toEqual(["2026-11-18"]);
  });
});

const booking = (id: number, startUtc: string, overrides: Partial<AppointmentInput> = {}): AppointmentInput => ({
  id,
  title: `Booking ${id}`,
  startTime: new Date(startUtc),
  endTime: new Date(new Date(startUtc).getTime() + 30 * 60 * 1000),
  status: "ACCEPTED",
  userId: 4,
  attendees: [{ name: `Patient ${id}`, email: `p${id}@example.com`, noShow: false }],
  ...overrides,
});

describe("buildReceptionRows + summarizeReception", () => {
  const rows = buildReceptionRows(
    [
      booking(3, "2026-11-18T22:00:00Z"), // 19th 11:00 local
      booking(1, "2026-11-17T20:00:00Z"), // 18th 09:00 local
      booking(2, "2026-11-17T21:00:00Z", { status: "CANCELLED" }),
      booking(4, "2026-11-17T23:00:00Z", {
        attendees: [{ name: "", email: "noshow@example.com", noShow: true }],
      }),
    ],
    new Map([
      [1, { submittedAt: new Date() }],
      [3, { submittedAt: null }],
    ]),
    TZ
  );

  it("sorts by start time, keys by local day and derives intake status", () => {
    expect(rows.map((r) => [r.bookingId, r.day, r.intake])).toEqual([
      [1, "2026-11-18", "submitted"],
      [2, "2026-11-18", "none"],
      [4, "2026-11-18", "none"],
      [3, "2026-11-19", "pending"],
    ]);
    expect(rows.find((r) => r.bookingId === 4)?.patientName).toBe("noshow@example.com");
  });

  it("counts active appointments per day, cancellations, no-shows and pending intake", () => {
    expect(summarizeReception(rows, "2026-11-18", "2026-11-19")).toEqual({
      today: 2,
      tomorrow: 1,
      cancelled: 1,
      noShows: 1,
      intakePending: 1,
    });
  });
});
