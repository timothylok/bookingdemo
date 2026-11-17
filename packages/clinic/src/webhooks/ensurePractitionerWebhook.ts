import { randomUUID } from "node:crypto";

import { WEBAPP_URL } from "@calcom/lib/constants";
import { prisma } from "@calcom/prisma";
import { WebhookTriggerEvents } from "@calcom/prisma/enums";

import { HANDLED_TRIGGERS } from "./parseBookingEvent";

export const CLINIC_WEBHOOK_PATH = "/api/clinic/webhooks/cal";

/**
 * Cal.com only sends user webhooks, so each practitioner needs one pointing at the clinic route.
 * Upserted on (userId, subscriberUrl) so repeated assignments never create duplicates.
 */
export async function ensurePractitionerWebhook(userId: number): Promise<"created" | "updated" | "skipped"> {
  const secret = process.env.CLINIC_WEBHOOK_SECRET;
  if (!secret) return "skipped";

  const subscriberUrl = `${WEBAPP_URL}${CLINIC_WEBHOOK_PATH}`;
  const eventTriggers = HANDLED_TRIGGERS.map((trigger) => WebhookTriggerEvents[trigger]);

  const existing = await prisma.webhook.findUnique({
    where: { courseIdentifier: { userId, subscriberUrl } },
    select: { id: true },
  });

  if (existing) {
    await prisma.webhook.update({
      where: { id: existing.id },
      data: { active: true, secret, eventTriggers },
      select: { id: true },
    });
    return "updated";
  }

  await prisma.webhook.create({
    data: { id: randomUUID(), userId, subscriberUrl, active: true, secret, eventTriggers },
    select: { id: true },
  });
  return "created";
}
