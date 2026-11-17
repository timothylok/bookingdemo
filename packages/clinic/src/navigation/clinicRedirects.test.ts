import { describe, expect, it } from "vitest";

import { getClinicRedirects } from "./clinicRedirects";

describe("getClinicRedirects", () => {
  it("adds nothing when clinic mode is off", () => {
    expect(getClinicRedirects(false)).toEqual([]);
  });

  it("redirects each hidden feature root and its sub-paths to event types", () => {
    const redirects = getClinicRedirects(true);
    const sources = redirects.map((r) => r.source);
    for (const root of ["teams", "workflows", "routing", "insights"]) {
      expect(sources).toContain(`/${root}`);
      expect(sources).toContain(`/${root}/:path*`);
    }
    expect(redirects.every((r) => r.destination === "/event-types" && r.permanent === false)).toBe(true);
  });
});
