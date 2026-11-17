import type { PageProps } from "app/_types";
import { _generateMetadata, getTranslate } from "app/_utils";
import Link from "next/link";
import { notFound } from "next/navigation";

import { canManageCatalog } from "@calcom/clinic/src/auth/clinicRole";
import { getLocation } from "@calcom/clinic/src/locations/locationRepository";

import { clinicButtonClass, clinicSecondaryButtonClass } from "~/clinic/formStyles";
import { LocationFields } from "~/clinic/locations/LocationFields";
import { requireClinicRole } from "~/clinic/requireClinicRole";

import { ShellMainAppDir } from "../../../ShellMainAppDir";
import { updateLocationAction } from "../actions";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("clinic_edit_location"),
    (t) => t("clinic_locations_subtitle"),
    undefined,
    undefined,
    "/clinic/locations"
  );

const Page = async ({ params: _params, searchParams: _searchParams }: PageProps) => {
  await requireClinicRole(canManageCatalog);
  const params = await _params;
  const searchParams = await _searchParams;
  const t = await getTranslate();

  const id = Number(params?.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const location = await getLocation(id);
  if (!location) notFound();

  const error = typeof searchParams?.error === "string" ? searchParams.error : null;

  return (
    <ShellMainAppDir
      heading={`${t("clinic_edit_location")}: ${location.name}`}
      subtitle={t("clinic_locations_subtitle")}>
      {error && (
        <p role="alert" className="bg-error text-error mb-4 rounded-md px-4 py-2 text-sm">
          {error}
        </p>
      )}
      <form action={updateLocationAction} className="border-subtle space-y-4 rounded-md border p-6">
        <input type="hidden" name="id" value={location.id} />
        <LocationFields t={t} defaults={location} />
        <div className="flex gap-2">
          <button type="submit" className={clinicButtonClass}>
            {t("clinic_save")}
          </button>
          <Link href="/clinic/locations" className={clinicSecondaryButtonClass}>
            {t("clinic_back")}
          </Link>
        </div>
      </form>
    </ShellMainAppDir>
  );
};

export default Page;
