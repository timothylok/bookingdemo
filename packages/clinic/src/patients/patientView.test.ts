import { describe, expect, it } from "vitest";

import { labelAnswers, normalisePatientQuery } from "./patientView";

const schema = {
  fields: [
    { name: "reasonForVisit", label: "Reason for visit", type: "textarea", required: true },
    { name: "allergies", label: "Allergies", type: "textarea" },
  ],
};

describe("labelAnswers", () => {
  it("uses template labels in template order", () => {
    expect(labelAnswers(schema, { allergies: "Penicillin", reasonForVisit: "Back pain" })).toEqual([
      { label: "Reason for visit", value: "Back pain" },
      { label: "Allergies", value: "Penicillin" },
    ]);
  });

  it("keeps answers to fields removed from the template", () => {
    expect(labelAnswers(schema, { reasonForVisit: "x", oldQuestion: "kept" })).toContainEqual({
      label: "oldQuestion",
      value: "kept",
    });
  });

  it("still shows answers when the template is invalid", () => {
    expect(labelAnswers({ fields: [] }, { reasonForVisit: "x" })).toEqual([
      { label: "reasonForVisit", value: "x" },
    ]);
  });

  it("returns nothing for missing or non-object responses", () => {
    expect(labelAnswers(schema, null)).toEqual([]);
    expect(labelAnswers(schema, ["a"])).toEqual([]);
  });
});

describe("normalisePatientQuery", () => {
  it("ignores empty or one-character searches", () => {
    expect(normalisePatientQuery(undefined)).toBeNull();
    expect(normalisePatientQuery(" a ")).toBeNull();
  });

  it("keeps the text and extracts digits for phone search", () => {
    expect(normalisePatientQuery(" 021 555 ")).toEqual({ text: "021 555", digits: "021555" });
    expect(normalisePatientQuery("Jane")).toEqual({ text: "Jane", digits: "" });
  });
});
