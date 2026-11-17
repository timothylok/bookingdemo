import type { TFunction } from "i18next";

import { clinicInputClass, clinicLabelClass } from "../formStyles";

type Defaults = {
  name?: string;
  durationMin?: number;
  priceCents?: number;
  description?: string | null;
  color?: string | null;
  deliveryType?: string;
};

export function ServiceFields({ t, defaults = {} }: { t: TFunction; defaults?: Defaults }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className={clinicLabelClass}>{t("clinic_service_name")}</span>
        <input name="name" required maxLength={120} defaultValue={defaults.name} className={clinicInputClass} />
      </label>
      <label>
        <span className={clinicLabelClass}>{t("clinic_duration_minutes")}</span>
        <input
          name="durationMin"
          type="number"
          required
          min={5}
          max={480}
          step={5}
          defaultValue={defaults.durationMin ?? 30}
          className={clinicInputClass}
        />
      </label>
      <label>
        <span className={clinicLabelClass}>{t("clinic_price")} (NZD)</span>
        <input
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaults.priceCents !== undefined ? (defaults.priceCents / 100).toFixed(2) : ""}
          className={clinicInputClass}
        />
      </label>
      <label>
        <span className={clinicLabelClass}>{t("clinic_delivery_type")}</span>
        <select name="deliveryType" defaultValue={defaults.deliveryType ?? "clinic"} className={clinicInputClass}>
          <option value="clinic">{t("clinic_delivery_clinic")}</option>
          <option value="video">{t("clinic_delivery_video")}</option>
          <option value="phone">{t("clinic_delivery_phone")}</option>
        </select>
      </label>
      <label>
        <span className={clinicLabelClass}>{t("clinic_colour")}</span>
        <input
          name="color"
          type="color"
          defaultValue={defaults.color ?? "#3b82f6"}
          className="border-default h-10 w-16 rounded-md border"
        />
      </label>
      <label className="sm:col-span-2">
        <span className={clinicLabelClass}>{t("clinic_description")}</span>
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={defaults.description ?? ""}
          className={clinicInputClass}
        />
      </label>
    </div>
  );
}
