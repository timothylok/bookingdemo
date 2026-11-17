import type { PageProps } from "app/_types";
import { _generateMetadata, getTranslate } from "app/_utils";
import Link from "next/link";
import { notFound } from "next/navigation";

import { canManageCatalog } from "@calcom/clinic/src/auth/clinicRole";
import { getService } from "@calcom/clinic/src/services/serviceRepository";

import { requireClinicRole } from "~/clinic/requireClinicRole";
import { ServiceFields, clinicButtonClass, clinicSecondaryButtonClass } from "~/clinic/services/ServiceFields";

import { ShellMainAppDir } from "../../../ShellMainAppDir";
import { updateServiceAction } from "../actions";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("clinic_edit_service"),
    (t) => t("clinic_services_subtitle"),
    undefined,
    undefined,
    "/clinic/services"
  );

const Page = async ({ params: _params, searchParams: _searchParams }: PageProps) => {
  await requireClinicRole(canManageCatalog);
  const params = await _params;
  const searchParams = await _searchParams;
  const t = await getTranslate();

  const id = Number(params?.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const service = await getService(id);
  if (!service) notFound();

  const error = typeof searchParams?.error === "string" ? searchParams.error : null;

  return (
    <ShellMainAppDir heading={`${t("clinic_edit_service")}: ${service.name}`} subtitle={t("clinic_services_subtitle")}>
      {error && (
        <p role="alert" className="bg-error text-error mb-4 rounded-md px-4 py-2 text-sm">
          {error}
        </p>
      )}
      <form action={updateServiceAction} className="border-subtle space-y-4 rounded-md border p-6">
        <input type="hidden" name="id" value={service.id} />
        <ServiceFields t={t} defaults={service} />
        <div className="flex gap-2">
          <button type="submit" className={clinicButtonClass}>
            {t("clinic_save")}
          </button>
          <Link href="/clinic/services" className={clinicSecondaryButtonClass}>
            {t("clinic_back")}
          </Link>
        </div>
      </form>
    </ShellMainAppDir>
  );
};

export default Page;
