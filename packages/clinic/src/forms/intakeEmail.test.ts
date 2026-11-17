import { describe, expect, it } from "vitest";

import { buildIntakeEmail, redactIntakeLink } from "./intakeEmail";

describe("redactIntakeLink", () => {
  const link = "https://clinic.example/intake/abcDEF123_-xyz";

  it("never exposes the token in production logs", () => {
    expect(redactIntakeLink(link, "production")).toBe("https://clinic.example/intake/[redacted]");
  });

  it("keeps the full link in development so the form can be tested", () => {
    expect(redactIntakeLink(link, "development")).toBe(link);
  });
});

describe("buildIntakeEmail", () => {
  it("includes the link and the appointment time in the clinic time zone", () => {
    const email = buildIntakeEmail({
      to: "jane@example.com",
      patientName: "Jane",
      link: "https://clinic.example/intake/tok",
      startTime: new Date("2026-11-20T01:00:00Z"),
      clinicName: "ClinicBook",
      timeZone: "Pacific/Auckland",
    });
    expect(email.to).toBe("jane@example.com");
    expect(email.text).toContain("https://clinic.example/intake/tok");
    expect(email.text).toContain("2:00");
    expect(email.text).toContain("24 hours after your appointment");
  });
});
