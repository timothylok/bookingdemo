"use server";

import { redirect } from "next/navigation";

import { parseFormTemplate, validateFormResponses } from "@calcom/clinic/src/forms/formTemplate";
import { findIntakeFormByToken, submitIntakeForm } from "@calcom/clinic/src/forms/intakeFormRepository";
import { isIntakeTokenUsable } from "@calcom/clinic/src/forms/intakeToken";

export async function submitIntakeAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const path = `/intake/${encodeURIComponent(token)}`;
  const form = await findIntakeFormByToken(token);
  const now = new Date();
  if (!form || !isIntakeTokenUsable(form, now)) redirect(path);

  const result = validateFormResponses(parseFormTemplate(form.template.schemaJson), Object.fromEntries(formData));
  if (!result.ok) redirect(`${path}?error=1`);

  await submitIntakeForm(form.id, result.values, now);
  redirect(path);
}
