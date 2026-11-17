import type { PageProps } from "app/_types";
import { _generateMetadata, getTranslate } from "app/_utils";
import Link from "next/link";
import { notFound } from "next/navigation";

import { filterOffers } from "@calcom/clinic/src/booking/bookingCatalog";
import { getBookingCatalog } from "@calcom/clinic/src/booking/bookingCatalogRepository";
import { isClinicMode } from "@calcom/clinic/src/config";
import { APP_NAME } from "@calcom/lib/constants";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("clinic_book_title"),
    (t) => t("clinic_book_subtitle"),
    undefined,
    undefined,
    "/book"
  );

function toId(value: string | string[] | undefined): number | undefined {
  const id = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return null;
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency }).format(cents / 100);
}

const chipClass = (selected: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm ${
    selected ? "border-brand-default bg-brand-default text-brand" : "border-default text-default hover:bg-subtle"
  }`;

const Page = async ({ searchParams: _searchParams }: PageProps) => {
  if (!isClinicMode()) notFound();

  const searchParams = await _searchParams;
  const t = await getTranslate();
  const catalog = await getBookingCatalog();
  const practitionerId = toId(searchParams?.practitioner);
  const serviceId = toId(searchParams?.service);
  const offers = filterOffers(catalog, { practitionerId, serviceId });

  const hrefWith = (next: { practitioner?: number; service?: number }) => {
    const params = new URLSearchParams();
    if (next.practitioner) params.set("practitioner", String(next.practitioner));
    if (next.service) params.set("service", String(next.service));
    const query = params.toString();
    return query ? `/book?${query}` : "/book";
  };

  return (
    <main className="bg-default min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-subtle text-sm font-medium">{APP_NAME}</p>
        <h1 className="text-emphasis mt-1 text-2xl font-semibold">{t("clinic_book_title")}</h1>
        <p className="text-subtle mt-1">{t("clinic_book_subtitle")}</p>

        {catalog.offers.length === 0 ? (
          <p className="border-subtle text-subtle mt-8 rounded-md border p-6">{t("clinic_book_none")}</p>
        ) : (
          <>
            <section className="mt-8">
              <h2 className="text-emphasis mb-2 text-sm font-semibold">{t("clinic_book_choose_practitioner")}</h2>
              <div className="flex flex-wrap gap-2">
                <Link href={hrefWith({ service: serviceId })} className={chipClass(!practitionerId)}>
                  {t("clinic_book_any")}
                </Link>
                {catalog.practitioners.map((p) => (
                  <Link
                    key={p.id}
                    href={hrefWith({ practitioner: p.id, service: serviceId })}
                    className={chipClass(p.id === practitionerId)}>
                    {p.name}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-emphasis mb-2 text-sm font-semibold">{t("clinic_book_choose_service")}</h2>
              <div className="flex flex-wrap gap-2">
                <Link href={hrefWith({ practitioner: practitionerId })} className={chipClass(!serviceId)}>
                  {t("clinic_book_any")}
                </Link>
                {catalog.services.map((s) => (
                  <Link
                    key={s.id}
                    href={hrefWith({ practitioner: practitionerId, service: s.id })}
                    className={chipClass(s.id === serviceId)}>
                    {s.name}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-emphasis mb-3 text-sm font-semibold">{t("clinic_book_choose_time")}</h2>
              {offers.length === 0 ? (
                <p className="text-subtle text-sm">{t("clinic_book_no_match")}</p>
              ) : (
                <ul className="space-y-3">
                  {offers.map((offer) => {
                    const price = formatPrice(offer.priceCents, offer.currency);
                    return (
                      <li key={offer.href}>
                        <Link
                          href={offer.href}
                          className="border-subtle hover:border-emphasis bg-default flex items-center gap-4 rounded-md border p-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-emphasis font-medium">{offer.serviceName}</p>
                            <p className="text-subtle text-sm">
                              {offer.practitionerName} · {offer.durationMin} min
                              {price ? ` · ${price}` : ""} · {t(`clinic_delivery_${offer.deliveryType}`)}
                              {offer.locationName ? ` · ${offer.locationName}` : ""}
                            </p>
                            {offer.description && <p className="text-default mt-1 text-sm">{offer.description}</p>}
                          </div>
                          <span className="text-emphasis text-sm font-medium">{t("clinic_book_select")} →</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Page;
