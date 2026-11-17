// Must read process.env.NEXT_PUBLIC_CLINIC_MODE literally: Next only inlines NEXT_PUBLIC_* in
// client bundles when accessed this way, so reading it via the process.env object is always false in the browser.
export function isClinicMode(value: string | undefined = process.env.NEXT_PUBLIC_CLINIC_MODE): boolean {
  return value === "1" || value === "true";
}
