import type { PageProps } from "app/_types";
import { _generateMetadata, getTranslate } from "app/_utils";
import Link from "next/link";

import { canViewReception } from "@calcom/clinic/src/auth/clinicRole";
import { listAppointments, listClinicPractitioners } from "@calcom/clinic/src/reception/receptionRepository";
import type { ReceptionViewMode } from "@calcom/clinic/src/reception/receptionView";
import {
  buildReceptionRows,
  getReceptionRange,
  summarizeReception,
} from "@calcom/clinic/src/reception/receptionView";
import dayjs from "@calcom/dayjs";

import { clinicSecondaryButtonClass } from "~/clinic/formStyles";
import { requireClinicRole } from "~/clinic/requireClinicRole";

import { ShellMainAppDir } from "../../ShellMainAppDir";
import { toggleNoShowAction } from "./actions";

const TIME_ZONE = process.env.CLINIC_TIME_ZONE ?? "Pacific/Auckland";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("clinic_reception"),
    (t) => t("clinic_reception_subtitle"),
    undefined,
    undefined,
    "/clinic/reception"
  );

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const STATUS_CLASS: Record<string, string> = {
  ACCEPTED: "bg-success text-success",
  PENDING: "bg-attention text-attention",
  AWAITING_HOST: "bg-attention text-attention",
  CANCELLED: "bg-error text-error",
  REJECTED: "bg-error text-error",
};

const Page = async ({ searchParams: _searchParams }: PageProps) => {
  await requireClinicRole(canViewReception);
  const searchParams = await _searchParams;
  const t = await getTranslate();
  const now = new Date();

  const view: ReceptionViewMode = param(searchParams?.view) === "week" ? "week" : "day";
  const practitionerParam = Number(param(searchParams?.practitioner));
  const range = getReceptionRange(view, param(searchParams?.date), TIME_ZONE, now);

  const practitioners = await listClinicPractitioners();
  const selectedPractitioner = practitioners.find((p) => p.id === practitionerParam);
  const practitionerIds = selectedPractitioner ? [selectedPractitioner.id] : practitioners.map((p) => p.id);
  const nameOf = new Map(practitioners.map((p) => [p.id, p.name ?? p.username ?? `#${p.id}`]));

  // Summary cards always describe today and tomorrow, whatever range is being browsed.
  const todayRange = getReceptionRange("day", undefined, TIME_ZONE, now);
  const summaryStart = todayRange.start;
  const summaryEnd = dayjs(todayRange.end).add(1, "day").toDate();
  const today = todayRange.days[0];
  const tomorrow = dayjs.tz(today, TIME_ZONE).add(1, "day").format("YYYY-MM-DD");

  const [rangeData, summaryData] = await Promise.all([
    listAppointments({ start: range.start, end: range.end, practitionerIds }),
    listAppointments({ start: summaryStart, end: summaryEnd, practitionerIds }),
  ]);
  const rows = buildReceptionRows(rangeData.bookings, rangeData.intakeByBookingId, TIME_ZONE);
  const summary = summarizeReception(
    buildReceptionRows(summaryData.bookings, summaryData.intakeByBookingId, TIME_ZONE),
    today,
    tomorrow
  );

  const step = view === "week" ? 7 : 1;
  const anchor = dayjs.tz(range.days[0], TIME_ZONE);
  const link = (overrides: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    const merged = {
      view,
      date: range.days[0],
      practitioner: selectedPractitioner ? String(selectedPractitioner.id) : undefined,
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) if (value) query.set(key, value);
    return `/clinic/reception?${query.toString()}`;
  };
  const formatTime = (date: Date) => dayjs(date).tz(TIME_ZONE).format("HH:mm");
  const formatDay = (key: string) => dayjs.tz(key, TIME_ZONE).format("dddd D MMMM");

  const cards = [
    [t("clinic_reception_today"), summary.today],
    [t("clinic_reception_tomorrow"), summary.tomorrow],
    [t("clinic_reception_cancelled"), summary.cancelled],
    [t("clinic_reception_no_shows"), summary.noShows],
    [t("clinic_reception_intake_pending"), summary.intakePending],
  ] as const;

  return (
    <ShellMainAppDir heading={t("clinic_reception")} subtitle={t("clinic_reception_subtitle")}>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="border-subtle rounded-md border p-4">
            <p className="text-subtle text-xs">{label}</p>
            <p className="text-emphasis text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={link({ view: "day" })} className={clinicSecondaryButtonClass} aria-current={view === "day"}>
          {t("clinic_reception_day")}
        </Link>
        <Link href={link({ view: "week" })} className={clinicSecondaryButtonClass} aria-current={view === "week"}>
          {t("clinic_reception_week")}
        </Link>
        <span className="mx-2" />
        <Link
          href={link({ date: anchor.subtract(step, "day").format("YYYY-MM-DD") })}
          className={clinicSecondaryButtonClass}>
          ←
        </Link>
        <Link href={link({ date: today })} className={clinicSecondaryButtonClass}>
          {t("clinic_reception_today")}
        </Link>
        <Link href={link({ date: anchor.add(step, "day").format("YYYY-MM-DD") })} className={clinicSecondaryButtonClass}>
          →
        </Link>
        <span className="text-emphasis ml-2 text-sm font-medium">
          {view === "week"
            ? `${formatDay(range.days[0])} – ${formatDay(range.days[range.days.length - 1])}`
            : formatDay(range.days[0])}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={link({ practitioner: undefined })} className={clinicSecondaryButtonClass}>
          {t("clinic_reception_all_staff")}
        </Link>
        {practitioners.map((p) => (
          <Link
            key={p.id}
            href={link({ practitioner: String(p.id) })}
            aria-current={p.id === selectedPractitioner?.id}
            className={`${clinicSecondaryButtonClass} ${p.id === selectedPractitioner?.id ? "bg-subtle" : ""}`}>
            {nameOf.get(p.id)}
          </Link>
        ))}
      </div>

      {range.days.map((day) => {
        const dayRows = rows.filter((row) => row.day === day);
        return (
          <section key={day} className="mb-6">
            {view === "week" && <h2 className="text-emphasis mb-2 text-sm font-semibold">{formatDay(day)}</h2>}
            {dayRows.length === 0 ? (
              <p className="text-subtle border-subtle rounded-md border px-4 py-3 text-sm">
                {t("clinic_reception_none")}
              </p>
            ) : (
              <ul className="divide-subtle border-subtle divide-y rounded-md border">
                {dayRows.map((row) => (
                  <li key={row.bookingId} className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
                    <span className="text-emphasis w-24 font-medium">
                      {formatTime(row.startTime)}–{formatTime(row.endTime)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-emphasis truncate font-medium">{row.patientName}</p>
                      <p className="text-subtle truncate">
                        {row.title}
                        {row.practitionerId ? ` · ${nameOf.get(row.practitionerId) ?? ""}` : ""}
                      </p>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs ${STATUS_CLASS[row.status] ?? "bg-subtle"}`}>
                      {t(`clinic_status_${row.status.toLowerCase()}`)}
                    </span>
                    <span className="text-subtle w-28 text-xs">{t(`clinic_intake_status_${row.intake}`)}</span>
                    <form action={toggleNoShowAction}>
                      <input type="hidden" name="bookingId" value={row.bookingId} />
                      <input type="hidden" name="noShow" value={String(!row.noShow)} />
                      <button type="submit" className={clinicSecondaryButtonClass}>
                        {row.noShow ? t("clinic_reception_undo_no_show") : t("clinic_reception_mark_no_show")}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </ShellMainAppDir>
  );
};

export default Page;
