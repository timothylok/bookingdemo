import { z } from "zod";

const fieldSchema = z.object({
  name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  label: z.string().min(1),
  type: z.enum(["text", "textarea"]),
  required: z.boolean().default(false),
});
const templateSchema = z.object({ fields: z.array(fieldSchema).min(1) });

export type FormField = z.infer<typeof fieldSchema>;

const MAX_ANSWER_LENGTH = 4000;

export function parseFormTemplate(schemaJson: unknown): FormField[] {
  const parsed = templateSchema.safeParse(schemaJson);
  if (!parsed.success) throw new Error(`Invalid intake form template: ${parsed.error.issues[0]?.path.join(".")}`);
  return parsed.data.fields;
}

export type ResponseResult =
  | { ok: true; values: Record<string, string> }
  | { ok: false; missing: string[]; tooLong: string[] };

/** Only template fields are kept, so extra posted keys never reach the stored health record. */
export function validateFormResponses(
  fields: FormField[],
  input: Record<string, FormDataEntryValue | null | undefined>
): ResponseResult {
  const values: Record<string, string> = {};
  const missing: string[] = [];
  const tooLong: string[] = [];

  for (const field of fields) {
    const raw = input[field.name];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (field.required && value === "") missing.push(field.name);
    if (value.length > MAX_ANSWER_LENGTH) tooLong.push(field.name);
    values[field.name] = value;
  }

  return missing.length || tooLong.length ? { ok: false, missing, tooLong } : { ok: true, values };
}
