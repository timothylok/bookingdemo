import type { PageProps } from "app/_types";
import { _generateMetadata, getTranslate } from "app/_utils";
import Link from "next/link";

import { canViewPatients } from "@calcom/clinic/src/auth/clinicRole";
import { listPatients } from "@calcom/clinic/src/patients/patientRepository";
import dayjs from "@calcom/dayjs";

import { clinicButtonClass, clinicInputClass } from "~/clinic/formStyles";
import { requireClinicRole } from "~/clinic/requireClinicRole";

import { ShellMainAppDir } from "../../ShellMainAppDir";

const TIME_ZONE = process.env.CLINIC_TIME_ZONE ?? "Pacific/Auckland";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("clinic_patients"),
    (t) => t("clinic_patients_subtitle"),
    undefined,
    undefined,
    "/clinic/patients"
  );

const Page = async ({ searchParams: _searchParams }: PageProps) => {
  await requireClinicRole(canViewPatients);
  const searchParams = await _searchParams;
  const t = await getTranslate();
  const query = typeof searchParams?.q === "string" ? searchParams.q : "";
  const patients = await listPatients(query);

  return (
    <ShellMainAppDir heading={t("clinic_patients")} subtitle={t("clinic_patients_subtitle")}>
      <form className="mb-6 flex gap-2" role="search">
        <input
          name="q"
          defaultValue={query}
          placeholder={t("clinic_patients_search")}
          aria-label={t("clinic_patients_search")}
          className={clinicInputClass}
        />
        <button type="submit" className={clinicButtonClass}>
          {t("search")}
        </button>
      </form>

      {patients.length === 0 ? (
        <p className="border-subtle text-subtle rounded-md border p-6 text-sm">{t("clinic_patients_none")}</p>
      ) : (
        <ul className="divide-subtle border-subtle divide-y rounded-md border">
          {patients.map((patient) => (
            <li key={patient.id}>
              <Link
                href={`/clinic/patients/${patient.id}`}
                className="hover:bg-subtle flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-emphasis truncate font-medium">{patient.name}</p>
                  <p className="text-subtle truncate">
                    {patient.email}
                    {patient.phone ? ` · ${patient.phone}` : ""}
                  </p>
                </div>
                <span className="text-subtle text-xs">
                  {t("clinic_patients_appointments", { count: patient._count.bookings })}
                  {patient.bookings[0]
                    ? ` · ${t("clinic_patients_latest")} ${dayjs(patient.bookings[0].startTime)
                        .tz(TIME_ZONE)
                        .format("D MMM YYYY")}`
                    : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ShellMainAppDir>
  );
};

export default Page;
