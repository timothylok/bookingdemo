// Must read process.env.NEXT_PUBLIC_CLINIC_MODE literally: Next only inlines NEXT_PUBLIC_* in
// client bundles when accessed this way, so reading it via the process.env object is always false in the browser.
export function isClinicMode(value: string | undefined = process.env.NEXT_PUBLIC_CLINIC_MODE): boolean {
  return value === "1" || value === "true";
}

/**
 * Fallback country for phone inputs when no geo/browser hint exists. One deployment = one clinic,
 * so patients are most likely local. Override with NEXT_PUBLIC_CLINIC_PHONE_COUNTRY (ISO code).
 * Read literally so Next inlines it into client bundles (see isClinicMode).
 */
export function getFallbackPhoneCountry(
  clinicMode: boolean = isClinicMode(),
  override: string | undefined = process.env.NEXT_PUBLIC_CLINIC_PHONE_COUNTRY
): string {
  if (!clinicMode) return "us";
  return /^[a-zA-Z]{2}$/.test(override ?? "") ? (override as string).toLowerCase() : "nz";
}
