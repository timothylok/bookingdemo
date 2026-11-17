import { describe, expect, it } from "vitest";

import { buildEventTypeData, buildLocations, uniqueSlug } from "./eventTypeMapping";
import type { LocationInput, ServiceInput } from "./eventTypeMapping";

const service: ServiceInput = {
  name: "Initial Consultation",
  durationMin: 45,
  description: "First visit",
  color: "#3b82f6",
  deliveryType: "clinic",
};
const cbd: LocationInput = { name: "Auckland CBD Clinic", address: "1 Queen St", phone: "09 123", kind: "clinic" };
const telehealth: LocationInput = { name: "Telehealth", address: null, phone: null, kind: "video" };

describe("buildLocations", () => {
  it("uses the clinic address for in-person locations", () => {
    expect(buildLocations("clinic", cbd)).toEqual([
      { type: "inPerson", address: "1 Queen St", displayLocationPublicly: true },
    ]);
  });

  it("falls back to the location name when there is no address", () => {
    expect(buildLocations("clinic", { ...cbd, address: null })).toEqual([
      { type: "inPerson", address: "Auckland CBD Clinic", displayLocationPublicly: true },
    ]);
  });

  it("the location kind wins over the service delivery type", () => {
    expect(buildLocations("clinic", telehealth)).toEqual([{ type: "integrations:google:meet" }]);
  });

  it("uses the service delivery type when there is no location", () => {
    expect(buildLocations("phone", null)).toEqual([{ type: "phone" }]);
    expect(buildLocations("video", null)).toEqual([{ type: "integrations:google:meet" }]);
  });

  it("returns no locations for an in-person service without any location", () => {
    expect(buildLocations("clinic", null)).toEqual([]);
  });
});

describe("buildEventTypeData", () => {
  it("maps a service at a location", () => {
    expect(buildEventTypeData(service, cbd)).toEqual({
      title: "Initial Consultation - Auckland CBD Clinic",
      slug: "initial-consultation-auckland-cbd-clinic",
      length: 45,
      description: "First visit",
      locations: [{ type: "inPerson", address: "1 Queen St", displayLocationPublicly: true }],
      eventTypeColor: { lightEventTypeColor: "#3b82f6", darkEventTypeColor: "#3b82f6" },
      hidden: false,
    });
  });

  it("keeps the plain service name as title and slug without a location", () => {
    const data = buildEventTypeData({ ...service, deliveryType: "video" }, null);
    expect(data.title).toBe("Initial Consultation");
    expect(data.slug).toBe("initial-consultation");
  });

  it("drops invalid colours instead of storing them", () => {
    expect(buildEventTypeData({ ...service, color: "blue" }, null).eventTypeColor).toBeNull();
    expect(buildEventTypeData({ ...service, color: null }, null).eventTypeColor).toBeNull();
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when free", () => {
    expect(uniqueSlug("physio", new Set(["other"]))).toBe("physio");
  });

  it("appends the next free numeric suffix on collision", () => {
    expect(uniqueSlug("physio", new Set(["physio"]))).toBe("physio-2");
    expect(uniqueSlug("physio", new Set(["physio", "physio-2"]))).toBe("physio-3");
  });
});
