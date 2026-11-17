// Upstream features that are /ee-licensed or irrelevant for a single-clinic deployment.
// Hidden rather than deleted so upstream merges stay conflict-free.
export const HIDDEN_NAV_ITEMS: ReadonlySet<string> = new Set([
  "teams",
  "members",
  "routing",
  "workflows",
  "insights",
]);

type NamedItem = { name: string };

/**
 * Removes hidden upstream items and inserts clinic items right after "availability",
 * so the primary nav reads: Event types, Bookings, Availability, <clinic items>, Apps.
 */
export function applyClinicNavigation<T extends NamedItem>(
  items: readonly T[],
  clinicItems: readonly T[],
  enabled: boolean
): T[] {
  if (!enabled) return [...items];

  const visible = items.filter((item) => !HIDDEN_NAV_ITEMS.has(item.name));
  const anchor = visible.findIndex((item) => item.name === "availability");
  const insertAt = anchor === -1 ? visible.length : anchor + 1;

  return [...visible.slice(0, insertAt), ...clinicItems, ...visible.slice(insertAt)];
}
