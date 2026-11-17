import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  durationMin: z.coerce.number().int().min(5, "Minimum 5 minutes").max(480, "Maximum 8 hours"),
  // Entered in dollars in the UI, stored in cents.
  price: z.coerce.number().min(0).max(100000),
  description: optionalText,
  color: z
    .string()
    .trim()
    .regex(/^(#[0-9a-fA-F]{6})?$/, "Colour must look like #3b82f6")
    .transform((value) => (value === "" ? null : value)),
  deliveryType: z.enum(["clinic", "video", "phone"]),
});

export type ServiceFormValues = {
  name: string;
  durationMin: number;
  priceCents: number;
  description: string | null;
  color: string | null;
  deliveryType: "clinic" | "video" | "phone";
};

export type ParseResult = { ok: true; values: ServiceFormValues } | { ok: false; error: string };

export function parseServiceForm(input: Record<string, FormDataEntryValue | null | undefined>): ParseResult {
  const parsed = serviceFormSchema.safeParse({
    name: input.name ?? "",
    durationMin: input.durationMin ?? "",
    price: input.price === "" || input.price == null ? "0" : input.price,
    description: input.description ?? "",
    color: input.color ?? "",
    deliveryType: input.deliveryType ?? "clinic",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `${first.path.join(".")}: ${first.message}` };
  }

  const { price, ...rest } = parsed.data;
  return { ok: true, values: { ...rest, priceCents: Math.round(price * 100) } };
}
