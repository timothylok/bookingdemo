import { prisma } from "@calcom/prisma";

import type { ClinicRoleName } from "./clinicRole";
import { resolveClinicRole } from "./clinicRole";

export async function getClinicRole(user: { id: number; role?: string | null }): Promise<ClinicRoleName> {
  const staff = await prisma.clinicStaffRole.findUnique({
    where: { userId: user.id },
    select: { role: true },
  });
  return resolveClinicRole({ userRole: user.role, staffRole: staff?.role ?? null });
}
