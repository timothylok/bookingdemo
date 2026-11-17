import { describe, expect, it } from "vitest";

import {
  canManageCatalog,
  canViewIntakeAnswers,
  canViewPatients,
  canViewReception,
  resolveClinicRole,
} from "./clinicRole";

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

  it("all clinic roles can open the patient list", () => {
    expect(canViewPatients("admin")).toBe(true);
    expect(canViewPatients("reception")).toBe(true);
    expect(canViewPatients("practitioner")).toBe(true);
  });

  it("only admins and the treating practitioner can read intake answers", () => {
    expect(canViewIntakeAnswers({ role: "admin", userId: 1 }, 9)).toBe(true);
    expect(canViewIntakeAnswers({ role: "practitioner", userId: 9 }, 9)).toBe(true);
    expect(canViewIntakeAnswers({ role: "practitioner", userId: 8 }, 9)).toBe(false);
    expect(canViewIntakeAnswers({ role: "practitioner", userId: 8 }, null)).toBe(false);
    expect(canViewIntakeAnswers({ role: "reception", userId: 9 }, 9)).toBe(false);
  });

  it("admins and reception see the reception dashboard", () => {
    expect(canViewReception("admin")).toBe(true);
    expect(canViewReception("reception")).toBe(true);
    expect(canViewReception("practitioner")).toBe(false);
  });
});
