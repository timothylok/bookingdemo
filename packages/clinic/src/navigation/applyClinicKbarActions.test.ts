import { describe, expect, it } from "vitest";

import { applyClinicKbarActions } from "./applyClinicKbarActions";

const actions = [{ id: "workflows" }, { id: "event-types" }, { id: "teams" }, { id: "password" }];

describe("applyClinicKbarActions", () => {
  it("keeps every action when clinic mode is off", () => {
    expect(applyClinicKbarActions(actions, false)).toEqual(actions);
  });

  it("drops workflows and teams in clinic mode", () => {
    expect(applyClinicKbarActions(actions, true).map((a) => a.id)).toEqual(["event-types", "password"]);
  });
});
