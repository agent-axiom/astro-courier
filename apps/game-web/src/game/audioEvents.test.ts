import { describe, expect, it } from "vitest";
import { HAZARD_THREAD_SPEED_THRESHOLD } from "@astro-courier/simulation";
import { deriveHudAudioEvents, type HudAudioSnapshot } from "./audioEvents";

const baseSnapshot: HudAudioSnapshot = {
  status: "flying",
  lastMilestone: undefined,
  fuel: 100,
  maxFuel: 100,
  hazardDangerLevel: undefined,
  trajectoryRiskLevel: undefined
};

describe("HUD audio events", () => {
  it("emits terminal run events once when status changes", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, status: "delivered" })).toEqual(["delivery-complete"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, status: "crashed" })).toEqual(["ship-crash"]);
    expect(deriveHudAudioEvents({ ...baseSnapshot, status: "delivered" }, { ...baseSnapshot, status: "delivered" })).toEqual([]);
  });

  it("maps fresh milestones to expressive sound events", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Assist Burn" })).toEqual(["assist-burn"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Boost Burn" })).toEqual(["boost-burn"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Launch Burst" })).toEqual(["launch-burst"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Gravity Sling" })).toEqual(["style-hit"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Comet Finish" })).toEqual(["style-hit"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "No Brake Finesse" })).toEqual(["style-hit"]);
  });

  it("ignores service milestones that are not audio-worthy style hits", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Pickup Required" })).toEqual([]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Cargo Loaded" })).toEqual([]);
  });

  it("emits a pickup confirmation event when cargo becomes the delivery objective", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, objectivePhase: "pickup" },
        { ...baseSnapshot, objectivePhase: "delivery" }
      )
    ).toEqual(["cargo-loaded"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, objectivePhase: "delivery" },
        { ...baseSnapshot, objectivePhase: "delivery" }
      )
    ).toEqual([]);
  });

  it("signals when the active target enters close-range lineup distance", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, objectivePhase: "pickup", targetDistance: 112 },
        { ...baseSnapshot, objectivePhase: "pickup", targetDistance: 74 }
      )
    ).toEqual(["pickup-lineup"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, objectivePhase: "delivery", targetDistance: 122 },
        { ...baseSnapshot, objectivePhase: "delivery", targetDistance: 86 }
      )
    ).toEqual(["dock-lineup"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, objectivePhase: "delivery", targetDistance: 86 },
        { ...baseSnapshot, objectivePhase: "delivery", targetDistance: 42 }
      )
    ).toEqual([]);
  });

  it("warns when fuel crosses into the critical band", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, fuel: 14 })).toEqual(["fuel-critical"]);
    expect(deriveHudAudioEvents({ ...baseSnapshot, fuel: 14 }, { ...baseSnapshot, fuel: 13 })).toEqual([]);
  });

  it("warns when clean cargo first takes damage", () => {
    expect(deriveHudAudioEvents({ ...baseSnapshot, cargoDamage: 0.01 }, { ...baseSnapshot, cargoDamage: 0.05 })).toEqual([
      "cargo-damage"
    ]);
    expect(deriveHudAudioEvents({ ...baseSnapshot, cargoDamage: 0.05 }, { ...baseSnapshot, cargoDamage: 0.12 })).toEqual([]);
  });

  it("celebrates arming the final comet dock once while comet conditions are live", () => {
    const cometDockSnapshot = {
      ...baseSnapshot,
      objectivePhase: "delivery" as const,
      paceTier: "gold" as const,
      fuel: 84,
      maxFuel: 100,
      cargoDamage: 0
    };
    expect(
      deriveHudAudioEvents(
        { ...cometDockSnapshot, perfectDockReady: false },
        { ...cometDockSnapshot, perfectDockReady: true }
      )
    ).toEqual(["comet-armed"]);
    expect(
      deriveHudAudioEvents(
        { ...cometDockSnapshot, perfectDockReady: true },
        { ...cometDockSnapshot, perfectDockReady: true }
      )
    ).toEqual([]);
    expect(
      deriveHudAudioEvents(
        { ...cometDockSnapshot, perfectDockReady: false },
        { ...cometDockSnapshot, objectivePhase: "pickup", perfectDockReady: true }
      )
    ).toEqual([]);
    expect(
      deriveHudAudioEvents(
        { ...cometDockSnapshot, perfectDockReady: false },
        { ...cometDockSnapshot, cargoDamage: 0.05, perfectDockReady: true }
      )
    ).toEqual(["cargo-damage"]);
  });

  it("signals when a clean delivery approach arms the perfect dock window", () => {
    const approachSnapshot = {
      ...baseSnapshot,
      objectivePhase: "delivery" as const,
      landingStatus: "ready" as const,
      cargoDamage: 0,
      approachStreakSeconds: 0.8
    };

    expect(
      deriveHudAudioEvents(approachSnapshot, {
        ...approachSnapshot,
        approachStreakSeconds: 1.2
      })
    ).toEqual(["perfect-approach-ready"]);
    expect(
      deriveHudAudioEvents(
        { ...approachSnapshot, approachStreakSeconds: 1.2 },
        { ...approachSnapshot, approachStreakSeconds: 1.4 }
      )
    ).toEqual([]);
    expect(
      deriveHudAudioEvents(approachSnapshot, {
        ...approachSnapshot,
        cargoDamage: 0.05,
        approachStreakSeconds: 1.2
      })
    ).toEqual(["cargo-damage"]);
    expect(
      deriveHudAudioEvents(approachSnapshot, {
        ...approachSnapshot,
        objectivePhase: "pickup",
        approachStreakSeconds: 1.2
      })
    ).toEqual([]);
  });

  it("signals when a last-drop dock window becomes armed", () => {
    const lastDropSnapshot = {
      ...baseSnapshot,
      objectivePhase: "delivery" as const,
      landingStatus: "misaligned" as const,
      fuel: 4,
      maxFuel: 100,
      cargoDamage: 0
    };

    expect(
      deriveHudAudioEvents(lastDropSnapshot, {
        ...lastDropSnapshot,
        landingStatus: "ready"
      })
    ).toEqual(["last-drop-armed"]);
    expect(
      deriveHudAudioEvents(
        { ...lastDropSnapshot, landingStatus: "ready" },
        { ...lastDropSnapshot, landingStatus: "ready" }
      )
    ).toEqual([]);
  });

  it("prefers the comet-specific armed cue over the generic perfect approach cue", () => {
    const cometDockSnapshot = {
      ...baseSnapshot,
      objectivePhase: "delivery" as const,
      landingStatus: "ready" as const,
      paceTier: "gold" as const,
      fuel: 84,
      maxFuel: 100,
      cargoDamage: 0
    };

    expect(
      deriveHudAudioEvents(
        { ...cometDockSnapshot, perfectDockReady: false, approachStreakSeconds: 0.8 },
        { ...cometDockSnapshot, perfectDockReady: true, approachStreakSeconds: 1.2 }
      )
    ).toEqual(["comet-armed"]);
  });

  it("warns once when clean gold runs enter tight comet reserve", () => {
    const cometReserveSnapshot = {
      ...baseSnapshot,
      paceTier: "gold" as const,
      fuel: 90,
      maxFuel: 100,
      cargoDamage: 0
    };

    expect(deriveHudAudioEvents(cometReserveSnapshot, { ...cometReserveSnapshot, fuel: 79 })).toEqual(["comet-reserve-tight"]);
    expect(deriveHudAudioEvents({ ...cometReserveSnapshot, fuel: 79 }, { ...cometReserveSnapshot, fuel: 78 })).toEqual([]);
    expect(deriveHudAudioEvents(cometReserveSnapshot, { ...cometReserveSnapshot, fuel: 74 })).toEqual(["comet-reserve-lost"]);
    expect(deriveHudAudioEvents(cometReserveSnapshot, { ...cometReserveSnapshot, paceTier: "silver", fuel: 79 })).toEqual([
      "medal-drop"
    ]);
    expect(deriveHudAudioEvents(cometReserveSnapshot, { ...cometReserveSnapshot, cargoDamage: 0.05, fuel: 79 })).toEqual([
      "cargo-damage"
    ]);
  });

  it("warns once when clean gold runs lose comet reserve", () => {
    const cometReserveSnapshot = {
      ...baseSnapshot,
      paceTier: "gold" as const,
      fuel: 76,
      maxFuel: 100,
      cargoDamage: 0
    };

    expect(deriveHudAudioEvents(cometReserveSnapshot, { ...cometReserveSnapshot, fuel: 74 })).toEqual(["comet-reserve-lost"]);
    expect(deriveHudAudioEvents({ ...cometReserveSnapshot, fuel: 74 }, { ...cometReserveSnapshot, fuel: 73 })).toEqual([]);
  });

  it("warns once when the current medal window drops", () => {
    expect(deriveHudAudioEvents({ ...baseSnapshot, paceTier: "gold" }, { ...baseSnapshot, paceTier: "silver" })).toEqual(["medal-drop"]);
    expect(deriveHudAudioEvents({ ...baseSnapshot, paceTier: "silver" }, { ...baseSnapshot, paceTier: "silver" })).toEqual([]);
  });

  it("warns when the ship enters a hazard", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, hazardDangerLevel: "inside" })).toEqual(["hazard-contact"]);
    expect(deriveHudAudioEvents({ ...baseSnapshot, hazardDangerLevel: "inside" }, { ...baseSnapshot, hazardDangerLevel: "inside" })).toEqual([]);
  });

  it("warns once when the predicted trajectory turns dangerous", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, trajectoryRiskLevel: "inside" })).toEqual(["trajectory-warning"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, trajectoryRiskLevel: "inside" },
        { ...baseSnapshot, trajectoryRiskLevel: "inside" }
      )
    ).toEqual([]);
    expect(
      deriveHudAudioEvents({ ...baseSnapshot, trajectoryRiskLevel: "near" }, { ...baseSnapshot, trajectoryRiskLevel: "inside" })
    ).toEqual(["trajectory-warning"]);
  });

  it("signals a light caution when clean cargo enters a predicted hazard vector", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, trajectoryRiskLevel: "near" })).toEqual(["trajectory-caution"]);
    expect(
      deriveHudAudioEvents(baseSnapshot, {
        ...baseSnapshot,
        speed: HAZARD_THREAD_SPEED_THRESHOLD,
        trajectoryRiskLevel: "near"
      })
    ).toEqual(["thread-window"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, trajectoryRiskLevel: "near" },
        { ...baseSnapshot, trajectoryRiskLevel: "near" }
      )
    ).toEqual([]);
  });

  it("signals when the predicted trajectory clears a dangerous line", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, trajectoryRiskLevel: "inside" },
        { ...baseSnapshot, trajectoryRiskLevel: undefined }
      )
    ).toEqual(["trajectory-clear"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, trajectoryRiskLevel: "near" },
        { ...baseSnapshot, trajectoryRiskLevel: undefined }
      )
    ).toEqual(["trajectory-clear"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, trajectoryRiskLevel: "inside" },
        { ...baseSnapshot, status: "crashed", trajectoryRiskLevel: undefined }
      )
    ).toEqual(["ship-crash"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, trajectoryRiskLevel: undefined })).toEqual([]);
  });

  it("warns when damaged cargo enters a predicted hazard vector", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, cargoDamage: 0.18 },
        { ...baseSnapshot, cargoDamage: 0.18, trajectoryRiskLevel: "near" }
      )
    ).toEqual(["trajectory-warning"]);
  });

  it("celebrates the first live personal-best score lead", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, score: 3280, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3440, bestRunScore: 3290 }
      )
    ).toEqual(["pb-lead"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, score: 3440, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3510, bestRunScore: 3290 }
      )
    ).toEqual([]);
  });

  it("celebrates passing a saved personal-best ghost trail distinctly", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, score: 3280, bestRunScore: 3290, bestRunHasGhostTrail: true },
        { ...baseSnapshot, score: 3440, bestRunScore: 3290, bestRunHasGhostTrail: true }
      )
    ).toEqual(["ghost-pass"]);
  });

  it("signals when the live run enters personal-best chase pressure", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, score: 2980, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3105, bestRunScore: 3290 }
      )
    ).toEqual(["pb-pressure"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, score: 3105, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3180, bestRunScore: 3290 }
      )
    ).toEqual([]);
  });

  it("signals ghost pressure distinctly when a replay trail is loaded", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, score: 2980, bestRunScore: 3290, bestRunHasGhostTrail: true },
        { ...baseSnapshot, score: 3105, bestRunScore: 3290, bestRunHasGhostTrail: true }
      )
    ).toEqual(["ghost-pressure"]);
  });

  it("warns once when an active style chain reaches the critical window", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 1.35 },
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 0.85 }
      )
    ).toEqual(["chain-critical"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 0.85 },
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 0.45 }
      )
    ).toEqual([]);
  });

  it("signals when a critical style chain is saved back into a live window", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 0.85 },
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 4.6 }
      )
    ).toEqual(["chain-save"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 2.4 },
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 4.6 }
      )
    ).toEqual([]);
  });
});
