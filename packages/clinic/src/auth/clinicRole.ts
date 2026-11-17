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
