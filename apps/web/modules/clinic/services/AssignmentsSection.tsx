import type { TFunction } from "i18next";

import { clinicButtonClass, clinicInputClass, clinicLabelClass, clinicSecondaryButtonClass } from "../formStyles";

type Assignment = {
  id: number;
  eventTypeId: number | null;
  location: { id: number; name: string } | null;
  practitioner: { id: number; name: string | null; username: string | null } | null;
};
type Person = { id: number; name: string | null; username: string | null };
type Place = { id: number; name: string; active: boolean };

function displayName(person: Person) {
  return person.name ?? person.username ?? `#${person.id}`;
}

export function AssignmentsSection(props: {
  t: TFunction;
  serviceId: number;
  assignments: Assignment[];
  practitioners: Person[];
  locations: Place[];
  assignAction: (formData: FormData) => Promise<void>;
  unassignAction: (formData: FormData) => Promise<void>;
}) {
  const { t, serviceId, assignments, practitioners, locations } = props;
  const activeLocations = locations.filter((location) => location.active);

  return (
    <section className="border-subtle mt-8 rounded-md border p-6">
      <h2 className="text-emphasis text-lg font-semibold">{t("clinic_practitioners")}</h2>
      <p className="text-subtle mb-4 text-sm">{t("clinic_assignments_help")}</p>

      {assignments.length === 0 ? (
        <p className="text-subtle mb-4 text-sm">{t("clinic_no_assignments")}</p>
      ) : (
        <ul className="divide-subtle border-subtle mb-6 divide-y rounded-md border">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="flex items-center gap-4 px-4 py-2">
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-emphasis font-medium">
                  {assignment.practitioner ? displayName(assignment.practitioner) : t("clinic_unknown_user")}
                </p>
                <p className="text-subtle">
                  {assignment.location?.name ?? t("clinic_any_location")}
                  {assignment.eventTypeId ? "" : ` · ${t("clinic_not_synced")}`}
                </p>
              </div>
              <form action={props.unassignAction}>
                <input type="hidden" name="id" value={serviceId} />
                <input type="hidden" name="assignmentId" value={assignment.id} />
                <button type="submit" className={clinicSecondaryButtonClass}>
                  {t("clinic_remove")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={props.assignAction} className="grid items-end gap-4 sm:grid-cols-3">
        <input type="hidden" name="id" value={serviceId} />
        <label>
          <span className={clinicLabelClass}>{t("clinic_practitioner")}</span>
          <select name="practitionerUserId" required className={clinicInputClass} defaultValue="">
            <option value="" disabled>
              {t("clinic_choose")}
            </option>
            {practitioners.map((person) => (
              <option key={person.id} value={person.id}>
                {displayName(person)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={clinicLabelClass}>{t("clinic_location")}</span>
          <select name="locationId" className={clinicInputClass} defaultValue="">
            <option value="">{t("clinic_any_location")}</option>
            {activeLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={clinicButtonClass}>
          {t("clinic_assign")}
        </button>
      </form>
    </section>
  );
}
