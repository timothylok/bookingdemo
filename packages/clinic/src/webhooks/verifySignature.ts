import { createHmac, timingSafeEqual } from "node:crypto";

/** Matches upstream createWebhookSignature: hex HMAC-SHA256 of the raw body, header X-Cal-Signature-256. */
export function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyCalSignature(body: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret || !signature) return false;
  const expected = Buffer.from(signBody(body, secret), "hex");
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
