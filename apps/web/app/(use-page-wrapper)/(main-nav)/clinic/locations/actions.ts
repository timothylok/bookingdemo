"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageCatalog } from "@calcom/clinic/src/auth/clinicRole";
import { parseLocationForm } from "@calcom/clinic/src/locations/locationForm";
import {
  createLocation,
  setLocationActive,
  updateLocation,
} from "@calcom/clinic/src/locations/locationRepository";

import { requireClinicRole } from "~/clinic/requireClinicRole";

const LIST_PATH = "/clinic/locations";

function parseId(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect(`${LIST_PATH}?error=${encodeURIComponent("Invalid location id")}`);
  return id;
}

export async function createLocationAction(formData: FormData) {
  await requireClinicRole(canManageCatalog);
  const result = parseLocationForm(Object.fromEntries(formData.entries()));
  if (!result.ok) redirect(`${LIST_PATH}?error=${encodeURIComponent(result.error)}`);

  await createLocation(result.values);
  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function updateLocationAction(formData: FormData) {
  await requireClinicRole(canManageCatalog);
  const id = parseId(formData);
  const result = parseLocationForm(Object.fromEntries(formData.entries()));
  if (!result.ok) redirect(`${LIST_PATH}/${id}?error=${encodeURIComponent(result.error)}`);

  await updateLocation(id, result.values);
  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function toggleLocationActiveAction(formData: FormData) {
  await requireClinicRole(canManageCatalog);
  const id = parseId(formData);
  await setLocationActive(id, formData.get("active") === "true");
  revalidatePath(LIST_PATH);
}
