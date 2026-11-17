import type { PageProps } from "app/_types";
import { _generateMetadata, getTranslate } from "app/_utils";
import Link from "next/link";

import { canManageCatalog } from "@calcom/clinic/src/auth/clinicRole";
import { listLocations } from "@calcom/clinic/src/locations/locationRepository";

import { clinicButtonClass, clinicSecondaryButtonClass } from "~/clinic/formStyles";
import { LocationFields } from "~/clinic/locations/LocationFields";
import { requireClinicRole } from "~/clinic/requireClinicRole";

import { ShellMainAppDir } from "../../ShellMainAppDir";
import { createLocationAction, toggleLocationActiveAction } from "./actions";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("clinic_locations"),
    (t) => t("clinic_locations_subtitle"),
    undefined,
    undefined,
    "/clinic/locations"
  );

const Page = async ({ searchParams: _searchParams }: PageProps) => {
  await requireClinicRole(canManageCatalog);
  const searchParams = await _searchParams;
  const t = await getTranslate();
  const locations = await listLocations();
  const error = typeof searchParams?.error === "string" ? searchParams.error : null;

  return (
    <ShellMainAppDir heading={t("clinic_locations")} subtitle={t("clinic_locations_subtitle")}>
      {error && (
        <p role="alert" className="bg-error text-error mb-4 rounded-md px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="border-subtle mb-8 overflow-hidden rounded-md border">
        {locations.length === 0 ? (
          <p className="text-subtle p-6 text-sm">{t("clinic_no_locations")}</p>
        ) : (
          <ul className="divide-subtle divide-y">
            {locations.map((location) => (
              <li key={location.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-emphasis truncate font-medium">
                    {location.name}
                    {!location.active && (
                      <span className="bg-subtle text-subtle ml-2 rounded px-1.5 py-0.5 text-xs">
                        {t("clinic_inactive")}
                      </span>
                    )}
                  </p>
                  <p className="text-subtle text-sm">
                    {t(`clinic_delivery_${location.kind}`)}
                    {location.address ? ` · ${location.address}` : ""}
                    {location.phone ? ` · ${location.phone}` : ""} · {t("clinic_assigned_practitioners")}:{" "}
                    {location._count.assignments}
                  </p>
                </div>
                <Link href={`/clinic/locations/${location.id}`} className={clinicSecondaryButtonClass}>
                  {t("clinic_edit")}
                </Link>
                <form action={toggleLocationActiveAction}>
                  <input type="hidden" name="id" value={location.id} />
                  <input type="hidden" name="active" value={String(!location.active)} />
                  <button type="submit" className={clinicSecondaryButtonClass}>
                    {location.active ? t("clinic_deactivate") : t("clinic_activate")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <section className="border-subtle rounded-md border p-6">
        <h2 className="text-emphasis mb-4 text-lg font-semibold">{t("clinic_add_location")}</h2>
        <form action={createLocationAction} className="space-y-4">
          <LocationFields t={t} />
          <button type="submit" className={clinicButtonClass}>
            {t("clinic_add_location")}
          </button>
        </form>
      </section>
    </ShellMainAppDir>
  );
};

export default Page;
