import { describe, expect, it } from "vitest";
import { buildCrashReasonLabel } from "./crash";

describe("crash reason labels", () => {
  it("keeps hard landing advice direct", () => {
    expect(buildCrashReasonLabel({ crashReason: "Hard Landing" })).toBe("Hard landing: slow and align before contact");
  });

  it("points asteroid sprint hull collisions at asteroid clearance", () => {
    expect(buildCrashReasonLabel({ contractId: "asteroid-sprint", crashReason: "Hull Collision" })).toBe(
      "Hull collision: widen asteroid clearance"
    );
  });

  it("points gravity route hull collisions at gravity wells", () => {
    expect(buildCrashReasonLabel({ contractId: "gravity-slingshot", crashReason: "Hull Collision" })).toBe(
      "Hull collision: stay outside gravity wells"
    );
  });

  it("falls back to landing rating before the insurance event label", () => {
    expect(buildCrashReasonLabel({ landingRating: "Rough dock" })).toBe("Rough dock");
    expect(buildCrashReasonLabel({})).toBe("Insurance Event");
  });
});
