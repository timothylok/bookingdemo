import { parseFormTemplate } from "../forms/formTemplate";

export type LabelledAnswer = { label: string; value: string };

/** Pairs stored answers with the template's labels; answers to fields no longer in the template are kept last. */
export function labelAnswers(schemaJson: unknown, responseJson: unknown): LabelledAnswer[] {
  if (!responseJson || typeof responseJson !== "object" || Array.isArray(responseJson)) return [];
  const answers = responseJson as Record<string, unknown>;

  let labelled: LabelledAnswer[] = [];
  const seen = new Set<string>();
  try {
    labelled = parseFormTemplate(schemaJson).map((field) => {
      seen.add(field.name);
      return { label: field.label, value: typeof answers[field.name] === "string" ? (answers[field.name] as string) : "" };
    });
  } catch {
    // An edited/invalid template must not hide answers the patient already gave.
  }

  const extras = Object.entries(answers)
    .filter(([name, value]) => !seen.has(name) && typeof value === "string")
    .map(([name, value]) => ({ label: name, value: value as string }));
  return [...labelled, ...extras];
}

/** Search across the fields reception actually has to hand: name, email or phone digits. */
export function normalisePatientQuery(query: string | undefined): { text: string; digits: string } | null {
  const text = (query ?? "").trim().slice(0, 100);
  if (text.length < 2) return null;
  return { text, digits: text.replace(/\D/g, "") };
}
