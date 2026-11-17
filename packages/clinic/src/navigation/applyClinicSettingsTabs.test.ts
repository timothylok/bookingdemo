import { describe, expect, it } from "vitest";

import { applyClinicSettingsTabs } from "./applyClinicSettingsTabs";

const tabs = [
  { name: "my_account", children: [{ name: "profile" }, { name: "calendars" }] },
  { name: "billing", children: [{ name: "manage_billing" }] },
  { name: "organization", children: [{ name: "profile" }] },
  { name: "teams", children: [] },
  { name: "admin", children: [{ name: "users" }, { name: "organizations" }, { name: "admin_billing" }] },
];

describe("applyClinicSettingsTabs", () => {
  it("returns the same tabs when disabled", () => {
    expect(applyClinicSettingsTabs(tabs, false)).toBe(tabs);
  });

  it("removes billing, organization and team tabs and their admin children", () => {
    expect(applyClinicSettingsTabs(tabs, true)).toEqual([
      { name: "my_account", children: [{ name: "profile" }, { name: "calendars" }] },
      { name: "admin", children: [{ name: "users" }] },
    ]);
  });
});
