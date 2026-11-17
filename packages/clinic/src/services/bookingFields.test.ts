import { describe, expect, it } from "vitest";

import { REQUIRED_PHONE_FIELD, withRequiredPhone } from "./bookingFields";

describe("withRequiredPhone", () => {
  it("creates just the phone field when there are no fields yet", () => {
    expect(withRequiredPhone(null)).toEqual([REQUIRED_PHONE_FIELD]);
    expect(withRequiredPhone([])).toEqual([REQUIRED_PHONE_FIELD]);
  });

  it("makes an existing hidden optional phone field required and visible", () => {
    const fields = [
      { name: "name", type: "name" },
      { name: "attendeePhoneNumber", type: "phone", required: false, hidden: true, label: "Mobile" },
    ];
    expect(withRequiredPhone(fields)).toEqual([
      { name: "name", type: "name" },
      { name: "attendeePhoneNumber", type: "phone", required: true, hidden: false, label: "Mobile" },
    ]);
  });

  it("inserts the phone field after email and keeps custom fields", () => {
    const fields = [
      { name: "name" },
      { name: "email" },
      { name: "injury-area", type: "text", label: "Which area hurts?" },
    ];
    expect(withRequiredPhone(fields).map((f) => f.name)).toEqual([
      "name",
      "email",
      "attendeePhoneNumber",
      "injury-area",
    ]);
  });

  it("ignores malformed entries", () => {
    expect(withRequiredPhone([null, 42, { label: "no name" }])).toEqual([REQUIRED_PHONE_FIELD]);
  });
});
