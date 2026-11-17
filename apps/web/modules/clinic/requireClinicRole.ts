import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import type { ClinicRoleName } from "@calcom/clinic/src/auth/clinicRole";
import { getClinicRole } from "@calcom/clinic/src/auth/getClinicRole";
import { isClinicMode } from "@calcom/clinic/src/config";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

/** Used by clinic page.tsx files and server actions; redirects instead of rendering for the wrong role. */
export async function requireClinicRole(
  isAllowed: (role: ClinicRoleName) => boolean
): Promise<{ userId: number; role: ClinicRoleName }> {
  if (!isClinicMode()) notFound();
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });
  if (!session?.user?.id) redirect("/auth/login");

  const role = await getClinicRole({ id: session.user.id, role: session.user.role });
  if (!isAllowed(role)) redirect("/event-types");

  return { userId: session.user.id, role };
}
