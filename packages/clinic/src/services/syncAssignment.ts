import { ErrorWithCode } from "@calcom/lib/errors";

import { buildEventTypeData } from "./eventTypeMapping";
import type { EventTypeData, LocationInput, ServiceInput } from "./eventTypeMapping";

export type AssignmentRecord = {
  id: number;
  practitionerUserId: number;
  eventTypeId: number | null;
  service: ServiceInput & { active: boolean };
  location: (LocationInput & { active: boolean }) | null;
};

export type SyncDeps = {
  findAssignment(id: number): Promise<AssignmentRecord | null>;
  createEventType(userId: number, data: EventTypeData): Promise<{ id: number }>;
  updateEventType(eventTypeId: number, data: EventTypeData): Promise<boolean>;
  linkAssignment(assignmentId: number, eventTypeId: number): Promise<void>;
};

export type SyncResult = { eventTypeId: number; action: "created" | "updated" };

/**
 * Makes the practitioner's EventType match the catalog entry. An inactive service or location
 * hides the EventType instead of deleting it, so existing bookings keep their EventType.
 */
export async function syncAssignment(assignmentId: number, deps: SyncDeps): Promise<SyncResult> {
  const assignment = await deps.findAssignment(assignmentId);
  if (!assignment) {
    throw ErrorWithCode.Factory.NotFound(`Clinic service assignment ${assignmentId} not found`);
  }

  const data = buildEventTypeData(assignment.service, assignment.location);
  const active = assignment.service.active && (assignment.location?.active ?? true);
  const payload: EventTypeData = { ...data, hidden: !active };

  if (assignment.eventTypeId !== null) {
    const updated = await deps.updateEventType(assignment.eventTypeId, payload);
    if (updated) return { eventTypeId: assignment.eventTypeId, action: "updated" };
    // The EventType was deleted by the practitioner; recreate it below.
  }

  const created = await deps.createEventType(assignment.practitionerUserId, payload);
  await deps.linkAssignment(assignment.id, created.id);
  return { eventTypeId: created.id, action: "created" };
}
