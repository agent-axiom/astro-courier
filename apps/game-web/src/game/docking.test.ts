import { describe, expect, it } from "vitest";
import {
  buildApproachRewardReadout,
  buildDockingPulsePresentation,
  buildDockingLanePresentation,
  buildDockingSpeedReadout,
  buildLandingGuidanceLabel,
  buildLandingGuidancePresentation,
  buildPickupPulsePresentation
} from "./docking";

describe("docking speed readout", () => {
  it("stays hidden until a target speed limit is known", () => {
    expect(buildDockingSpeedReadout({ speed: 12 })).toBeUndefined();
  });

  it("formats current speed against the active pad limit", () => {
    expect(buildDockingSpeedReadout({ speed: 18.25, allowedSpeed: 42 })).toEqual({
      label: "Dock speed",
      value: "18.3 / 42.0",
      tone: "normal"
    });
  });

  it("warns when current speed exceeds the active pad limit", () => {
    expect(buildDockingSpeedReadout({ speed: 44, allowedSpeed: 42 })).toEqual({
      label: "Dock speed",
      value: "44.0 / 42.0",
      tone: "over-limit"
    });
  });

  it("commands braking when the ship is over limit on final approach", () => {
    expect(buildDockingSpeedReadout({ speed: 44, allowedSpeed: 42, targetDistance: 54 })).toEqual({
      label: "Dock speed",
      value: "Slow for clean 44.0 / 42.0",
      tone: "over-limit"
    });
  });

  it("keeps normal final approach speed readouts compact", () => {
    expect(buildDockingSpeedReadout({ speed: 32, allowedSpeed: 42, targetDistance: 54 })).toEqual({
      label: "Dock speed",
      value: "32.0 / 42.0",
      tone: "normal"
    });
  });
});

describe("approach reward readout", () => {
  it("stays hidden before the player holds a meaningful stable approach", () => {
    expect(buildApproachRewardReadout({ approachStreakSeconds: 0.1 })).toBeUndefined();
  });

  it("shows progress toward the perfect approach setup window", () => {
    expect(buildApproachRewardReadout({ approachStreakSeconds: 0.6 })).toEqual({
      label: "Perfect setup",
      value: "0.6 / 1.0s",
      tone: "charging",
      progress: 0.6
    });
  });

  it("shows the ready style payout once the setup window is banked", () => {
    expect(buildApproachRewardReadout({ approachStreakSeconds: 1.2 })).toEqual({
      label: "Perfect setup",
      value: "+220 ready",
      tone: "ready",
      progress: 1
    });
  });
});

describe("landing guidance label", () => {
  it("keeps live dock guidance short and action-led", () => {
    expect(buildLandingGuidanceLabel({ status: "approach" })).toBe("Line up");
    expect(buildLandingGuidanceLabel({ status: "too-fast" })).toBe("Slow for clean");
    expect(buildLandingGuidanceLabel({ status: "misaligned" })).toBe("Align for clean");
    expect(buildLandingGuidanceLabel({ status: "ready" })).toBe("Dock ready");
  });

  it("names slow off-angle ready contacts as soft docks", () => {
    expect(
      buildLandingGuidanceLabel({
        status: "ready",
        speed: 24,
        allowedSpeed: 42,
        angleError: 1,
        requiredAngleTolerance: 0.75
      })
    ).toBe("Soft dock");
  });

  it("gives slow off-angle ready contacts a dedicated soft tone", () => {
    expect(
      buildLandingGuidancePresentation({
        status: "ready",
        speed: 24,
        allowedSpeed: 42,
        angleError: 1,
        requiredAngleTolerance: 0.75
      })
    ).toEqual({
      label: "Soft dock",
      tone: "soft"
    });
  });

  it("keeps assist availability above ordinary landing guidance", () => {
    expect(buildLandingGuidanceLabel({ status: "too-fast", assistAvailable: true })).toBe("Assist ready");
  });
});

describe("docking lane presentation", () => {
  it("stays hidden until the delivery target is close enough to act on", () => {
    expect(
      buildDockingLanePresentation({
        status: "flying",
        objectivePhase: "pickup",
        targetDistance: 42,
        landingStatus: "ready",
        speed: 18,
        allowedSpeed: 42
      })
    ).toBeUndefined();

    expect(
      buildDockingLanePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 121,
        landingStatus: "approach",
        speed: 18,
        allowedSpeed: 42
      })
    ).toBeUndefined();
  });

  it("turns final approach into one clear ready signal", () => {
    expect(
      buildDockingLanePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 42,
        landingStatus: "ready",
        speed: 18,
        allowedSpeed: 42,
        approachStreakSeconds: 1.1
      })
    ).toEqual({
      label: "Dock lane",
      action: "Land now",
      detail: "42m / 18.0",
      tone: "ready",
      progress: 0.65,
      segments: [
        { label: "Align", state: "ready" },
        { label: "Brake", state: "ready" },
        { label: "Touch", state: "ready" }
      ],
      reward: "+220 setup"
    });
  });

  it("frames slow off-angle ready delivery as an easing soft dock", () => {
    expect(
      buildDockingLanePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 36,
        landingStatus: "ready",
        speed: 24,
        allowedSpeed: 42,
        angleError: 1,
        requiredAngleTolerance: 0.75,
        approachStreakSeconds: 0.4
      })
    ).toMatchObject({
      action: "Ease in",
      detail: "Soft dock",
      tone: "soft",
      segments: [
        { label: "Align", state: "warning" },
        { label: "Brake", state: "ready" },
        { label: "Touch", state: "ready" }
      ]
    });
  });

  it("names the one thing blocking the landing window", () => {
    expect(
      buildDockingLanePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 54,
        landingStatus: "too-fast",
        speed: 48,
        allowedSpeed: 42
      })
    ).toMatchObject({
      action: "Brake",
      detail: "48.0 / 42.0",
      tone: "danger",
      segments: [
        { label: "Align", state: "ready" },
        { label: "Brake", state: "danger" },
        { label: "Touch", state: "locked" }
      ]
    });

    expect(
      buildDockingLanePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 54,
        landingStatus: "misaligned",
        speed: 22,
        allowedSpeed: 42
      })
    ).toMatchObject({
      action: "Align",
      detail: "54m / 22.0",
      tone: "warning",
      segments: [
        { label: "Align", state: "warning" },
        { label: "Brake", state: "ready" },
        { label: "Touch", state: "locked" }
      ]
    });
  });
});

