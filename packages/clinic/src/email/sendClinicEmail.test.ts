import { afterEach, describe, expect, it, vi } from "vitest";

import { sendClinicEmail } from "./sendClinicEmail";

const email = { to: "p@example.com", subject: "Hello", text: "Body" };
const resendEnv = { CLINIC_EMAIL_TRANSPORT: "resend", RESEND_API_KEY: "re_test", CLINIC_EMAIL_FROM: "Clinic <hi@clinic.test>" };

afterEach(() => vi.restoreAllMocks());

describe("sendClinicEmail", () => {
  it("defaults to the log transport and never calls the network", async () => {
    const fetchImpl = vi.fn();
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    await sendClinicEmail(email, { logLine: "booking 1", env: {}, fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(expect.stringContaining("booking 1"));
  });

  it("posts to Resend with auth, sender, recipient and idempotency key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    await sendClinicEmail(email, { logLine: "x", env: resendEnv, fetchImpl, idempotencyKey: "reminder-9" });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers).toMatchObject({ Authorization: "Bearer re_test", "Idempotency-Key": "reminder-9" });
    expect(JSON.parse(init.body)).toEqual({
      from: "Clinic <hi@clinic.test>",
      to: ["p@example.com"],
      subject: "Hello",
      text: "Body",
    });
  });

  it("throws on a non-2xx response without leaking the body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("p@example.com is invalid", { status: 422 }));
    await expect(sendClinicEmail(email, { logLine: "x", env: resendEnv, fetchImpl })).rejects.toThrow(
      "Resend rejected the email with HTTP 422"
    );
  });

  it("throws when the key or sender is missing", async () => {
    const fetchImpl = vi.fn();
    await expect(
      sendClinicEmail(email, { logLine: "x", env: { CLINIC_EMAIL_TRANSPORT: "resend" }, fetchImpl })
    ).rejects.toThrow("RESEND_API_KEY and CLINIC_EMAIL_FROM");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects an unknown transport", async () => {
    await expect(
      sendClinicEmail(email, { logLine: "x", env: { CLINIC_EMAIL_TRANSPORT: "smtp" } })
    ).rejects.toThrow('Unknown CLINIC_EMAIL_TRANSPORT "smtp"');
  });
});
