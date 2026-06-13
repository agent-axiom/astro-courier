import { describe, expect, it } from "vitest";
import { buildLiveStyleReward } from "./style";

describe("live style reward HUD copy", () => {
  it("stays hidden before the player earns style", () => {
    expect(buildLiveStyleReward({ styleBonus: 0 })).toBeUndefined();
  });

  it("summarizes banked style bonus after a reward has landed", () => {
    expect(buildLiveStyleReward({ styleBonus: 180 })).toEqual({
      label: "Style bank",
      value: "+180",
      fresh: false
    });
  });

  it("highlights a fresh style milestone as a short chain moment", () => {
    expect(buildLiveStyleReward({ styleBonus: 320, lastMilestone: "Clean Hazard Skim" })).toEqual({
      label: "Style chain",
      value: "+320",
      fresh: true
    });
  });
});
