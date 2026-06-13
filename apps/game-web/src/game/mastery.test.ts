import { describe, expect, it } from "vitest";
import { buildPreflightBonusObjectives, buildPreflightMasteryTargets } from "./mastery";

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

describe("preflight bonus objectives", () => {
  it("summarizes active style objectives before launch", () => {
    expect(buildPreflightBonusObjectives({ quickPickupBonus: 180 })).toEqual([
      { label: "Rush pickup", value: "+180" },
      { label: "Clean skim", value: "from +140" },
      { label: "Perfect dock", value: "+220" }
    ]);
  });
});
