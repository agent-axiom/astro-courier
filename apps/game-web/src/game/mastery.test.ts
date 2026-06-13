import { describe, expect, it } from "vitest";
import { buildPreflightMasteryTargets } from "./mastery";

describe("preflight mastery targets", () => {
  it("summarizes gold time and comet mastery conditions", () => {
    expect(buildPreflightMasteryTargets({ goldSeconds: 35 })).toEqual([
      { label: "Gold", value: "35s" },
      { label: "Comet", value: "Perfect + reserve" }
    ]);
  });

  it("rounds fractional gold windows for compact preflight display", () => {
    expect(buildPreflightMasteryTargets({ goldSeconds: 24.6 })[0]).toEqual({
      label: "Gold",
      value: "25s"
    });
  });
});
