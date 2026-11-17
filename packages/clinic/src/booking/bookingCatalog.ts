export type CatalogAssignmentRow = {
  practitionerUserId: number;
  eventTypeId: number | null;
  service: {
    id: number;
    name: string;
    durationMin: number;
    priceCents: number;
    currency: string;
    description: string | null;
    deliveryType: "clinic" | "video" | "phone";
    active: boolean;
  };
  location: { name: string; active: boolean } | null;
};
export type CatalogEventType = { id: number; slug: string; hidden: boolean };
export type CatalogUser = { id: number; name: string | null; username: string | null };

export type BookableOffer = {
  serviceId: number;
  serviceName: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
  currency: string;
  deliveryType: "clinic" | "video" | "phone";
  locationName: string | null;
  practitionerId: number;
  practitionerName: string;
  href: string;
};

export type BookingCatalog = {
  offers: BookableOffer[];
  practitioners: { id: number; name: string }[];
  services: { id: number; name: string; durationMin: number }[];
};

/**
 * Only offers a patient can actually complete are listed: active service and location, a synced and
 * visible EventType, and a practitioner with a username (the Booker URL is /{username}/{slug}).
 */
export function buildBookingCatalog(
  rows: CatalogAssignmentRow[],
  eventTypes: CatalogEventType[],
  users: CatalogUser[]
): BookingCatalog {
  const eventTypeById = new Map(eventTypes.map((e) => [e.id, e]));
  const userById = new Map(users.map((u) => [u.id, u]));

  const offers: BookableOffer[] = [];
  for (const row of rows) {
    if (!row.service.active || (row.location && !row.location.active) || row.eventTypeId === null) continue;
    const eventType = eventTypeById.get(row.eventTypeId);
    const user = userById.get(row.practitionerUserId);
    if (!eventType || eventType.hidden || !user?.username) continue;

    offers.push({
      serviceId: row.service.id,
      serviceName: row.service.name,
      description: row.service.description,
      durationMin: row.service.durationMin,
      priceCents: row.service.priceCents,
      currency: row.service.currency,
      deliveryType: row.service.deliveryType,
      locationName: row.location?.name ?? null,
      practitionerId: user.id,
      practitionerName: user.name ?? user.username,
      href: `/${user.username}/${eventType.slug}`,
    });
  }

  offers.sort(
    (a, b) =>
      a.practitionerName.localeCompare(b.practitionerName) ||
      a.serviceName.localeCompare(b.serviceName) ||
      (a.locationName ?? "").localeCompare(b.locationName ?? "")
  );

  const practitioners = [...new Map(offers.map((o) => [o.practitionerId, o.practitionerName])).entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const services = [
    ...new Map(offers.map((o) => [o.serviceId, { id: o.serviceId, name: o.serviceName, durationMin: o.durationMin }])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return { offers, practitioners, services };
}

export function filterOffers(
  catalog: BookingCatalog,
  filter: { practitionerId?: number; serviceId?: number }
): BookableOffer[] {
  return catalog.offers.filter(
    (offer) =>
      (filter.practitionerId === undefined || offer.practitionerId === filter.practitionerId) &&
      (filter.serviceId === undefined || offer.serviceId === filter.serviceId)
  );
}
