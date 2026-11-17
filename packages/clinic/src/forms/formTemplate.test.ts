import { describe, expect, it } from "vitest";

import { parseFormTemplate, validateFormResponses } from "./formTemplate";

const template = {
  fields: [
    { name: "reasonForVisit", label: "Reason for visit", type: "textarea", required: true },
    { name: "allergies", label: "Allergies", type: "textarea" },
  ],
};

describe("parseFormTemplate", () => {
  it("parses fields and defaults required to false", () => {
    expect(parseFormTemplate(template)).toEqual([
      { name: "reasonForVisit", label: "Reason for visit", type: "textarea", required: true },
      { name: "allergies", label: "Allergies", type: "textarea", required: false },
    ]);
  });

  it("rejects malformed templates", () => {
    expect(() => parseFormTemplate({ fields: [] })).toThrow("Invalid intake form template");
    expect(() => parseFormTemplate({ fields: [{ name: "bad name", label: "x", type: "text" }] })).toThrow();
    expect(() => parseFormTemplate(null)).toThrow();
  });
});

describe("validateFormResponses", () => {
  const fields = parseFormTemplate(template);

  it("trims answers and drops keys that are not in the template", () => {
    expect(
      validateFormResponses(fields, { reasonForVisit: " Sore knee ", allergies: "", injected: "<script>" })
    ).toEqual({ ok: true, values: { reasonForVisit: "Sore knee", allergies: "" } });
  });

  it("reports missing required answers", () => {
    expect(validateFormResponses(fields, { reasonForVisit: "   " })).toEqual({
      ok: false,
      missing: ["reasonForVisit"],
      tooLong: [],
    });
  });

  it("reports answers that are too long", () => {
    const result = validateFormResponses(fields, { reasonForVisit: "x", allergies: "a".repeat(4001) });
    expect(result).toEqual({ ok: false, missing: [], tooLong: ["allergies"] });
  });
});
