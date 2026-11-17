// NEXT_PUBLIC_ so the same flag works in client components (navigation) and on the server.
export function isClinicMode(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_CLINIC_MODE === "1" || env.NEXT_PUBLIC_CLINIC_MODE === "true";
}
