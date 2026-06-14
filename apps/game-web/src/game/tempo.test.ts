import { describe, expect, it } from "vitest";
import { buildRouteTempo, buildRouteTempoAction, buildRouteTempoShellClass } from "./tempo";

describe("route tempo readout", () => {
  it("hides outside active live flight", () => {
    expect(buildRouteTempo({ status: "paused", preflightOpen: true, speed: 0, fuelRatio: 1 })).toBeUndefined();
    expect(buildRouteTempo({ status: "paused", preflightOpen: false, speed: 0, fuelRatio: 1 })).toBeUndefined();
    expect(buildRouteTempo({ status: "delivered", preflightOpen: false, speed: 0, fuelRatio: 1 })).toBeUndefined();
  });

  it("prioritizes immediate route danger over tempo opportunities", () => {
    expect(
      buildRouteTempo({
        status: "flying",
        preflightOpen: false,
        speed: 50,
        fuelRatio: 0.8,
        hazardDangerLevel: "inside",
        styleMultiplier: 2,
        styleChainSecondsRemaining: 3
      })
    ).toEqual({
      label: "Route tempo",
      value: "Break vector",
      tone: "danger",
      progress: 1
    });
  });

  it("surfaces clutch cash-out windows before generic flow", () => {
    expect(
      buildRouteTempo({
        status: "flying",
        preflightOpen: false,
        speed: 38,
        fuelRatio: 0.75,
        styleMultiplier: 2,
        styleChainSecondsRemaining: 0.8
      })
    ).toEqual({
      label: "Route tempo",
      value: "Cash chain / x2.00 / 0.8s",
      tone: "clutch",
      progress: 0.33
    });

    expect(
      buildRouteTempo({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        speed: 42,
        fuelRatio: 0.9,
        paceTier: "gold",
        paceSecondsRemaining: 3.5,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Route tempo",
      value: "Gold close / 3.5s",
      tone: "clutch",
      progress: 0.13
    });
  });

  it("reads clean precision and chain states as flow", () => {
    expect(
      buildRouteTempo({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        speed: 18,
        fuelRatio: 0.9,
        cargoDamage: 0,
        landingStatus: "ready",
        approachStreakSeconds: 1.2
      })
    ).toEqual({
      label: "Route tempo",
      value: "Perfect flow / dock now",
      tone: "flow",
      progress: 1
    });

    expect(
      buildRouteTempo({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        speed: 18,
        fuelRatio: 0.9,
        cargoDamage: 0,
        landingStatus: "ready",
        perfectDockReady: true,
        approachStreakSeconds: 0.2
      })
    ).toEqual({
      label: "Route tempo",
      value: "Perfect flow / dock now",
      tone: "flow",
      progress: 1
    });

    expect(
      buildRouteTempo({
        status: "flying",
        preflightOpen: false,
        speed: 36,
        fuelRatio: 0.9,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 2.4
      })
    ).toEqual({
      label: "Route tempo",
      value: "Flow chain / x1.50",
      tone: "flow",
      progress: 0.6
    });
  });

  it("falls back to a speed and intercept based push state", () => {
    expect(
      buildRouteTempo({
        status: "flying",
        preflightOpen: false,
        speed: 30,
        targetDistance: 300,
        fuelRatio: 0.9
      })
    ).toEqual({
      label: "Route tempo",
      value: "ETA 10.0s / speed 30",
      tone: "push",
      progress: 0.5
    });

    expect(buildRouteTempo({ status: "flying", preflightOpen: false, speed: 12, fuelRatio: 0.9 })?.value).toBe(
      "Build speed / 12"
    );
  });

  it("maps route tempo tones into stable shell state classes", () => {
    expect(buildRouteTempoShellClass(undefined)).toBe("app-route-tempo-none");
    expect(buildRouteTempoShellClass({ label: "Route tempo", value: "ETA 10.0s / speed 30", tone: "push", progress: 0.5 })).toBe(
      "app-route-tempo-push"
    );
    expect(buildRouteTempoShellClass({ label: "Route tempo", value: "Perfect flow / dock now", tone: "flow", progress: 1 })).toBe(
      "app-route-tempo-flow"
    );
    expect(buildRouteTempoShellClass({ label: "Route tempo", value: "Gold close / 3.5s", tone: "clutch", progress: 0.13 })).toBe(
      "app-route-tempo-clutch"
    );
    expect(buildRouteTempoShellClass({ label: "Route tempo", value: "Break vector", tone: "danger", progress: 1 })).toBe(
      "app-route-tempo-danger"
    );
  });

  it("turns live route tempo into a concrete next action", () => {
    expect(
      buildRouteTempoAction({
        routeTempo: { label: "Route tempo", value: "Break vector", tone: "danger", progress: 1 },
        status: "flying",
        preflightOpen: false
      })
    ).toEqual({
      label: "Tempo action",
      value: "Evade now",
      tone: "danger"
    });

    expect(
      buildRouteTempoAction({
        routeTempo: { label: "Route tempo", value: "Cash chain / x2.00 / 0.8s", tone: "clutch", progress: 0.33 },
        status: "flying",
        preflightOpen: false
      })
    ).toEqual({
      label: "Tempo action",
      value: "Cash chain",
      tone: "clutch"
    });

    expect(
      buildRouteTempoAction({
        routeTempo: { label: "Route tempo", value: "Perfect flow / dock now", tone: "flow", progress: 1 },
        status: "flying",
        preflightOpen: false
      })
    ).toEqual({
      label: "Tempo action",
      value: "Hold flow",
      tone: "flow"
    });

    expect(
      buildRouteTempoAction({
        routeTempo: { label: "Route tempo", value: "ETA 10.0s / speed 30", tone: "push", progress: 0.5 },
        status: "flying",
        preflightOpen: false,
        speed: 30,
        targetDistance: 300
      })
    ).toEqual({
      label: "Tempo action",
      value: "Boost line",
      tone: "push"
    });
  });

  it("hides the tempo action outside active flight", () => {
    const routeTempo = { label: "Route tempo", value: "ETA 10.0s / speed 30", tone: "push", progress: 0.5 } as const;

    expect(buildRouteTempoAction({ routeTempo, status: "paused", preflightOpen: false })).toBeUndefined();
    expect(buildRouteTempoAction({ routeTempo, status: "flying", preflightOpen: true })).toBeUndefined();
    expect(buildRouteTempoAction({ routeTempo: undefined, status: "flying", preflightOpen: false })).toBeUndefined();
  });
});
