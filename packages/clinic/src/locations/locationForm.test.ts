import { describe, expect, it } from "vitest";

import { parseLocationForm } from "./locationForm";

describe("parseLocationForm", () => {
  it("parses an in-clinic location", () => {
    expect(
      parseLocationForm({ name: " North Shore Clinic ", address: "5 Lake Rd", phone: "", kind: "clinic" })
    ).toEqual({
      ok: true,
      values: { name: "North Shore Clinic", address: "5 Lake Rd", phone: null, kind: "clinic" },
    });
  });

  it("allows telehealth without an address", () => {
    const result = parseLocationForm({ name: "Telehealth", address: "", phone: "", kind: "video" });
    expect(result.ok && result.values.address).toBeNull();
  });

  it("requires an address for in-clinic locations", () => {
    const result = parseLocationForm({ name: "CBD", address: " ", phone: "", kind: "clinic" });
    expect(result).toEqual({ ok: false, error: "address: An in-clinic location needs an address" });
  });

  it.each([
    [{ name: "" }, "name"],
    [{ kind: "teleport" }, "kind"],
  ])("rejects %o with an error naming %s", (override, field) => {
    const result = parseLocationForm({ name: "X", address: "1 St", phone: "", kind: "clinic", ...override });
    expect(!result.ok && result.error.startsWith(field)).toBe(true);
  });
});
