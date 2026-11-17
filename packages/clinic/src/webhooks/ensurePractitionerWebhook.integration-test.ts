import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { WEBAPP_URL } from "@calcom/lib/constants";
import { prisma } from "@calcom/prisma";

import { CLINIC_WEBHOOK_PATH, ensurePractitionerWebhook } from "./ensurePractitionerWebhook";

// Needs a migrated + seeded local database (uses the seeded pro@example.com user).
describe("ensurePractitionerWebhook", () => {
  let userId: number;
  const subscriberUrl = `${WEBAPP_URL}${CLINIC_WEBHOOK_PATH}`;
  let existedBefore = false;

  beforeAll(async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "pro@example.com" },
      select: { id: true },
    });
    userId = user.id;
    existedBefore =
      (await prisma.webhook.count({ where: { userId, subscriberUrl } })) > 0;
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    if (!existedBefore) await prisma.webhook.deleteMany({ where: { userId, subscriberUrl } });
  });

  it("skips registration when no secret is configured", async () => {
    vi.stubEnv("CLINIC_WEBHOOK_SECRET", "");
    expect(await ensurePractitionerWebhook(userId)).toBe("skipped");
  });

  it("registers exactly one active webhook for the clinic triggers", async () => {
    vi.stubEnv("CLINIC_WEBHOOK_SECRET", "integration-secret");
    await ensurePractitionerWebhook(userId);
    expect(await ensurePractitionerWebhook(userId)).toBe("updated");

    const hooks = await prisma.webhook.findMany({
      where: { userId, subscriberUrl },
      select: { active: true, eventTriggers: true, secret: true },
    });
    expect(hooks).toHaveLength(1);
    expect(hooks[0].active).toBe(true);
    expect(hooks[0].secret).toBe("integration-secret");
    expect([...hooks[0].eventTriggers].sort()).toEqual(
      ["BOOKING_CANCELLED", "BOOKING_CREATED", "BOOKING_REJECTED", "BOOKING_RESCHEDULED"]
    );
  });
});
