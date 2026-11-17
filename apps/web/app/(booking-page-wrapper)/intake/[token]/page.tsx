import type { PageProps } from "app/_types";
import { getTranslate } from "app/_utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isClinicMode } from "@calcom/clinic/src/config";
import { parseFormTemplate } from "@calcom/clinic/src/forms/formTemplate";
import { findIntakeFormByToken } from "@calcom/clinic/src/forms/intakeFormRepository";
import { isIntakeTokenUsable } from "@calcom/clinic/src/forms/intakeToken";
import { APP_NAME } from "@calcom/lib/constants";

import { clinicButtonClass, clinicInputClass, clinicLabelClass } from "~/clinic/formStyles";

import { submitIntakeAction } from "./actions";

// Personal health form links must never be indexed or cached by search engines.
export const metadata: Metadata = {
  title: `Health questionnaire | ${APP_NAME}`,
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-default min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-subtle text-sm font-medium">{APP_NAME}</p>
        {children}
      </div>
    </main>
  );
}

const Page = async ({ params: _params, searchParams: _searchParams }: PageProps) => {
  if (!isClinicMode()) notFound();
  const params = await _params;
  const searchParams = await _searchParams;
  const t = await getTranslate();
  const token = typeof params?.token === "string" ? params.token : "";
  const form = await findIntakeFormByToken(token);

  if (form?.submittedAt) {
    return (
      <Shell>
        <h1 className="text-emphasis mt-1 text-2xl font-semibold">{t("clinic_intake_thanks_title")}</h1>
        <p className="text-subtle mt-2">{t("clinic_intake_thanks_body")}</p>
      </Shell>
    );
  }

  if (!form || !isIntakeTokenUsable(form, new Date())) {
    return (
      <Shell>
        <h1 className="text-emphasis mt-1 text-2xl font-semibold">{t("clinic_intake_unavailable_title")}</h1>
        <p className="text-subtle mt-2">{t("clinic_intake_unavailable_body")}</p>
      </Shell>
    );
  }

  const fields = parseFormTemplate(form.template.schemaJson);

  return (
    <Shell>
      <h1 className="text-emphasis mt-1 text-2xl font-semibold">{form.template.name}</h1>
      <p className="text-subtle mt-1">{t("clinic_intake_intro", { name: form.patient.name })}</p>
      {searchParams?.error && (
        <p role="alert" className="bg-error text-error mt-4 rounded-md px-4 py-2 text-sm">
          {t("clinic_intake_error")}
        </p>
      )}
      <form action={submitIntakeAction} className="border-subtle mt-6 space-y-5 rounded-md border p-6">
        <input type="hidden" name="token" value={token} />
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className={clinicLabelClass}>
              {field.label}
              {field.required ? " *" : ""}
            </span>
            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                rows={3}
                maxLength={4000}
                required={field.required}
                className={clinicInputClass}
              />
            ) : (
              <input name={field.name} maxLength={4000} required={field.required} className={clinicInputClass} />
            )}
          </label>
        ))}
        <p className="text-subtle text-xs">{t("clinic_intake_privacy")}</p>
        <button type="submit" className={clinicButtonClass}>
          {t("clinic_intake_submit")}
        </button>
      </form>
    </Shell>
  );
};

export default Page;
