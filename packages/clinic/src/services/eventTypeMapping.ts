import { slugify } from "@calcom/lib/slugify";

export type ClinicDeliveryType = "clinic" | "video" | "phone";

export type ServiceInput = {
  name: string;
  durationMin: number;
  description: string | null;
  color: string | null;
  deliveryType: ClinicDeliveryType;
};

export type LocationInput = {
  name: string;
  address: string | null;
  phone: string | null;
  kind: ClinicDeliveryType;
};

export type EventTypeLocation =
  | { type: "inPerson"; address: string; displayLocationPublicly: boolean }
  | { type: "integrations:google:meet" }
  | { type: "phone" }
  | { type: "userPhone"; hostPhoneNumber: string };

export type EventTypeData = {
  title: string;
  slug: string;
  length: number;
  description: string | null;
  locations: EventTypeLocation[];
  eventTypeColor: { lightEventTypeColor: string; darkEventTypeColor: string } | null;
  hidden: boolean;
};

// "phone" = the booker's number, i.e. the practitioner phones the patient.
export function buildLocations(
  deliveryType: ClinicDeliveryType,
  location: LocationInput | null
): EventTypeLocation[] {
  const kind = location?.kind ?? deliveryType;

  if (kind === "video") return [{ type: "integrations:google:meet" }];
  if (kind === "phone") return [{ type: "phone" }];

  const address = location?.address ?? location?.name;
  return address ? [{ type: "inPerson", address, displayLocationPublicly: true }] : [];
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function buildEventTypeData(service: ServiceInput, location: LocationInput | null): EventTypeData {
  const title = location ? `${service.name} - ${location.name}` : service.name;
  const color = service.color && HEX_COLOR.test(service.color) ? service.color : null;

  return {
    title,
    slug: slugify(title),
    length: service.durationMin,
    description: service.description,
    locations: buildLocations(service.deliveryType, location),
    eventTypeColor: color ? { lightEventTypeColor: color, darkEventTypeColor: color } : null,
    hidden: false,
  };
}

export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