describe("docking pulse presentation", () => {
  it("stays hidden until the final delivery contact window", () => {
    expect(
      buildDockingPulsePresentation({
        status: "flying",
        objectivePhase: "pickup",
        targetDistance: 44,
        landingStatus: "ready",
        speed: 18,
        allowedSpeed: 42
      })
    ).toBeUndefined();

    expect(
      buildDockingPulsePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 88,
        landingStatus: "ready",
        speed: 18,
        allowedSpeed: 42
      })
    ).toBeUndefined();
  });

  it("shows a lightweight tracking cue before the strict dock window arms", () => {
    expect(
      buildDockingPulsePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 64,
        landingStatus: "approach",
        speed: 18,
        allowedSpeed: 42
      })
    ).toEqual({
      action: "Track pad",
      detail: "64m",
      tone: "approach",
      progress: 0.11
    });
  });

  it("reduces final dock state to one large action cue", () => {
    expect(
      buildDockingPulsePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 42,
        landingStatus: "ready",
        speed: 18,
        allowedSpeed: 42,
        approachStreakSeconds: 1.1
      })
    ).toEqual({
      action: "Dock now",
      detail: "42m",
      tone: "ready",
      progress: 0.42,
      reward: "+220"
    });
  });

  it("uses the final pulse to show slow off-angle contacts are safe soft docks", () => {
    expect(
      buildDockingPulsePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 36,
        landingStatus: "ready",
        speed: 24,
        allowedSpeed: 42,
        angleError: 1,
        requiredAngleTolerance: 0.75,
        approachStreakSeconds: 0.4
      })
    ).toEqual({
      action: "Ease in",
      detail: "Soft dock",
      tone: "soft",
      progress: 0.5
    });
  });

  it("names only the blocking control when the final contact is unsafe", () => {
    expect(
      buildDockingPulsePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 54,
        landingStatus: "too-fast",
        speed: 48,
        allowedSpeed: 42
      })
    ).toEqual({
      action: "Brake",
      detail: "6 over",
      tone: "danger",
      progress: 0.25
    });

    expect(
      buildDockingPulsePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 54,
        landingStatus: "misaligned",
        speed: 22,
        allowedSpeed: 42
      })
    ).toEqual({
      action: "Align",
      detail: "54m",
      tone: "warning",
      progress: 0.25
    });
  });
});

describe("pickup pulse presentation", () => {
  it("stays hidden until the final pickup contact window", () => {
    expect(
      buildPickupPulsePresentation({
        status: "flying",
        objectivePhase: "delivery",
        targetDistance: 44,
        landingStatus: "ready",
        speed: 18,
        allowedSpeed: 42,
        quickPickupSecondsRemaining: 7.2,
        quickPickupBonus: 180
      })
    ).toBeUndefined();

    expect(
      buildPickupPulsePresentation({
        status: "flying",
        objectivePhase: "pickup",
        targetDistance: 88,
        landingStatus: "ready",
        speed: 18,
        allowedSpeed: 42,
        quickPickupSecondsRemaining: 7.2,
        quickPickupBonus: 180
      })
    ).toBeUndefined();
  });

  it("turns final pickup approach into one large load cue", () => {
    expect(
      buildPickupPulsePresentation({
        status: "flying",
        objectivePhase: "pickup",
        targetDistance: 42,
        landingStatus: "ready",
        speed: 18,
        allowedSpeed: 42,
        quickPickupSecondsRemaining: 7.2,
        quickPickupBonus: 180
      })
    ).toEqual({
      action: "Load now",
      detail: "7.2s",
      tone: "pickup",
      progress: 0.42,
      reward: "+180"
    });
  });

  it("keeps unsafe pickup contact focused on the blocking control", () => {
    expect(
      buildPickupPulsePresentation({
        status: "flying",
        objectivePhase: "pickup",
        targetDistance: 54,
        landingStatus: "too-fast",
        speed: 48,
        allowedSpeed: 42,
        quickPickupSecondsRemaining: 4.4,
        quickPickupBonus: 180
      })
    ).toEqual({
      action: "Brake",
      detail: "6 over",
      tone: "danger",
      progress: 0.25
    });

    expect(
      buildPickupPulsePresentation({
        status: "flying",
        objectivePhase: "pickup",
        targetDistance: 54,
        landingStatus: "misaligned",
        speed: 22,
        allowedSpeed: 42,
        quickPickupSecondsRemaining: 4.4,
        quickPickupBonus: 180
      })
    ).toEqual({
      action: "Align",
      detail: "54m",
      tone: "warning",
      progress: 0.25
    });
  });
});
