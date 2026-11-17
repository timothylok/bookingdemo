import { createHash, randomBytes } from "node:crypto";

// Long enough to be unguessable; short enough for a tidy URL.
const TOKEN_BYTES = 24;
const VALID_AFTER_APPOINTMENT_MS = 24 * 60 * 60 * 1000;

export function hashIntakeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function intakeExpiry(endTime: Date): Date {
  return new Date(endTime.getTime() + VALID_AFTER_APPOINTMENT_MS);
}

export function createIntakeToken(endTime: Date, random: (size: number) => Buffer = randomBytes) {
  const token = random(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashIntakeToken(token), expiresAt: intakeExpiry(endTime) };
}

export function isIntakeTokenUsable(form: { expiresAt: Date; submittedAt: Date | null }, now: Date): boolean {
  return form.submittedAt === null && form.expiresAt.getTime() > now.getTime();
}
