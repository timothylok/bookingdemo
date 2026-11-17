import { describe, expect, it } from "vitest";

import { getFallbackPhoneCountry } from "./config";

describe("getFallbackPhoneCountry", () => {
  it("keeps upstream's US fallback outside clinic mode", () => {
    expect(getFallbackPhoneCountry(false, "au")).toBe("us");
  });

  it("defaults to New Zealand in clinic mode", () => {
    expect(getFallbackPhoneCountry(true, undefined)).toBe("nz");
  });

  it("accepts a two-letter override and rejects junk", () => {
    expect(getFallbackPhoneCountry(true, "AU")).toBe("au");
    expect(getFallbackPhoneCountry(true, "australia")).toBe("nz");
    expect(getFallbackPhoneCountry(true, "")).toBe("nz");
  });
});
