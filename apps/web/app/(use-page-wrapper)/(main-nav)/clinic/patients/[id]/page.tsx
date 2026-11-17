import type { PageProps } from "app/_types";
import { _generateMetadata, getTranslate } from "app/_utils";
import Link from "next/link";
import { notFound } from "next/navigation";

import { canViewIntakeAnswers, canViewPatients } from "@calcom/clinic/src/auth/clinicRole";
import { getPatientDetail } from "@calcom/clinic/src/patients/patientRepository";
import { labelAnswers } from "@calcom/clinic/src/patients/patientView";
import dayjs from "@calcom/dayjs";

import { clinicSecondaryButtonClass } from "~/clinic/formStyles";
import { requireClinicRole } from "~/clinic/requireClinicRole";

import { ShellMainAppDir } from "../../../ShellMainAppDir";

const TIME_ZONE = process.env.CLINIC_TIME_ZONE ?? "Pacific/Auckland";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("clinic_patient"),
    (t) => t("clinic_patients_subtitle"),
    undefined,
    undefined,
    "/clinic/patients"
  );

const Page = async ({ params: _params }: PageProps) => {
  const viewer = await requireClinicRole(canViewPatients);
  const params = await _params;
  const t = await getTranslate();

  const id = Number(params?.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const patient = await getPatientDetail(id);
  if (!patient) notFound();

  const formByBookingId = new Map(patient.forms.map((form) => [form.bookingId, form]));

  return (
    <ShellMainAppDir heading={patient.name} subtitle={t("clinic_patient")}>
      <div className="border-subtle mb-6 rounded-md border p-4 text-sm">
        <p>
          <span className="text-subtle">{t("email")}: </span>
          <a className="text-emphasis underline" href={`mailto:${patient.email}`}>
            {patient.email}
          </a>
        </p>
        <p>
          <span className="text-subtle">{t("clinic_phone")}: </span>
          {patient.phone ? (
            <a className="text-emphasis underline" href={`tel:${patient.phone}`}>
              {patient.phone}
            </a>
          ) : (
            "—"
          )}
        </p>
      </div>

      <h2 className="text-emphasis mb-2 text-lg font-semibold">{t("clinic_patients_history")}</h2>
      {patient.bookings.length === 0 ? (
        <p className="text-subtle text-sm">{t("clinic_reception_none")}</p>
      ) : (
        <ul className="space-y-3">
          {patient.bookings.map((link) => {
            const booking = patient.bookingById.get(link.bookingId);
            const form = formByBookingId.get(link.bookingId);
            const practitionerId = booking?.userId ?? null;
            const mayReadAnswers = canViewIntakeAnswers(viewer, practitionerId);
            const answers = form?.submittedAt && mayReadAnswers ? labelAnswers(form.template.schemaJson, form.responseJson) : [];

            return (
              <li key={link.bookingId} className="border-subtle rounded-md border p-4 text-sm">
                <p className="text-emphasis font-medium">
                  {dayjs(link.startTime).tz(TIME_ZONE).format("ddd D MMM YYYY, HH:mm")} ·{" "}
                  {booking?.title ?? t("clinic_unknown_booking")}
                </p>
                <p className="text-subtle">
                  {[
                    booking?.user?.name ?? booking?.user?.username,
                    t(`clinic_status_${link.status.toLowerCase()}`),
                    t(`clinic_intake_status_${form ? (form.submittedAt ? "submitted" : "pending") : "none"}`),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {form?.submittedAt && !mayReadAnswers && (
                  <p className="text-subtle mt-2 text-xs">{t("clinic_patients_answers_restricted")}</p>
                )}
                {answers.length > 0 && (
                  <dl className="bg-subtle mt-3 space-y-2 rounded-md p-3">
                    {answers.map((answer) => (
                      <div key={answer.label}>
                        <dt className="text-subtle text-xs">{answer.label}</dt>
                        <dd className="text-emphasis whitespace-pre-wrap">{answer.value || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/clinic/patients" className={`${clinicSecondaryButtonClass} mt-6 inline-block`}>
        {t("clinic_back")}
      </Link>
    </ShellMainAppDir>
  );
};

export default Page;
