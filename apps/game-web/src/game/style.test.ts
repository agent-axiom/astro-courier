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
      tone: "bank",
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
      tone: "fresh",
      chainProgress: 0.95
    });
  });

  it("treats eco drift as a fresh style moment", () => {
    expect(buildLiveStyleReward({ styleBonus: 340, lastStyleAward: 160, lastMilestone: "Eco Drift", styleMultiplier: 1.5, styleChainSecondsRemaining: 4 })).toEqual({
      label: "Style hit",
      value: "+160 hit / +340 bank / x1.50",
      fresh: true,
      tone: "fresh",
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
      tone: "fresh",
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
      tone: "fresh",
      chainProgress: 1
    });
  });

  it("treats gravity sling as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 240,
        lastStyleAward: 240,
        lastMilestone: "Gravity Sling",
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+240 hit / +240 bank / x1.25",
      fresh: true,
      tone: "fresh",
      chainProgress: 1
    });
  });

  it("treats launch burst as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 330,
        lastStyleAward: 150,
        lastMilestone: "Launch Burst",
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+150 hit / +330 bank / x1.50",
      fresh: true,
      tone: "fresh",
      chainProgress: 1
    });
  });

  it("treats express finish as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 405,
        lastStyleAward: 225,
        lastMilestone: "Express Finish",
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+225 hit / +405 bank / x1.50",
      fresh: true,
      tone: "fresh",
      chainProgress: 1
    });
  });

  it("treats damage control as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 315,
        lastStyleAward: 175,
        lastMilestone: "Damage Control",
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+175 hit / +315 bank / x1.25",
      fresh: true,
      tone: "fresh",
      chainProgress: 1
    });
  });

  it("treats last drop as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 170,
        lastStyleAward: 170,
        lastMilestone: "Last Drop",
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+170 hit / +170 bank / x1.25",
      fresh: true,
      tone: "fresh",
      chainProgress: 1
    });
  });

  it("shows an active chain even between fresh milestones", () => {
    expect(buildLiveStyleReward({ styleBonus: 180, styleMultiplier: 1.25, styleChainSecondsRemaining: 2.4 })).toEqual({
      label: "Style chain",
      value: "+180 / x1.25 / 2.4s",
      fresh: false,
      tone: "chain",
      chainProgress: 0.6
    });
  });

  it("warns when an active style chain is about to expire", () => {
    expect(buildLiveStyleReward({ styleBonus: 440, styleMultiplier: 1.5, styleChainSecondsRemaining: 0.8 })).toEqual({
      label: "Style chain",
      value: "Save chain / x1.50 / 0.8s",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.2
    });
  });

  it("points urgent chains at an immediate clean hazard skim", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 440,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        hazardDangerLevel: "near",
        cargoDamage: 0
      })
    ).toEqual({
      label: "Style chain",
      value: "Skim now / x1.50 / 0.8s",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.2
    });
  });

  it("points urgent chains at a ready gravity sling before a hazard skim", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 440,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        hazardDangerLevel: "near",
        cargoDamage: 0,
        gravitySlingReady: true
      })
    ).toEqual({
      label: "Style chain",
      value: "Sling now / x1.50 / 0.8s",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.2
    });
  });

  it("points urgent chains at the remaining quick pickup window", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 180,
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 0.7,
        quickPickupSecondsRemaining: 4.2
      })
    ).toEqual({
      label: "Style chain",
      value: "Pickup now / x1.25 / 0.7s",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.18
    });
  });
});
