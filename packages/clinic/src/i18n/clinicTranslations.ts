import clinicEnglish from "./en.json";

type Translations = Record<string, string>;

// Rewriting at load time (instead of editing upstream common.json) keeps merges clean and
// also relabels strings that upstream adds in future releases.
const TERM_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bAttendees\b/g, "Patients"],
  [/\bAttendee\b/g, "Patient"],
  [/\battendees\b/g, "patients"],
  [/\battendee\b/g, "patient"],
  [/\bHosts\b/g, "Practitioners"],
  [/\bHost\b/g, "Practitioner"],
  [/\bhosts\b/g, "practitioners"],
  [/\bhost\b/g, "practitioner"],
];

const KEY_OVERRIDES: Readonly<Translations> = {
  event_types_page_title: "Appointment types",
};

// Interpolation placeholders ({{attendee}}) and Trans tags (<0>) must never be rewritten.
const PROTECTED_SEGMENT = /(\{\{[^}]*\}\}|<[^>]*>)/;

export function relabelClinicTerms(value: string): string {
  return value
    .split(PROTECTED_SEGMENT)
    .map((segment, index) => {
      if (index % 2 === 1) return segment;
      return TERM_REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), segment);
    })
    .join("");
}

export function withClinicTranslations(base: Translations, enabled: boolean): Translations {
  if (!enabled) return base;

  const relabelled: Translations = {};
  for (const [key, value] of Object.entries(base)) {
    relabelled[key] = typeof value === "string" ? relabelClinicTerms(value) : value;
  }
  return { ...relabelled, ...KEY_OVERRIDES, ...clinicEnglish };
}
