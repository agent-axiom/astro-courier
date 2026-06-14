import { describe, expect, it } from "vitest";
import { buildLiveStyleReward, buildStyleTargetCue } from "./style";

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

  it("treats assist and boost burns as fresh style moments", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 190,
        lastStyleAward: 70,
        lastMilestone: "Assist Burn",
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+70 hit / +190 bank / x1.25",
      fresh: true,
      tone: "fresh",
      chainProgress: 1
    });

    expect(
      buildLiveStyleReward({
        styleBonus: 210,
        lastStyleAward: 90,
        lastMilestone: "Boost Burn",
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+90 hit / +210 bank / x1.50",
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

  it("treats comet finish as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 320,
        lastStyleAward: 320,
        lastMilestone: "Comet Finish",
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+320 hit / +320 bank / x1.25",
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

  it("treats no-brake finesse as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 150,
        lastStyleAward: 150,
        lastMilestone: "No Brake Finesse",
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+150 hit / +150 bank / x1.25",
      fresh: true,
      tone: "fresh",
      chainProgress: 1
    });
  });

  it("treats antimatter drift as a fresh style moment", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 210,
        lastStyleAward: 210,
        lastMilestone: "Antimatter Drift",
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 4
      })
    ).toEqual({
      label: "Style hit",
      value: "+210 hit / +210 bank / x1.25",
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

  it("surfaces the active style chain count as a compact badge", () => {
    expect(buildLiveStyleReward({ styleBonus: 440, styleMultiplier: 1.5, styleChainSecondsRemaining: 2.4, styleChainCount: 2 })).toEqual({
      label: "Style chain",
      value: "+440 / x1.50 / 2.4s",
      badge: "2 chain",
      fresh: false,
      tone: "chain",
      chainProgress: 0.6
    });
  });

  it("uses the longer chain relay timing for style chain progress", () => {
    expect(
      buildLiveStyleReward({
        contractId: "chain-relay",
        styleBonus: 180,
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 2.75
      })
    ).toEqual({
      label: "Style chain",
      value: "+180 / x1.25 / 2.8s",
      fresh: false,
      tone: "chain",
      chainProgress: 0.5
    });
  });

  it("warns when an active style chain is about to expire", () => {
    expect(buildLiveStyleReward({ styleBonus: 440, styleMultiplier: 1.5, styleChainSecondsRemaining: 0.8 })).toEqual({
      label: "Style chain",
      value: "Save chain / x1.50 / 0.8s",
      action: "Save chain",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.2
    });
  });

  it("keeps the chain count badge visible while urgent action copy takes over", () => {
    expect(buildLiveStyleReward({ styleBonus: 620, styleMultiplier: 2, styleChainSecondsRemaining: 0.8, styleChainCount: 4 })).toEqual({
      label: "Style chain",
      value: "Save chain / x2.00 / 0.8s",
      action: "Save chain",
      badge: "4 chain",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.2
    });
  });

  it("points chain relay urgent chains at docking the chain", () => {
    expect(
      buildLiveStyleReward({
        contractId: "chain-relay",
        styleBonus: 440,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8
      })
    ).toEqual({
      label: "Style chain",
      value: "Dock chain / x1.50 / 0.8s",
      action: "Dock chain",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.15
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
      action: "Skim now",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.2
    });
  });

  it("points urgent chains at predicted clean hazard thread lines", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 440,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        trajectoryRiskLevel: "near",
        cargoDamage: 0
      })
    ).toEqual({
      label: "Style chain",
      value: "Thread now / x1.50 / 0.8s",
      action: "Thread now",
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
      action: "Sling now",
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
      action: "Pickup now",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.18
    });
  });

  it("points urgent chains at an armed launch burst before generic save copy", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 330,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        launchBurstSecondsRemaining: 2.4
      })
    ).toEqual({
      label: "Style chain",
      value: "Boost now / x1.50 / 0.8s",
      action: "Boost now",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.2
    });
  });

  it("points urgent clean delivery chains at a no-brake finesse dock", () => {
    expect(
      buildLiveStyleReward({
        styleBonus: 440,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        objectivePhase: "delivery",
        manualBrakeUsed: false,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Style chain",
      value: "Finesse dock / x1.50 / 0.8s",
      action: "Finesse dock",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.2
    });
  });

  it("points urgent antimatter drift chains at the route-specific dock", () => {
    expect(
      buildLiveStyleReward({
        contractId: "antimatter-drift",
        styleBonus: 440,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        objectivePhase: "delivery",
        manualBrakeUsed: false,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Style chain",
      value: "Drift dock / x1.50 / 0.8s",
      action: "Drift dock",
      fresh: false,
      tone: "urgent",
      chainProgress: 0.2
    });
  });
});

