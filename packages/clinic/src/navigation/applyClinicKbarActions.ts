// Command-palette entries for features hidden in clinic mode (see applyClinicNavigation).
export const HIDDEN_KBAR_ACTION_IDS: ReadonlySet<string> = new Set(["workflows", "teams", "insights", "routing"]);

export function applyClinicKbarActions<T extends { id: string }>(actions: readonly T[], enabled: boolean): T[] {
  if (!enabled) return [...actions];
  return actions.filter((action) => !HIDDEN_KBAR_ACTION_IDS.has(action.id));
}
