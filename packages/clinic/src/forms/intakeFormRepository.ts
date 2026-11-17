import { prisma } from "@calcom/prisma";

import { hashIntakeToken } from "./intakeToken";

export async function findIntakeFormByToken(token: string) {
  if (!token || token.length > 200) return null;
  return prisma.clinicPatientForm.findUnique({
    where: { tokenHash: hashIntakeToken(token) },
    select: {
      id: true,
      expiresAt: true,
      submittedAt: true,
      patient: { select: { name: true } },
      template: { select: { name: true, schemaJson: true } },
    },
  });
}

/**
 * Single-use: the conditional update only matches an unsubmitted, unexpired form, so a replayed or
 * racing submission cannot overwrite answers that were already given.
 */
export async function submitIntakeForm(formId: number, responses: Record<string, string>, now: Date) {
  const result = await prisma.clinicPatientForm.updateMany({
    where: { id: formId, submittedAt: null, expiresAt: { gt: now } },
    data: { responseJson: responses, submittedAt: now },
  });
  return result.count === 1;
}
