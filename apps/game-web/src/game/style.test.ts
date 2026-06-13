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
      fresh: false,
      chainProgress: 0
    });
  });

  it("highlights a fresh style milestone as a short chain moment", () => {
    expect(buildLiveStyleReward({ styleBonus: 320, lastMilestone: "Clean Hazard Skim", styleMultiplier: 1.25, styleChainSecondsRemaining: 3.8 })).toEqual({
      label: "Style chain",
      value: "+320 / x1.25 / 3.8s",
      fresh: true,
      chainProgress: 0.95
    });
  });

  it("treats eco drift as a fresh style moment", () => {
    expect(buildLiveStyleReward({ styleBonus: 340, lastMilestone: "Eco Drift", styleMultiplier: 1.5, styleChainSecondsRemaining: 4 })).toEqual({
      label: "Style chain",
      value: "+340 / x1.50 / 4.0s",
      fresh: true,
      chainProgress: 1
    });
  });

  it("shows an active chain even between fresh milestones", () => {
    expect(buildLiveStyleReward({ styleBonus: 180, styleMultiplier: 1.25, styleChainSecondsRemaining: 2.4 })).toEqual({
      label: "Style chain",
      value: "+180 / x1.25 / 2.4s",
      fresh: false,
      chainProgress: 0.6
    });
  });
});
