import { describe, expect, it } from "vitest";
import { HAZARD_THREAD_SPEED_THRESHOLD } from "@astro-courier/simulation";
import { appendRunFeedUpdates, deriveRunFeedUpdates, type RunFeedSnapshot } from "./runFeed";

const baseSnapshot: RunFeedSnapshot = {
  status: "flying",
  lastMilestone: undefined,
  lastStyleAward: undefined,
  fuel: 100,
  maxFuel: 100,
  hazardDangerLevel: undefined,
  trajectoryRiskLevel: undefined,
  trajectoryRiskSeconds: undefined
};

describe("run action feed", () => {
  it("keeps initial snapshots quiet", () => {
    expect(deriveRunFeedUpdates(undefined, baseSnapshot)).toEqual([]);
  });

  it("derives expressive updates from fresh run events", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, lastMilestone: "Gravity Sling", lastStyleAward: 240 })).toEqual([
      {
        label: "Gravity Sling",
        value: "+240 style",
        tone: "style"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, lastMilestone: "Comet Finish", lastStyleAward: 320 })).toEqual([
      {
        label: "Comet Finish",
        value: "+320 style",
        tone: "style"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, lastMilestone: "No Brake Finesse", lastStyleAward: 150 })).toEqual([
      {
        label: "No Brake Finesse",
        value: "+150 style",
        tone: "style"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, fuel: 14 })).toEqual([
      {
        label: "Fuel critical",
        value: "Coast and commit",
        tone: "warning"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, hazardDangerLevel: "inside" })).toEqual([
      {
        label: "Hazard contact",
        value: "Break field",
        tone: "danger"
      }
    ]);
  });

  it("derives terminal updates once status changes", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, status: "delivered" })).toEqual([
      {
        label: "Delivery logged",
        value: "Route complete",
        tone: "success"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, status: "crashed" })).toEqual([
      {
        label: "Insurance event",
        value: "Review approach",
        tone: "danger"
      }
    ]);
  });

  it("announces cargo pickup when the run transitions to delivery", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, objectivePhase: "pickup" },
        { ...baseSnapshot, objectivePhase: "delivery" }
      )
    ).toEqual([
      {
        label: "Cargo loaded",
        value: "Dock outbound",
        tone: "success"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, objectivePhase: "delivery" },
        { ...baseSnapshot, objectivePhase: "delivery" }
      )
    ).toEqual([]);
  });

  it("derives medal-aware terminal updates for strong deliveries", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, status: "delivered", medal: "comet" })).toEqual([
      {
        label: "Comet secured",
        value: "Route mastered",
        tone: "success"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, status: "delivered", medal: "gold" })).toEqual([
      {
        label: "Gold logged",
        value: "Medal pace locked",
        tone: "success"
      }
    ]);
  });

  it("warns when the projected trajectory enters hazard space", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, trajectoryRiskLevel: "inside", trajectoryRiskSeconds: 1.8 })).toEqual([
      {
        label: "Collision forecast",
        value: "Evade in 1.8s",
        tone: "danger"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, trajectoryRiskLevel: "inside", trajectoryRiskSeconds: 1.8 },
        { ...baseSnapshot, trajectoryRiskLevel: "inside", trajectoryRiskSeconds: 1.2 }
      )
    ).toEqual([]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, trajectoryRiskLevel: "near", trajectoryRiskSeconds: 2.4 })).toEqual([
      {
        label: "Hazard vector",
        value: "Thread in 2.4s",
        tone: "warning"
      }
    ]);
    expect(
      deriveRunFeedUpdates(baseSnapshot, {
        ...baseSnapshot,
        speed: HAZARD_THREAD_SPEED_THRESHOLD,
        trajectoryRiskLevel: "near",
        trajectoryRiskSeconds: 2.4
      })
    ).toEqual([
      {
        label: "Thread window",
        value: "Needle gap in 2.4s",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates({ ...baseSnapshot, cargoDamage: 0.18 }, {
        ...baseSnapshot,
        trajectoryRiskLevel: "near",
        trajectoryRiskSeconds: 2.4,
        cargoDamage: 0.18
      })
    ).toEqual([
      {
        label: "Damaged vector",
        value: "Clear in 2.4s",
        tone: "warning"
      }
    ]);
  });

  it("announces when the projected trajectory clears hazard space", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, trajectoryRiskLevel: "inside", trajectoryRiskSeconds: 1.2 },
        { ...baseSnapshot, trajectoryRiskLevel: undefined, trajectoryRiskSeconds: undefined }
      )
    ).toEqual([
      {
        label: "Vector clear",
        value: "Line recovered",
        tone: "success"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, trajectoryRiskLevel: "near", trajectoryRiskSeconds: 1.8 },
        { ...baseSnapshot, trajectoryRiskLevel: undefined, trajectoryRiskSeconds: undefined }
      )
    ).toEqual([
      {
        label: "Vector clear",
        value: "Line recovered",
        tone: "success"
      }
    ]);
  });

  it("announces when a launch burst window opens after pickup", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, launchBurstSecondsRemaining: 2.4 })).toEqual([
      {
        label: "Burst armed",
        value: "Boost in 2.4s",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, launchBurstSecondsRemaining: 2.4 },
        { ...baseSnapshot, launchBurstSecondsRemaining: 1.8 }
      )
    ).toEqual([]);
  });

  it("announces launch bursts as chain opportunities while a multiplier is live", () => {
    expect(
      deriveRunFeedUpdates(baseSnapshot, {
        ...baseSnapshot,
        launchBurstSecondsRemaining: 2.4,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 3.2
      })
    ).toEqual([
      {
        label: "Burst armed",
        value: "Boost in 2.4s / chain x1.50",
        tone: "style"
      }
    ]);
  });

  it("announces when a style multiplier becomes live", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, styleMultiplier: 1, styleChainSecondsRemaining: 0 },
        { ...baseSnapshot, styleMultiplier: 1.25, styleChainSecondsRemaining: 5.5 }
      )
    ).toEqual([
      {
        label: "Chain live",
        value: "x1.25 / 5.5s",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 3.2 },
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 2.8 }
      )
    ).toEqual([]);
  });

  it("announces when an active style chain reaches the critical window", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 1.4 },
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 0.8 }
      )
    ).toEqual([
      {
        label: "Chain fading",
        value: "Save in 0.8s",
        tone: "warning"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 0.8 },
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 0.5 }
      )
    ).toEqual([]);
  });

  it("points critical clean no-brake delivery chains at a finesse dock", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, objectivePhase: "delivery", styleMultiplier: 1.5, styleChainSecondsRemaining: 1.4 },
        {
          ...baseSnapshot,
          objectivePhase: "delivery",
          landingStatus: "ready",
          cargoDamage: 0,
          manualBrakeUsed: false,
          styleMultiplier: 1.5,
          styleChainSecondsRemaining: 0.8
        }
      )
    ).toEqual([
      {
        label: "Finesse dock",
        value: "+150 / chain x1.50 / 0.8s",
        tone: "style"
      }
    ]);
  });

  it("announces when a last-drop dock window becomes armed", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, objectivePhase: "delivery", landingStatus: "misaligned", fuel: 4, maxFuel: 100, cargoDamage: 0 },
        { ...baseSnapshot, objectivePhase: "delivery", landingStatus: "ready", fuel: 4, maxFuel: 100, cargoDamage: 0 }
      )
    ).toEqual([
      {
        label: "Last drop armed",
        value: "+170 / dock empty",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, objectivePhase: "delivery", landingStatus: "ready", fuel: 4, maxFuel: 100, cargoDamage: 0 },
        { ...baseSnapshot, objectivePhase: "delivery", landingStatus: "ready", fuel: 4, maxFuel: 100, cargoDamage: 0 }
      )
    ).toEqual([]);
  });

  it("announces multiplied last-drop dock windows during active style chains", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, objectivePhase: "delivery", landingStatus: "misaligned", fuel: 4, maxFuel: 100, cargoDamage: 0 },
        {
          ...baseSnapshot,
          objectivePhase: "delivery",
          landingStatus: "ready",
          fuel: 4,
          maxFuel: 100,
          cargoDamage: 0,
          styleMultiplier: 1.5,
          styleChainSecondsRemaining: 2.4
        }
      )
    ).toEqual([
      {
        label: "Last drop armed",
        value: "+255 / chain x1.50",
        tone: "style"
      }
    ]);
  });

  it("announces when a critical style chain is saved back into a live window", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 0.7 },
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 4.2 }
      )
    ).toEqual([
      {
        label: "Chain saved",
        value: "x1.50 / 4.2s",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 2.8 },
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 4.2 }
      )
    ).toEqual([]);
  });

  it("announces when the live run loses the gold medal window", () => {
    expect(deriveRunFeedUpdates({ ...baseSnapshot, paceTier: "gold" }, { ...baseSnapshot, paceTier: "silver" })).toEqual([
      {
        label: "Gold missed",
        value: "Silver window live",
        tone: "warning"
      }
    ]);
    expect(deriveRunFeedUpdates({ ...baseSnapshot, paceTier: "silver" }, { ...baseSnapshot, paceTier: "silver" })).toEqual([]);
  });

  it("announces when the live run first overtakes the saved personal best score", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 3280, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3440, bestRunScore: 3290 }
      )
    ).toEqual([
      {
        label: "PB lead",
        value: "+150 score",
        tone: "success"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 3440, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3510, bestRunScore: 3290 }
      )
    ).toEqual([]);
  });

  it("announces ghost overtakes when a saved replay trail is loaded", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 3280, bestRunScore: 3290, bestRunHasGhostTrail: true },
        { ...baseSnapshot, score: 3440, bestRunScore: 3290, bestRunHasGhostTrail: true }
      )
    ).toEqual([
      {
        label: "Ghost pass",
        value: "+150 over ghost",
        tone: "success"
      }
    ]);
  });

  it("announces when the live run enters personal-best chase range", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 2980, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3105, bestRunScore: 3290 }
      )
    ).toEqual([
      {
        label: "PB pressure",
        value: "185 score back",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 3105, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3180, bestRunScore: 3290 }
      )
    ).toEqual([]);
  });

  it("announces ghost pressure when a saved replay trail is loaded", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 2980, bestRunScore: 3290, bestRunHasGhostTrail: true },
        { ...baseSnapshot, score: 3105, bestRunScore: 3290, bestRunHasGhostTrail: true }
      )
    ).toEqual([
      {
        label: "Ghost pressure",
        value: "185 behind ghost",
        tone: "style"
      }
    ]);
  });

  it("announces when the final comet dock becomes armed", () => {
    const cometDockSnapshot = {
      ...baseSnapshot,
      objectivePhase: "delivery" as const,
      paceTier: "gold" as const,
      fuel: 84,
      maxFuel: 100,
      cargoDamage: 0
    };
    expect(
      deriveRunFeedUpdates(
        { ...cometDockSnapshot, perfectDockReady: false },
        { ...cometDockSnapshot, perfectDockReady: true }
      )
    ).toEqual([
      {
        label: "Comet armed",
        value: "Perfect dock lined",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...cometDockSnapshot, perfectDockReady: true },
        { ...cometDockSnapshot, perfectDockReady: true }
      )
    ).toEqual([]);
    expect(
      deriveRunFeedUpdates(
        { ...cometDockSnapshot, perfectDockReady: false },
        { ...cometDockSnapshot, objectivePhase: "pickup", perfectDockReady: true }
      )
    ).toEqual([]);
  });

  it("announces tight comet reserve with the remaining burn buffer", () => {
    const cometReserveSnapshot = {
      ...baseSnapshot,
      paceTier: "gold" as const,
      fuel: 90,
      maxFuel: 100,
      cargoDamage: 0
    };

    expect(deriveRunFeedUpdates(cometReserveSnapshot, { ...cometReserveSnapshot, fuel: 78 })).toEqual([
      {
        label: "Comet reserve",
        value: "3% burn buffer",
        tone: "warning"
      }
    ]);
    expect(deriveRunFeedUpdates({ ...cometReserveSnapshot, fuel: 78 }, { ...cometReserveSnapshot, fuel: 77 })).toEqual([]);
    expect(deriveRunFeedUpdates(cometReserveSnapshot, { ...cometReserveSnapshot, fuel: 74 })).toEqual([
      {
        label: "Comet reserve lost",
        value: "+1% fuel short",
        tone: "danger"
      }
    ]);
    expect(deriveRunFeedUpdates(cometReserveSnapshot, { ...cometReserveSnapshot, paceTier: "silver", fuel: 78 })).toEqual([
      {
        label: "Gold missed",
        value: "Silver window live",
        tone: "warning"
      }
    ]);
    expect(deriveRunFeedUpdates(cometReserveSnapshot, { ...cometReserveSnapshot, cargoDamage: 0.05, fuel: 78 })).toEqual([
      {
        label: "Cargo exposed",
        value: "Protect the load",
        tone: "warning"
      }
    ]);
  });

  it("announces when comet reserve is lost with the fuel shortfall", () => {
    const cometReserveSnapshot = {
      ...baseSnapshot,
      paceTier: "gold" as const,
      fuel: 76,
      maxFuel: 100,
      cargoDamage: 0
    };

    expect(deriveRunFeedUpdates(cometReserveSnapshot, { ...cometReserveSnapshot, fuel: 74 })).toEqual([
      {
        label: "Comet reserve lost",
        value: "+1% fuel short",
        tone: "danger"
      }
    ]);
    expect(deriveRunFeedUpdates({ ...cometReserveSnapshot, fuel: 74 }, { ...cometReserveSnapshot, fuel: 73 })).toEqual([]);
  });

  it("announces when a perfect approach setup becomes ready outside comet conditions", () => {
    const setupSnapshot = {
      ...baseSnapshot,
      objectivePhase: "delivery" as const,
      landingStatus: "ready" as const,
      cargoDamage: 0
    };
    expect(
      deriveRunFeedUpdates(
        { ...setupSnapshot, approachStreakSeconds: 0.8 },
        { ...setupSnapshot, approachStreakSeconds: 1.2 }
      )
    ).toEqual([
      {
        label: "Perfect setup",
        value: "Soft dock +220",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...setupSnapshot, approachStreakSeconds: 1.2 },
        { ...setupSnapshot, approachStreakSeconds: 1.5 }
      )
    ).toEqual([]);
  });

  it("announces when the active target enters close-range lineup distance", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, objectivePhase: "pickup", targetDistance: 112 } as RunFeedSnapshot,
        { ...baseSnapshot, objectivePhase: "pickup", targetDistance: 74 } as RunFeedSnapshot
      )
    ).toEqual([
      {
        label: "Pickup lined",
        value: "Pad 74m",
        tone: "success"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, objectivePhase: "delivery", targetDistance: 122 } as RunFeedSnapshot,
        { ...baseSnapshot, objectivePhase: "delivery", targetDistance: 86 } as RunFeedSnapshot
      )
    ).toEqual([
      {
        label: "Dock lined",
        value: "Dock 86m",
        tone: "success"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, objectivePhase: "delivery", targetDistance: 86 } as RunFeedSnapshot,
        { ...baseSnapshot, objectivePhase: "delivery", targetDistance: 42 } as RunFeedSnapshot
      )
    ).toEqual([]);
  });

  it("announces when the player spends the no-brake finesse line", () => {
    const cleanDeliverySnapshot = {
      ...baseSnapshot,
      objectivePhase: "delivery" as const,
      cargoDamage: 0
    };
    expect(
      deriveRunFeedUpdates(
        { ...cleanDeliverySnapshot, manualBrakeUsed: false },
        { ...cleanDeliverySnapshot, manualBrakeUsed: true }
      )
    ).toEqual([
      {
        label: "Finesse spent",
        value: "Manual brake used",
        tone: "warning"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...cleanDeliverySnapshot, manualBrakeUsed: true },
        { ...cleanDeliverySnapshot, manualBrakeUsed: true }
      )
    ).toEqual([]);
  });

  it("warns when clean cargo first takes damage", () => {
    expect(deriveRunFeedUpdates({ ...baseSnapshot, cargoDamage: 0.01 }, { ...baseSnapshot, cargoDamage: 0.05 })).toEqual([
      {
        label: "Cargo exposed",
        value: "Protect the load",
        tone: "warning"
      }
    ]);
    expect(deriveRunFeedUpdates({ ...baseSnapshot, cargoDamage: 0.05 }, { ...baseSnapshot, cargoDamage: 0.12 })).toEqual([]);
  });

  it("logs first minor cargo stress before cargo is exposed", () => {
    expect(deriveRunFeedUpdates({ ...baseSnapshot, cargoDamage: 0 }, { ...baseSnapshot, cargoDamage: 0.012 })).toEqual([
      {
        label: "Cargo stress",
        value: "Smooth inputs",
        tone: "warning"
      }
    ]);
    expect(deriveRunFeedUpdates({ ...baseSnapshot, cargoDamage: 0.012 }, { ...baseSnapshot, cargoDamage: 0.018 })).toEqual([]);
    expect(deriveRunFeedUpdates({ ...baseSnapshot, cargoDamage: 0 }, { ...baseSnapshot, cargoDamage: 0.05 })).toEqual([
      {
        label: "Cargo exposed",
        value: "Protect the load",
        tone: "warning"
      }
    ]);
  });

  it("prepends fresh updates and caps the feed", () => {
    const result = appendRunFeedUpdates(
      [
        { id: 1, label: "Old one", value: "A", tone: "neutral" },
        { id: 2, label: "Old two", value: "B", tone: "style" }
      ],
      [
        { label: "Fuel critical", value: "Coast and commit", tone: "warning" },
        { label: "Hazard contact", value: "Break field", tone: "danger" }
      ],
      3,
      3
    );

    expect(result).toEqual({
      entries: [
        { id: 4, label: "Hazard contact", value: "Break field", tone: "danger" },
        { id: 3, label: "Fuel critical", value: "Coast and commit", tone: "warning" },
        { id: 1, label: "Old one", value: "A", tone: "neutral" }
      ],
      nextId: 5
    });
  });
});
