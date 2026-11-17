"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageCatalog } from "@calcom/clinic/src/auth/clinicRole";
import { parseServiceForm } from "@calcom/clinic/src/services/serviceForm";
import { createService, setServiceActive, updateService } from "@calcom/clinic/src/services/serviceRepository";

import { requireClinicRole } from "~/clinic/requireClinicRole";

const LIST_PATH = "/clinic/services";

function formRecord(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function parseId(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect(`${LIST_PATH}?error=${encodeURIComponent("Invalid service id")}`);
  return id;
}

export async function createServiceAction(formData: FormData) {
  await requireClinicRole(canManageCatalog);
  const result = parseServiceForm(formRecord(formData));
  if (!result.ok) redirect(`${LIST_PATH}?error=${encodeURIComponent(result.error)}`);

  await createService(result.values);
  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function updateServiceAction(formData: FormData) {
  await requireClinicRole(canManageCatalog);
  const id = parseId(formData);
  const result = parseServiceForm(formRecord(formData));
  if (!result.ok) redirect(`${LIST_PATH}/${id}?error=${encodeURIComponent(result.error)}`);

  await updateService(id, result.values);
  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function toggleServiceActiveAction(formData: FormData) {
  await requireClinicRole(canManageCatalog);
  const id = parseId(formData);
  await setServiceActive(id, formData.get("active") === "true");
  revalidatePath(LIST_PATH);
}
