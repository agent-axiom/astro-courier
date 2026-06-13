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

  it("highlights a fresh style award separately from the banked chain total", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 320,
        lastStyleAward: 140,
        lastMilestone: "Clean Hazard Skim",
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 3.8
      })
    ).toEqual({
      label: "Style hit",
      value: "+140 hit / +320 bank / x1.25",
      fresh: true,
      chainProgress: 0.95
    });
  });

  it("treats eco drift as a fresh style moment", () => {
    expect(buildLiveStyleReward({ styleBonus: 340, lastStyleAward: 160, lastMilestone: "Eco Drift", styleMultiplier: 1.5, styleChainSecondsRemaining: 4 })).toEqual({
      label: "Style hit",
      value: "+160 hit / +340 bank / x1.50",
      fresh: true,
      chainProgress: 1
    });
  });

  it("treats chain finish as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 710,
        lastStyleAward: 390,
        lastMilestone: "Chain Finish",
        styleMultiplier: 1.75,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+390 hit / +710 bank / x1.75",
      fresh: true,
      chainProgress: 1
    });
  });

  it("treats needle thread as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 525,
        lastStyleAward: 525,
        lastMilestone: "Needle Thread",
        styleMultiplier: 1.75,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+525 hit / +525 bank / x1.75",
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
