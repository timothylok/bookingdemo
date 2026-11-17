import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

export const locationFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    address: optionalText(300),
    phone: optionalText(40),
    kind: z.enum(["clinic", "video", "phone"]),
  })
  .refine((value) => value.kind !== "clinic" || value.address !== null, {
    message: "An in-clinic location needs an address",
    path: ["address"],
  });

export type LocationFormValues = z.infer<typeof locationFormSchema>;

export type LocationParseResult = { ok: true; values: LocationFormValues } | { ok: false; error: string };

export function parseLocationForm(
  input: Record<string, FormDataEntryValue | null | undefined>
): LocationParseResult {
  const parsed = locationFormSchema.safeParse({
    name: input.name ?? "",
    address: input.address ?? "",
    phone: input.phone ?? "",
    kind: input.kind ?? "clinic",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `${first.path.join(".")}: ${first.message}` };
  }
  return { ok: true, values: parsed.data };
}
