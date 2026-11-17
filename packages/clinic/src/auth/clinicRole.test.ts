import { describe, expect, it } from "vitest";

import { canManageCatalog, canViewReception, resolveClinicRole } from "./clinicRole";

describe("resolveClinicRole", () => {
  it("uses the explicit clinic staff role when present", () => {
    expect(resolveClinicRole({ userRole: "ADMIN", staffRole: "reception" })).toBe("reception");
    expect(resolveClinicRole({ userRole: "USER", staffRole: "admin" })).toBe("admin");
  });

  it("treats the instance admin as clinic admin by default", () => {
    expect(resolveClinicRole({ userRole: "ADMIN", staffRole: null })).toBe("admin");
  });

  it("defaults everyone else to practitioner", () => {
    expect(resolveClinicRole({ userRole: "USER", staffRole: null })).toBe("practitioner");
    expect(resolveClinicRole({ userRole: undefined, staffRole: undefined })).toBe("practitioner");
  });
});

describe("permissions", () => {
  it("only admins manage the catalog", () => {
    expect(canManageCatalog("admin")).toBe(true);
    expect(canManageCatalog("reception")).toBe(false);
    expect(canManageCatalog("practitioner")).toBe(false);
  });

  it("admins and reception see the reception dashboard", () => {
    expect(canViewReception("admin")).toBe(true);
    expect(canViewReception("reception")).toBe(true);
    expect(canViewReception("practitioner")).toBe(false);
  });
});
