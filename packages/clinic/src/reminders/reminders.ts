import type { HandledTrigger } from "../webhooks/parseBookingEvent";

export const EMAIL_24H = "email_24h";
const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_ATTEMPTS = 3;

export type ReminderPlan =
  | { action: "schedule"; kind: string; sendAt: Date }
  | { action: "cancel" }
  | { action: "none" };

/** A reminder that would already be due at booking time adds nothing, so it is not scheduled. */
export function planReminder(trigger: HandledTrigger, startTime: Date, now: Date): ReminderPlan {
  if (trigger === "BOOKING_CANCELLED" || trigger === "BOOKING_REJECTED") return { action: "cancel" };
  const sendAt = new Date(startTime.getTime() - DAY_MS);
  if (sendAt.getTime() <= now.getTime()) return { action: "none" };
  return { action: "schedule", kind: EMAIL_24H, sendAt };
}

export type DueReminder = { id: number; bookingId: number; attempts: number };

export type ReminderDeps = {
  findDue(now: Date, limit: number): Promise<DueReminder[]>;
  /** Atomically moves pending -> sending; false if another run already claimed it. */
  claim(id: number): Promise<boolean>;
  send(reminder: DueReminder): Promise<"sent" | "skip">;
  markSent(id: number, now: Date): Promise<void>;
  markCancelled(id: number): Promise<void>;
  markFailed(id: number, retry: boolean, error: string): Promise<void>;
};

export type ProcessSummary = { claimed: number; sent: number; skipped: number; failed: number };

export async function processDueReminders(now: Date, deps: ReminderDeps, limit = 100): Promise<ProcessSummary> {
  const summary: ProcessSummary = { claimed: 0, sent: 0, skipped: 0, failed: 0 };

  for (const reminder of await deps.findDue(now, limit)) {
    if (!(await deps.claim(reminder.id))) continue;
    summary.claimed += 1;

    try {
      const outcome = await deps.send(reminder);
      if (outcome === "skip") {
        await deps.markCancelled(reminder.id);
        summary.skipped += 1;
      } else {
        await deps.markSent(reminder.id, now);
        summary.sent += 1;
      }
    } catch (error) {
      // Only the error class is kept: messages from mail transports can echo recipient details.
      const errorName = error instanceof Error ? error.name : "UnknownError";
      await deps.markFailed(reminder.id, reminder.attempts + 1 < MAX_ATTEMPTS, errorName);
      summary.failed += 1;
    }
  }
  return summary;
}
