export type ClinicRoleName = "admin" | "reception" | "practitioner";

/**
 * One deployment = one clinic, so every user is at least a practitioner. The instance admin
 * (Cal.com UserPermissionRole.ADMIN) bootstraps as clinic admin until a ClinicStaffRole says otherwise.
 */
export function resolveClinicRole(input: {
  userRole: string | null | undefined;
  staffRole: ClinicRoleName | null | undefined;
}): ClinicRoleName {
  if (input.staffRole) return input.staffRole;
  return input.userRole === "ADMIN" ? "admin" : "practitioner";
}

export function canManageCatalog(role: ClinicRoleName): boolean {
  return role === "admin";
}

export function canViewReception(role: ClinicRoleName): boolean {
  return role === "admin" || role === "reception";
}

/** Patient list, contact details and appointment history. */
export function canViewPatients(role: ClinicRoleName): boolean {
  return role === "admin" || role === "reception" || role === "practitioner";
}

/**
 * Intake answers are health information: only an admin or the practitioner treating that
 * appointment may read them. Reception only sees whether the form was completed.
 */
export function canViewIntakeAnswers(
  viewer: { role: ClinicRoleName; userId: number },
  appointmentPractitionerId: number | null
): boolean {
  if (viewer.role === "admin") return true;
  return viewer.role === "practitioner" && appointmentPractitionerId === viewer.userId;
}
