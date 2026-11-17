import { describe, expect, it } from "vitest";

import { parseServiceForm } from "./serviceForm";

const valid = {
  name: " Initial Consultation ",
  durationMin: "45",
  price: "95.50",
  description: "",
  color: "#3b82f6",
  deliveryType: "clinic",
};

describe("parseServiceForm", () => {
  it("parses and normalises a valid form", () => {
    expect(parseServiceForm(valid)).toEqual({
      ok: true,
      values: {
        name: "Initial Consultation",
        durationMin: 45,
        priceCents: 9550,
        description: null,
        color: "#3b82f6",
        deliveryType: "clinic",
      },
    });
  });

  it("treats an empty price as free and an empty colour as none", () => {
    const result = parseServiceForm({ ...valid, price: "", color: "" });
    expect(result.ok && result.values.priceCents).toBe(0);
    expect(result.ok && result.values.color).toBeNull();
  });

  it.each([
    [{ name: "  " }, "name"],
    [{ durationMin: "2" }, "durationMin"],
    [{ durationMin: "abc" }, "durationMin"],
    [{ price: "-1" }, "price"],
    [{ color: "blue" }, "color"],
    [{ deliveryType: "carrier-pigeon" }, "deliveryType"],
  ])("rejects %o with an error naming %s", (override, field) => {
    const result = parseServiceForm({ ...valid, ...override });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.startsWith(field)).toBe(true);
  });
});
