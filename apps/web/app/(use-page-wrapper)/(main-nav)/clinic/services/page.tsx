import type { PageProps } from "app/_types";
import { _generateMetadata, getTranslate } from "app/_utils";
import Link from "next/link";

import { canManageCatalog } from "@calcom/clinic/src/auth/clinicRole";
import { listServices } from "@calcom/clinic/src/services/serviceRepository";

import { requireClinicRole } from "~/clinic/requireClinicRole";
import {
  ServiceFields,
  clinicButtonClass,
  clinicSecondaryButtonClass,
} from "~/clinic/services/ServiceFields";

import { ShellMainAppDir } from "../../ShellMainAppDir";
import { createServiceAction, toggleServiceActiveAction } from "./actions";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("clinic_services"),
    (t) => t("clinic_services_subtitle"),
    undefined,
    undefined,
    "/clinic/services"
  );

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency }).format(cents / 100);
}

const Page = async ({ searchParams: _searchParams }: PageProps) => {
  await requireClinicRole(canManageCatalog);
  const searchParams = await _searchParams;
  const t = await getTranslate();
  const services = await listServices();
  const error = typeof searchParams?.error === "string" ? searchParams.error : null;

  return (
    <ShellMainAppDir heading={t("clinic_services")} subtitle={t("clinic_services_subtitle")}>
      {error && (
        <p role="alert" className="bg-error text-error mb-4 rounded-md px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="border-subtle mb-8 overflow-hidden rounded-md border">
        {services.length === 0 ? (
          <p className="text-subtle p-6 text-sm">{t("clinic_no_services")}</p>
        ) : (
          <ul className="divide-subtle divide-y">
            {services.map((service) => (
              <li key={service.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: service.color ?? "#9ca3af" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-emphasis truncate font-medium">
                    {service.name}
                    {!service.active && (
                      <span className="bg-subtle text-subtle ml-2 rounded px-1.5 py-0.5 text-xs">
                        {t("clinic_inactive")}
                      </span>
                    )}
                  </p>
                  <p className="text-subtle text-sm">
                    {service.durationMin} min · {formatPrice(service.priceCents, service.currency)} ·{" "}
                    {t(`clinic_delivery_${service.deliveryType}`)} · {t("clinic_assigned_practitioners")}:{" "}
                    {service._count.assignments}
                  </p>
                </div>
                <Link href={`/clinic/services/${service.id}`} className={clinicSecondaryButtonClass}>
                  {t("clinic_edit")}
                </Link>
                <form action={toggleServiceActiveAction}>
                  <input type="hidden" name="id" value={service.id} />
                  <input type="hidden" name="active" value={String(!service.active)} />
                  <button type="submit" className={clinicSecondaryButtonClass}>
                    {service.active ? t("clinic_deactivate") : t("clinic_activate")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <section className="border-subtle rounded-md border p-6">
        <h2 className="text-emphasis mb-4 text-lg font-semibold">{t("clinic_add_service")}</h2>
        <form action={createServiceAction} className="space-y-4">
          <ServiceFields t={t} />
          <button type="submit" className={clinicButtonClass}>
            {t("clinic_add_service")}
          </button>
        </form>
      </section>
    </ShellMainAppDir>
  );
};

export default Page;
