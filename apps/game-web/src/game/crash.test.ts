import { describe, expect, it } from "vitest";
import { buildCrashDebrief, buildCrashReasonLabel } from "./crash";

describe("crash reason labels", () => {
  it("keeps hard landing advice direct", () => {
    expect(buildCrashReasonLabel({ crashReason: "Hard Landing" })).toBe("Landed too fast");
  });

  it("points asteroid sprint hull collisions at asteroid clearance", () => {
    expect(buildCrashReasonLabel({ contractId: "asteroid-sprint", crashReason: "Hull Collision" })).toBe("Clipped asteroid field");
  });

  it("points chain relay hull collisions at relay clearance", () => {
    expect(buildCrashReasonLabel({ contractId: "chain-relay", crashReason: "Hull Collision" })).toBe("Clipped relay lane");
  });

  it("points return-leg hull collisions at the reverse approach arc", () => {
    expect(buildCrashReasonLabel({ contractId: "return-leg", crashReason: "Hull Collision" })).toBe("Clipped return arc");
  });

  it("points gravity route hull collisions at gravity wells", () => {
    expect(buildCrashReasonLabel({ contractId: "gravity-slingshot", crashReason: "Hull Collision" })).toBe("Clipped gravity well");
  });

  it("falls back to landing rating before the insurance event label", () => {
    expect(buildCrashReasonLabel({ landingRating: "Rough dock" })).toBe("Rough dock");
    expect(buildCrashReasonLabel({})).toBe("Insurance Event");
  });
});

describe("crash debrief badge", () => {
  it("turns hard landings into a docking recovery badge", () => {
    expect(buildCrashDebrief({ crashReason: "Hard Landing" })).toEqual({
      label: "Cause",
      value: "Too fast",
      tone: "dock"
    });
  });

  it("turns route hull collisions into lane-specific debrief badges", () => {
    expect(buildCrashDebrief({ contractId: "chain-relay", crashReason: "Hull Collision" })).toEqual({
      label: "Cause",
      value: "Relay lane",
      tone: "impact"
    });
    expect(buildCrashDebrief({ contractId: "asteroid-sprint", crashReason: "Hull Collision" })).toEqual({
      label: "Cause",
      value: "Asteroid field",
      tone: "impact"
    });
  });

  it("falls back to an insurance review debrief", () => {
    expect(buildCrashDebrief({})).toEqual({
      label: "Cause",
      value: "Review",
      tone: "review"
    });
  });
});
