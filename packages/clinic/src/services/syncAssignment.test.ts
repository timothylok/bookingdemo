import { describe, expect, it, vi } from "vitest";

import type { AssignmentRecord, SyncDeps } from "./syncAssignment";
import { syncAssignment } from "./syncAssignment";

function makeAssignment(overrides: Partial<AssignmentRecord> = {}): AssignmentRecord {
  return {
    id: 7,
    practitionerUserId: 3,
    eventTypeId: null,
    service: {
      name: "Follow-up",
      durationMin: 30,
      description: null,
      color: null,
      deliveryType: "clinic",
      active: true,
    },
    location: { name: "CBD", address: "1 Queen St", phone: null, kind: "clinic", active: true },
    ...overrides,
  };
}

function makeDeps(assignment: AssignmentRecord | null, updateResult = true): SyncDeps {
  return {
    findAssignment: vi.fn().mockResolvedValue(assignment),
    createEventType: vi.fn().mockResolvedValue({ id: 99 }),
    updateEventType: vi.fn().mockResolvedValue(updateResult),
    linkAssignment: vi.fn().mockResolvedValue(undefined),
  };
}

describe("syncAssignment", () => {
  it("creates and links an EventType for a new assignment", async () => {
    const deps = makeDeps(makeAssignment());
    const result = await syncAssignment(7, deps);

    expect(result).toEqual({ eventTypeId: 99, action: "created" });
    expect(deps.createEventType).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ title: "Follow-up - CBD", length: 30, hidden: false })
    );
    expect(deps.linkAssignment).toHaveBeenCalledWith(7, 99);
  });

  it("updates the existing EventType instead of creating another", async () => {
    const deps = makeDeps(makeAssignment({ eventTypeId: 55 }));
    const result = await syncAssignment(7, deps);

    expect(result).toEqual({ eventTypeId: 55, action: "updated" });
    expect(deps.createEventType).not.toHaveBeenCalled();
    expect(deps.linkAssignment).not.toHaveBeenCalled();
  });

  it("recreates the EventType when the linked one no longer exists", async () => {
    const deps = makeDeps(makeAssignment({ eventTypeId: 55 }), false);
    const result = await syncAssignment(7, deps);

    expect(result).toEqual({ eventTypeId: 99, action: "created" });
    expect(deps.linkAssignment).toHaveBeenCalledWith(7, 99);
  });

  it("hides the EventType when the service is inactive", async () => {
    const base = makeAssignment({ eventTypeId: 55 });
    const deps = makeDeps({ ...base, service: { ...base.service, active: false } });
    await syncAssignment(7, deps);

    expect(deps.updateEventType).toHaveBeenCalledWith(55, expect.objectContaining({ hidden: true }));
  });

  it("hides the EventType when the location is inactive", async () => {
    const base = makeAssignment({ eventTypeId: 55 });
    const deps = makeDeps({ ...base, location: base.location && { ...base.location, active: false } });
    await syncAssignment(7, deps);

    expect(deps.updateEventType).toHaveBeenCalledWith(55, expect.objectContaining({ hidden: true }));
  });

  it("throws a descriptive error for an unknown assignment", async () => {
    await expect(syncAssignment(404, makeDeps(null))).rejects.toThrow("assignment 404 not found");
  });
});
