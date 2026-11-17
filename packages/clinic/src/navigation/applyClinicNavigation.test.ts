import { describe, expect, it } from "vitest";

import { isClinicMode } from "../config";
import { applyClinicNavigation } from "./applyClinicNavigation";

const upstream = [
  { name: "event_types_page_title" },
  { name: "bookings" },
  { name: "availability" },
  { name: "members" },
  { name: "teams" },
  { name: "apps" },
  { name: "more" },
  { name: "routing" },
  { name: "workflows" },
  { name: "insights" },
];
const clinic = [{ name: "clinic_reception" }, { name: "clinic_services" }];

describe("applyClinicNavigation", () => {
  it("returns upstream items unchanged when clinic mode is off", () => {
    expect(applyClinicNavigation(upstream, clinic, false)).toEqual(upstream);
  });

  it("hides /ee and team features and inserts clinic items after availability", () => {
    expect(applyClinicNavigation(upstream, clinic, true).map((i) => i.name)).toEqual([
      "event_types_page_title",
      "bookings",
      "availability",
      "clinic_reception",
      "clinic_services",
      "apps",
      "more",
    ]);
  });

  it("appends clinic items when there is no availability anchor", () => {
    expect(applyClinicNavigation([{ name: "bookings" }], clinic, true).map((i) => i.name)).toEqual([
      "bookings",
      "clinic_reception",
      "clinic_services",
    ]);
  });
});

describe("isClinicMode", () => {
  it.each([
    ["1", true],
    ["true", true],
    ["0", false],
    [undefined, false],
  ])("NEXT_PUBLIC_CLINIC_MODE=%s -> %s", (value, expected) => {
    expect(isClinicMode({ NEXT_PUBLIC_CLINIC_MODE: value })).toBe(expected);
  });
});