describe("style target cue", () => {
  it("stays hidden outside active flight or when no immediate style target is available", () => {
    expect(buildStyleTargetCue({ status: "paused", styleBonus: 0 })).toBeUndefined();
    expect(buildStyleTargetCue({ status: "flying", styleBonus: 0 })).toBeUndefined();
  });

  it("teaches the opening quick pickup style target before the player has banked style", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "pickup",
        styleBonus: 0,
        quickPickupSecondsRemaining: 4.2,
        quickPickupBonus: 180
      })
    ).toEqual({
      label: "Style target",
      value: "Pickup rush / +180 / 4.2s",
      tone: "opportunity"
    });
  });

  it("frames quick pickup as a chain target while a multiplier is live", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "pickup",
        styleBonus: 180,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 2.4,
        quickPickupSecondsRemaining: 4.2,
        quickPickupBonus: 180
      })
    ).toEqual({
      label: "Style target",
      value: "Pickup rush / +180 / 4.2s / chain x1.50",
      tone: "chain"
    });
  });

  it("teaches the launch burst follow-up after a fast pickup", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 180,
        launchBurstSecondsRemaining: 2.4
      })
    ).toEqual({
      label: "Style target",
      value: "Boost burst / +120 / 2.4s",
      tone: "opportunity"
    });
  });

  it("frames launch bursts as chain targets while a multiplier is live", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 330,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        launchBurstSecondsRemaining: 2.4
      })
    ).toEqual({
      label: "Style target",
      value: "Boost burst / +120 / 2.4s / chain x1.50",
      tone: "chain"
    });
  });

  it("prioritizes a ready gravity sling over nearby hazard style", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        styleBonus: 180,
        styleMultiplier: 1.25,
        styleChainSecondsRemaining: 2.4,
        gravitySlingReady: true,
        gravitySlingStyleBonus: 240,
        hazardDangerLevel: "near",
        cargoDamage: 0
      })
    ).toEqual({
      label: "Style target",
      value: "Sling window / +240 / chain x1.25",
      tone: "chain"
    });
  });

  it("teaches perfect approach as a ready soft-dock style target", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 0,
        landingStatus: "ready",
        approachStreakSeconds: 1.2
      })
    ).toEqual({
      label: "Style target",
      value: "Perfect dock / +220",
      tone: "opportunity"
    });

    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 180,
        landingStatus: "ready",
        approachStreakSeconds: 1.2,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8
      })
    ).toEqual({
      label: "Style target",
      value: "Perfect dock / +220 / chain x1.50",
      tone: "chain"
    });
  });

  it("offers clean hazard skim style only while cargo is still clean", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        styleBonus: 180,
        hazardDangerLevel: "near",
        cargoDamage: 0.01
      })
    ).toEqual({
      label: "Style target",
      value: "Clean skim / danger style",
      tone: "risk"
    });
    expect(
      buildStyleTargetCue({
        status: "flying",
        styleBonus: 180,
        hazardDangerLevel: "near",
        cargoDamage: 0.12
      })
    ).toBeUndefined();
  });

  it("previews predicted clean hazard thread lines before entering the field", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        styleBonus: 180,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 2.4,
        trajectoryRiskLevel: "near",
        trajectoryRiskSeconds: 0.8,
        trajectoryRiskClearance: 4,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Style target",
      value: "Thread line / 0.8s / 4m clear / chain x1.50",
      tone: "chain"
    });
  });

  it("teaches no-brake finesse while clean delivery is still alive", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 0,
        cargoDamage: 0.01,
        manualBrakeUsed: false
      })
    ).toEqual({
      label: "Style target",
      value: "No brake line / +150 on clean dock",
      tone: "opportunity"
    });

    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 0,
        cargoDamage: 0,
        manualBrakeUsed: true
      })
    ).toBeUndefined();
  });

  it("frames no-brake finesse as a chain target while a multiplier is live", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 180,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        cargoDamage: 0,
        manualBrakeUsed: false
      })
    ).toEqual({
      label: "Style target",
      value: "No brake line / +150 on clean dock / chain x1.50",
      tone: "chain"
    });
  });

  it("previews the antimatter drift payoff instead of generic no-brake copy", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        contractId: "antimatter-drift",
        objectivePhase: "delivery",
        styleBonus: 0,
        cargoDamage: 0,
        manualBrakeUsed: false
      })
    ).toEqual({
      label: "Style target",
      value: "Antimatter drift / +210 on clean dock",
      tone: "opportunity"
    });

    expect(
      buildStyleTargetCue({
        status: "flying",
        contractId: "antimatter-drift",
        objectivePhase: "delivery",
        styleBonus: 180,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        cargoDamage: 0,
        manualBrakeUsed: false
      })
    ).toEqual({
      label: "Style target",
      value: "Antimatter drift / +210 on clean dock / chain x1.50",
      tone: "chain"
    });
  });

  it("surfaces last-drop docks as a clutch style target outside gold express pace", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 180,
        paceTier: "silver",
        fuel: 4,
        maxFuel: 100,
        cargoDamage: 0,
        landingStatus: "ready"
      })
    ).toEqual({
      label: "Style target",
      value: "Last drop / +170",
      tone: "clutch"
    });

    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 180,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        paceTier: "bronze",
        fuel: 4,
        maxFuel: 100,
        cargoDamage: 0,
        landingStatus: "ready"
      })
    ).toEqual({
      label: "Style target",
      value: "Last drop / +255 / chain x1.50",
      tone: "clutch"
    });

    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 180,
        paceTier: "gold",
        fuel: 4,
        maxFuel: 100,
        cargoDamage: 0,
        landingStatus: "ready"
      })
    ).toBeUndefined();
  });

  it("keeps immediate hazard skim cues above the no-brake delivery target", () => {
    expect(
      buildStyleTargetCue({
        status: "flying",
        objectivePhase: "delivery",
        styleBonus: 0,
        cargoDamage: 0,
        manualBrakeUsed: false,
        hazardDangerLevel: "near"
      })
    ).toEqual({
      label: "Style target",
      value: "Clean skim / danger style",
      tone: "risk"
    });
  });
});
