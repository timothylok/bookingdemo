/**
 * Registers (or refreshes) the Cal.com webhook for every clinic practitioner.
 * Run after changing WEBAPP_URL or CLINIC_WEBHOOK_SECRET:
 *   cd packages/prisma && DOTENV_CONFIG_PATH=../../.env yarn ts-node --transpile-only -r dotenv/config ../clinic/scripts/register-practitioner-webhooks.ts
 */
import { prisma } from "@calcom/prisma";

import { ensurePractitionerWebhook } from "../src/webhooks/ensurePractitionerWebhook";

async function main() {
  const assignments = await prisma.clinicServiceAssignment.findMany({
    distinct: ["practitionerUserId"],
    select: { practitionerUserId: true },
  });
  for (const { practitionerUserId } of assignments) {
    const result = await ensurePractitionerWebhook(practitionerUserId);
    console.info(`practitioner ${practitionerUserId}: ${result}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
