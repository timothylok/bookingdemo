import type { TFunction } from "i18next";

import { clinicInputClass, clinicLabelClass } from "../formStyles";

type Defaults = { name?: string; address?: string | null; phone?: string | null; kind?: string };

export function LocationFields({ t, defaults = {} }: { t: TFunction; defaults?: Defaults }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label>
        <span className={clinicLabelClass}>{t("clinic_location_name")}</span>
        <input name="name" required maxLength={120} defaultValue={defaults.name} className={clinicInputClass} />
      </label>
      <label>
        <span className={clinicLabelClass}>{t("clinic_location_kind")}</span>
        <select name="kind" defaultValue={defaults.kind ?? "clinic"} className={clinicInputClass}>
          <option value="clinic">{t("clinic_delivery_clinic")}</option>
          <option value="video">{t("clinic_delivery_video")}</option>
          <option value="phone">{t("clinic_delivery_phone")}</option>
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className={clinicLabelClass}>{t("clinic_address")}</span>
        <input name="address" maxLength={300} defaultValue={defaults.address ?? ""} className={clinicInputClass} />
      </label>
      <label>
        <span className={clinicLabelClass}>{t("clinic_phone")}</span>
        <input
          name="phone"
          type="tel"
          maxLength={40}
          defaultValue={defaults.phone ?? ""}
          className={clinicInputClass}
        />
      </label>
    </div>
  );
}
