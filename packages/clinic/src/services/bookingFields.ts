type BookingField = { name: string } & Record<string, unknown>;

// Mirrors upstream's attendeePhoneNumber system field (packages/features/bookings/lib/getBookingFields.ts),
// but required and visible: clinics need a number for reminders and same-day changes.
export const REQUIRED_PHONE_FIELD: BookingField = {
  defaultLabel: "phone_number",
  type: "phone",
  name: "attendeePhoneNumber",
  required: true,
  hidden: false,
  editable: "system-but-optional",
  sources: [{ label: "Default", id: "default", type: "default" }],
};

function isBookingField(value: unknown): value is BookingField {
  return typeof value === "object" && value !== null && typeof (value as { name?: unknown }).name === "string";
}

/**
 * Returns booking fields with the patient phone required, preserving any custom fields the practitioner
 * added. Upstream fills in the remaining system fields (name, email, notes...) when the form is built.
 */
export function withRequiredPhone(existing: unknown): BookingField[] {
  const fields = Array.isArray(existing) ? existing.filter(isBookingField) : [];
  const phoneIndex = fields.findIndex((field) => field.name === REQUIRED_PHONE_FIELD.name);

  if (phoneIndex !== -1) {
    return fields.map((field, index) => (index === phoneIndex ? { ...field, required: true, hidden: false } : field));
  }

  const emailIndex = fields.findIndex((field) => field.name === "email");
  const insertAt = emailIndex === -1 ? 0 : emailIndex + 1;
  return [...fields.slice(0, insertAt), REQUIRED_PHONE_FIELD, ...fields.slice(insertAt)];
}
