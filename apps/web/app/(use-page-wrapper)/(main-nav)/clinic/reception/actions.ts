"use server";

import { revalidatePath } from "next/cache";

import { canViewReception } from "@calcom/clinic/src/auth/clinicRole";
import { setAppointmentNoShow } from "@calcom/clinic/src/reception/receptionRepository";

import { requireClinicRole } from "~/clinic/requireClinicRole";

export async function toggleNoShowAction(formData: FormData) {
  await requireClinicRole(canViewReception);
  const bookingId = Number(formData.get("bookingId"));
  if (!Number.isInteger(bookingId) || bookingId <= 0) return;
  await setAppointmentNoShow(bookingId, formData.get("noShow") === "true");
  revalidatePath("/clinic/reception");
}
