import { describe, expect, it } from "vitest";

import type { CatalogAssignmentRow } from "./bookingCatalog";
import { buildBookingCatalog, filterOffers } from "./bookingCatalog";

const service = (id: number, name: string, active = true): CatalogAssignmentRow["service"] => ({
  id,
  name,
  durationMin: 30,
  priceCents: 6500,
  currency: "NZD",
  description: null,
  deliveryType: "clinic",
  active,
});

const users = [
  { id: 1, name: "Dr Sarah", username: "sarah" },
  { id: 2, name: null, username: "emma" },
  { id: 3, name: "No Username", username: null },
];
const eventTypes = [
  { id: 10, slug: "follow-up", hidden: false },
  { id: 11, slug: "initial", hidden: false },
  { id: 12, slug: "hidden-one", hidden: true },
  { id: 13, slug: "no-user", hidden: false },
];

const rows: CatalogAssignmentRow[] = [
  { practitionerUserId: 1, eventTypeId: 10, service: service(100, "Follow-up"), location: { name: "CBD", active: true } },
  { practitionerUserId: 2, eventTypeId: 11, service: service(101, "Initial"), location: null },
  { practitionerUserId: 1, eventTypeId: 12, service: service(101, "Initial"), location: null },
  { practitionerUserId: 3, eventTypeId: 13, service: service(100, "Follow-up"), location: null },
  { practitionerUserId: 1, eventTypeId: null, service: service(102, "Unsynced"), location: null },
  { practitionerUserId: 1, eventTypeId: 10, service: service(103, "Retired", false), location: null },
  { practitionerUserId: 1, eventTypeId: 10, service: service(104, "Closed site"), location: { name: "Old", active: false } },
];

describe("buildBookingCatalog", () => {
  const catalog = buildBookingCatalog(rows, eventTypes, users);

  it("keeps only offers a patient can book, with Booker links", () => {
    expect(catalog.offers.map((o) => [o.practitionerName, o.serviceName, o.href])).toEqual([
      ["Dr Sarah", "Follow-up", "/sarah/follow-up"],
      ["emma", "Initial", "/emma/initial"],
    ]);
  });

  it("lists distinct practitioners and services that have offers", () => {
    expect(catalog.practitioners).toEqual([
      { id: 1, name: "Dr Sarah" },
      { id: 2, name: "emma" },
    ]);
    expect(catalog.services.map((s) => s.name)).toEqual(["Follow-up", "Initial"]);
  });

  it("filters offers by practitioner or by service", () => {
    expect(filterOffers(catalog, { practitionerId: 2 }).map((o) => o.serviceName)).toEqual(["Initial"]);
    expect(filterOffers(catalog, { serviceId: 100 }).map((o) => o.practitionerName)).toEqual(["Dr Sarah"]);
    expect(filterOffers(catalog, {})).toHaveLength(2);
  });
});
