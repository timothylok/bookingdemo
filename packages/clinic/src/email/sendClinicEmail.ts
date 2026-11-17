export type ClinicEmail = { to: string; subject: string; text: string };

type SendOptions = {
  /** What the "log" transport prints. Must never contain patient data or a live intake token. */
  logLine: string;
  /** Resend de-duplicates requests with the same key for 24 h, so a retried send cannot email twice. */
  idempotencyKey?: string;
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
};

const RESEND_URL = "https://api.resend.com/emails";

/**
 * CLINIC_EMAIL_TRANSPORT: "log" (default, nothing leaves the machine) or "resend".
 * Resend needs RESEND_API_KEY and CLINIC_EMAIL_FROM (an address on a domain verified in Resend).
 * Errors never include the email body or the API response body, which can echo patient details.
 */
export async function sendClinicEmail(email: ClinicEmail, options: SendOptions): Promise<void> {
  const env = options.env ?? process.env;
  const transport = env.CLINIC_EMAIL_TRANSPORT ?? "log";

  if (transport === "log") {
    console.info(`[clinic] email (not sent, log transport): ${options.logLine}`);
    return;
  }
  if (transport !== "resend") {
    throw new Error(`Unknown CLINIC_EMAIL_TRANSPORT "${transport}"`);
  }

  const apiKey = env.RESEND_API_KEY;
  const from = env.CLINIC_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("CLINIC_EMAIL_TRANSPORT=resend requires RESEND_API_KEY and CLINIC_EMAIL_FROM");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  const response = await (options.fetchImpl ?? fetch)(RESEND_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the email with HTTP ${response.status}`);
  }
}
