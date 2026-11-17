// Single-clinic AGPL deployment: no Cal.com billing, Organizations or Teams.
export const HIDDEN_SETTINGS_TABS: ReadonlySet<string> = new Set([
  "billing",
  "organization",
  "teams",
  "other_teams",
]);

export const HIDDEN_SETTINGS_CHILDREN: ReadonlySet<string> = new Set([
  "admin_billing",
  "organizations",
  "create_org",
  "create_license_key",
  "Workspace Platforms",
]);

type Tab = { name: string; children?: { name: string }[] };

export function applyClinicSettingsTabs<T extends Tab>(tabs: T[], enabled: boolean): T[] {
  if (!enabled) return tabs;

  return tabs
    .filter((tab) => !HIDDEN_SETTINGS_TABS.has(tab.name))
    .map((tab) =>
      tab.children
        ? { ...tab, children: tab.children.filter((child) => !HIDDEN_SETTINGS_CHILDREN.has(child.name)) }
        : tab
    );
}
