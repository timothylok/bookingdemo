import { describe, expect, it } from "vitest";

import { relabelClinicTerms, withClinicTranslations } from "./clinicTranslations";

describe("relabelClinicTerms", () => {
  it.each([
    ["Attendee's name", "Patient's name"],
    ["Add attendees", "Add patients"],
    ["The host will confirm", "The practitioner will confirm"],
    ["Hosts", "Practitioners"],
  ])("%s -> %s", (input, expected) => {
    expect(relabelClinicTerms(input)).toBe(expected);
  });

  it("leaves words that merely contain the term alone", () => {
    expect(relabelClinicTerms("Use localhost or a hostname")).toBe("Use localhost or a hostname");
  });

  it("never rewrites interpolation placeholders or Trans tags", () => {
    expect(relabelClinicTerms("{{attendee}} booked with {{host}}")).toBe("{{attendee}} booked with {{host}}");
    expect(relabelClinicTerms("Email the <1>attendee</1>")).toBe("Email the <1>patient</1>");
  });
});

describe("withClinicTranslations", () => {
  const base = { attendee: "Attendee", event_types_page_title: "Event types", bookings: "Bookings" };

  it("returns the base object untouched when disabled", () => {
    expect(withClinicTranslations(base, false)).toBe(base);
  });

  it("relabels terms, applies key overrides and adds clinic strings when enabled", () => {
    const result = withClinicTranslations(base, true);
    expect(result.attendee).toBe("Patient");
    expect(result.event_types_page_title).toBe("Appointment types");
    expect(result.bookings).toBe("Bookings");
    expect(result.clinic_reception).toBe("Reception");
  });
});
