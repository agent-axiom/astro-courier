import { describe, expect, it } from "vitest";
import {
  buildContractDangerPayTrait,
  buildContractModifiers,
  buildContractOptionHook,
  buildContractSelectionBadge,
  buildContractHazardTrait,
  buildContractPreflightKicker,
  buildContractRoutePlan,
  buildDailyDispatch,
  buildDailyDispatchAction,
  buildDailyDispatchBadge,
  buildDailyDispatchPulse,
  buildDailyDispatchReset,
  buildDailyDispatchResult,
  buildDailyDispatchStatus,
  buildLaunchCommitment,
  buildRoutePressureBriefing,
  getNextContractId
} from "./contracts";

describe("contract rotation", () => {
  it("returns the next contract id and wraps at the end", () => {
    const contracts = [
      { id: "first-light-delivery" },
      { id: "return-leg" },
      { id: "asteroid-sprint" }
    ];

    expect(getNextContractId(contracts, "first-light-delivery")).toBe("return-leg");
    expect(getNextContractId(contracts, "asteroid-sprint")).toBe("first-light-delivery");
  });

  it("keeps the current contract when there is no safe next option", () => {
    expect(getNextContractId([{ id: "solo" }], "solo")).toBe("solo");
    expect(getNextContractId([], "missing")).toBe("missing");
    expect(getNextContractId([{ id: "known" }], "missing")).toBe("missing");
  });

  it("builds a deterministic daily dispatch from the UTC day", () => {
    const contracts = [
      { id: "first-light-delivery", title: "First Light Delivery" },
      { id: "return-leg", title: "Return Leg" },
      { id: "asteroid-sprint", title: "Asteroid Sprint" },
      { id: "gravity-slingshot", title: "Gravity Slingshot" },
      { id: "chain-relay", title: "Chain Relay" }
    ];

    expect(buildDailyDispatch({ contracts, now: new Date("2026-06-13T18:30:00Z") })).toEqual({
      label: "Daily dispatch",
      value: "Asteroid Sprint",
      contractId: "asteroid-sprint",
      seed: "daily-2026-06-13-asteroid-sprint",
      tone: "daily"
    });
    expect(buildDailyDispatch({ contracts, now: new Date("2026-06-13T23:59:59Z") })?.contractId).toBe("asteroid-sprint");
    expect(buildDailyDispatch({ contracts, now: new Date("2026-06-14T00:00:00Z") })?.contractId).toBe("gravity-slingshot");
  });

  it("hides daily dispatch when no contracts are available", () => {
    expect(buildDailyDispatch({ contracts: [], now: new Date("2026-06-13T18:30:00Z") })).toBeUndefined();
  });

  it("builds a daily dispatch selection action only when the daily route differs", () => {
    const dispatch = {
      label: "Daily dispatch" as const,
      value: "Asteroid Sprint",
      contractId: "asteroid-sprint",
      seed: "daily-2026-06-13-asteroid-sprint",
      tone: "daily" as const
    };

    expect(buildDailyDispatchAction(dispatch, "first-light-delivery")).toEqual({
      label: "Open daily",
      contractId: "asteroid-sprint"
    });
    expect(buildDailyDispatchAction(dispatch, "asteroid-sprint")).toBeUndefined();
    expect(buildDailyDispatchAction(undefined, "asteroid-sprint")).toBeUndefined();
  });

  it("marks the matching contract option as the daily route", () => {
    const dispatch = {
      label: "Daily dispatch" as const,
      value: "Asteroid Sprint",
      contractId: "asteroid-sprint",
      seed: "daily-2026-06-13-asteroid-sprint",
      tone: "daily" as const
    };

    expect(buildDailyDispatchBadge(dispatch, "asteroid-sprint")).toBe("Daily route");
    expect(buildDailyDispatchBadge(dispatch, "return-leg")).toBeUndefined();
    expect(buildDailyDispatchBadge(undefined, "asteroid-sprint")).toBeUndefined();
  });

  it("marks the currently selected contract option", () => {
    expect(buildContractSelectionBadge("asteroid-sprint", "asteroid-sprint")).toBe("Current route");
    expect(buildContractSelectionBadge("asteroid-sprint", "return-leg")).toBeUndefined();
  });

  it("summarizes daily dispatch clear status from the saved route best", () => {
    const dispatch = {
      label: "Daily dispatch" as const,
      value: "Asteroid Sprint",
      contractId: "asteroid-sprint",
      seed: "daily-2026-06-13-asteroid-sprint",
      tone: "daily" as const
    };

    expect(buildDailyDispatchStatus(dispatch, undefined)).toEqual({
      label: "Daily status",
      value: "First daily clear",
      tone: "open"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "none" })).toEqual({
      label: "Daily status",
      value: "First daily clear",
      tone: "open"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "bronze" })).toEqual({
      label: "Daily status",
      value: "Push daily gold",
      tone: "chase"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "silver" })).toEqual({
      label: "Daily status",
      value: "Push daily gold",
      tone: "chase"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "gold" })).toEqual({
      label: "Daily status",
      value: "Chase daily comet",
      tone: "chase"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "comet" })).toEqual({
      label: "Daily status",
      value: "Comet held",
      tone: "comet"
    });
    expect(buildDailyDispatchStatus(undefined, { medal: "gold" })).toBeUndefined();
  });

  it("surfaces saved daily personal-best metrics when the route has a result", () => {
    const dispatch = {
      label: "Daily dispatch" as const,
      value: "Asteroid Sprint",
      contractId: "asteroid-sprint",
      seed: "daily-2026-06-13-asteroid-sprint",
      tone: "daily" as const
    };

    expect(buildDailyDispatchStatus(dispatch, { medal: "silver", score: 1780, elapsedSeconds: 34.6 })).toEqual({
      label: "Daily status",
      value: "PB 1780 / 34.6s",
      tone: "chase"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "gold", score: 2960, elapsedSeconds: 25.8 })).toEqual({
      label: "Daily status",
      value: "Gold PB 2960 / 25.8s",
      tone: "chase"
    });
    expect(
      buildDailyDispatchStatus(dispatch, {
        medal: "gold",
        score: 2960,
        elapsedSeconds: 25.8,
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 18, y: -6 }
        ]
      })
    ).toEqual({
      label: "Daily status",
      value: "Ghost PB 2960 / 25.8s",
      tone: "ghost"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "comet", score: 3260, elapsedSeconds: 27.4 })).toEqual({
      label: "Daily status",
      value: "Comet PB 3260 / 27.4s",
      tone: "comet"
    });
  });

  it("summarizes the remaining time before the daily dispatch rotates", () => {
    const dispatch = {
      label: "Daily dispatch" as const,
      value: "Asteroid Sprint",
      contractId: "asteroid-sprint",
      seed: "daily-2026-06-13-asteroid-sprint",
      tone: "daily" as const
    };

    expect(buildDailyDispatchReset(dispatch, new Date("2026-06-13T18:30:00Z"))).toEqual({
      label: "Daily reset",
      value: "5h 30m left",
      tone: "steady"
    });
    expect(buildDailyDispatchReset(dispatch, new Date("2026-06-13T23:42:20Z"))).toEqual({
      label: "Daily reset",
      value: "Final 17m left",
      tone: "urgent"
    });
    expect(buildDailyDispatchReset(dispatch, new Date("2026-06-13T23:59:20Z"))).toEqual({
      label: "Daily reset",
      value: "Final 40s left",
      tone: "urgent"
    });
    expect(buildDailyDispatchReset(undefined, new Date("2026-06-13T18:30:00Z"))).toBeUndefined();
  });

  it("summarizes the deterministic daily hazard pulse from the dispatch seed", () => {
    expect(buildDailyDispatchPulse(undefined)).toBeUndefined();
    expect(
      buildDailyDispatchPulse({
        label: "Daily dispatch",
        value: "First Light Delivery",
        contractId: "first-light-delivery",
        seed: "daily-2026-07-01-first-light-delivery",
        tone: "daily"
      })
    ).toEqual({
      label: "Daily pulse",
      value: "Hazards +7%",
      tone: "hot"
    });
    expect(
      buildDailyDispatchPulse({
        label: "Daily dispatch",
        value: "Asteroid Sprint",
        contractId: "asteroid-sprint",
        seed: "daily-2026-06-13-asteroid-sprint",
        tone: "daily"
      })
    ).toEqual({
      label: "Daily pulse",
      value: "Hazards -9%",
      tone: "soft"
    });
    expect(
      buildDailyDispatchPulse({
        label: "Daily dispatch",
        value: "Gravity Slingshot",
        contractId: "gravity-slingshot",
        seed: "daily-2026-06-14-gravity-slingshot",
        tone: "daily"
      })
    ).toEqual({
      label: "Daily pulse",
      value: "Hazards stable",
      tone: "steady"
    });
  });

  it("summarizes daily dispatch outcomes for the result overlay", () => {
    const dispatch = {
      label: "Daily dispatch" as const,
      value: "Asteroid Sprint",
      contractId: "asteroid-sprint",
      seed: "daily-2026-06-13-asteroid-sprint",
      tone: "daily" as const
    };

    expect(
      buildDailyDispatchResult({
        dispatch,
        contractId: "asteroid-sprint",
        status: "crashed",
        medal: "none",
        isNewBest: false
      })
    ).toEqual({
      label: "Daily dispatch",
      value: "Daily route failed",
      tone: "failed"
    });
    expect(
      buildDailyDispatchResult({
        dispatch,
        contractId: "asteroid-sprint",
        status: "delivered",
        medal: "silver",
        isNewBest: true
      })
    ).toEqual({
      label: "Daily dispatch",
      value: "Daily PB banked",
      tone: "new-best"
    });
    expect(
      buildDailyDispatchResult({
        dispatch,
        contractId: "asteroid-sprint",
        status: "delivered",
        medal: "comet",
        isNewBest: false
      })
    ).toEqual({
      label: "Daily dispatch",
      value: "Comet daily clear",
      tone: "comet"
    });
    expect(
      buildDailyDispatchResult({
        dispatch,
        contractId: "return-leg",
        status: "delivered",
        medal: "gold",
        isNewBest: true
      })
    ).toBeUndefined();
    expect(
      buildDailyDispatchResult({
        dispatch: undefined,
        contractId: "asteroid-sprint",
        status: "delivered",
        medal: "gold",
        isNewBest: true
      })
    ).toBeUndefined();
  });

  it("formats elevated contract hazard load for briefing cards", () => {
    expect(buildContractHazardTrait({ hazardSeverityMultiplier: 1.45 })).toBe("Hazard 1.45x");
    expect(buildContractHazardTrait({})).toBeUndefined();
    expect(buildContractHazardTrait({ hazardSeverityMultiplier: 1 })).toBeUndefined();
  });

  it("formats danger pay from elevated contract hazard load", () => {
    expect(buildContractDangerPayTrait({ hazardSeverityMultiplier: 1.45 })).toBe("Danger pay +180");
    expect(buildContractDangerPayTrait({})).toBeUndefined();
    expect(buildContractDangerPayTrait({ hazardSeverityMultiplier: 1 })).toBeUndefined();
  });

  it("labels the active preflight contract by route personality", () => {
    expect(buildContractPreflightKicker({ contractId: "first-light-delivery", goldSeconds: 35 })).toBe("Starter Contract");
    expect(buildContractPreflightKicker({ contractId: "asteroid-sprint", goldSeconds: 24, hazardSeverityMultiplier: 1.45 })).toBe(
      "Asteroid Contract"
    );
    expect(buildContractPreflightKicker({ contractId: "return-leg", goldSeconds: 30 })).toBe("Return Contract");
    expect(buildContractPreflightKicker({ contractId: "gravity-slingshot", goldSeconds: 26, hazardSeverityMultiplier: 1.2 })).toBe(
      "Gravity Contract"
    );
    expect(buildContractPreflightKicker({ contractId: "chain-relay", goldSeconds: 22, hazardSeverityMultiplier: 1.3 })).toBe(
      "Chain Contract"
    );
    expect(buildContractPreflightKicker({ contractId: "last-drop-run", goldSeconds: 27 })).toBe("Last Drop Contract");
  });

  it("calls out the gravity slingshot route plan before generic fragile handling", () => {
    expect(
      buildContractRoutePlan({
        contractId: "gravity-slingshot",
        cargoKind: "fragile",
        cargoFragility: 0.8,
        hazardSeverityMultiplier: 1.2,
        goldSeconds: 26
      })
    ).toEqual({
      label: "Route plan",
      value: "Ride gravity, bleed speed",
      tone: "speed"
    });
  });

  it("prioritizes a danger route plan for high hazard contracts", () => {
    expect(
      buildContractRoutePlan({
        cargoKind: "volatile",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.45,
        goldSeconds: 24
      })
    ).toEqual({
      label: "Route plan",
      value: "Skim wide, cash danger",
      tone: "danger"
    });
  });

  it("calls out asteroid field threading before generic danger handling", () => {
    expect(
      buildContractRoutePlan({
        contractId: "asteroid-sprint",
        cargoKind: "volatile",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.45,
        goldSeconds: 24
      })
    ).toEqual({
      label: "Route plan",
      value: "Thread field, cash danger",
      tone: "danger"
    });
  });

  it("calls out the return leg before generic sprint handling", () => {
    expect(
      buildContractRoutePlan({
        contractId: "return-leg",
        cargoKind: "fragile",
        cargoFragility: 0.8,
        goldSeconds: 30
      })
    ).toEqual({
      label: "Route plan",
      value: "Reverse line, brake planet-side",
      tone: "speed"
    });
  });

  it("calls out chain relay before generic danger handling", () => {
    expect(
      buildContractRoutePlan({
        contractId: "chain-relay",
        cargoKind: "unstable",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.3,
        goldSeconds: 22
      })
    ).toEqual({
      label: "Route plan",
      value: "Skim, chain, fast dock",
      tone: "danger"
    });
  });

  it("calls out last drop routes before generic time-sensitive handling", () => {
    expect(
      buildContractRoutePlan({
        contractId: "last-drop-run",
        cargoKind: "time-sensitive",
        cargoFragility: 0.9,
        goldSeconds: 27
      })
    ).toEqual({
      label: "Route plan",
      value: "Preserve fuel, dock empty",
      tone: "speed"
    });
  });

  it("calls out careful handling for fragile low-hazard cargo", () => {
    expect(
      buildContractRoutePlan({
        cargoKind: "fragile",
        cargoFragility: 0.8,
        goldSeconds: 35
      })
    ).toEqual({
      label: "Route plan",
      value: "Soft dock, protect cargo",
      tone: "careful"
    });
  });

  it("spots tight sprint contracts without special cargo pressure", () => {
    expect(
      buildContractRoutePlan({
        cargoKind: "standard",
        cargoFragility: 1,
        goldSeconds: 24
      })
    ).toEqual({
      label: "Route plan",
      value: "Minimal burns, fast dock",
      tone: "speed"
    });
  });

  it("summarizes high-pressure danger pay contracts for preflight", () => {
    expect(
      buildRoutePressureBriefing({
        contractId: "asteroid-sprint",
        cargoKind: "volatile",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.45,
        goldSeconds: 24
      })
    ).toEqual({
      label: "Route pressure",
      value: "High risk / high payout",
      tone: "hot"
    });
  });

  it("summarizes fuel-tempo and fragile-care contracts for preflight", () => {
    expect(
      buildRoutePressureBriefing({
        contractId: "last-drop-run",
        cargoKind: "time-sensitive",
        cargoFragility: 0.9,
        goldSeconds: 27
      })
    ).toEqual({
      label: "Route pressure",
      value: "Fuel squeeze / late reward",
      tone: "tempo"
    });
    expect(
      buildRoutePressureBriefing({
        cargoKind: "fragile",
        cargoFragility: 0.8,
        goldSeconds: 35
      })
    ).toEqual({
      label: "Route pressure",
      value: "Clean handling / soft dock",
      tone: "care"
    });
  });

  it("builds scan-friendly modifier chips for special contract identities", () => {
    expect(
      buildContractModifiers({
        contractId: "gravity-slingshot",
        cargoKind: "fragile",
        cargoFragility: 0.8,
        hazardSeverityMultiplier: 1.2,
        goldSeconds: 26
      })
    ).toEqual([
      { label: "Sling", value: "+240 style", tone: "style" },
      { label: "Speed", value: "54+ entry", tone: "speed" },
      { label: "Cargo", value: "Soft dock", tone: "precision" }
    ]);

    const lastDropModifiers = buildContractModifiers({
      contractId: "last-drop-run",
      cargoKind: "time-sensitive",
      cargoFragility: 0.9,
      goldSeconds: 27
    });

    expect(lastDropModifiers[0]).toEqual({ label: "Fuel", value: "Below 5%", tone: "fuel" });
    expect(lastDropModifiers[2]).toEqual({ label: "Cargo", value: "Rush cargo", tone: "speed" });
  });

  it("falls back to pressure-based modifier chips for generic routes", () => {
    expect(
      buildContractModifiers({
        cargoKind: "volatile",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.45,
        goldSeconds: 24
      })
    ).toEqual([
      { label: "Hazard", value: "1.45x field", tone: "danger" },
      { label: "Pace", value: "Gold 24s", tone: "speed" },
      { label: "Cargo", value: "Stable load", tone: "cargo" }
    ]);
  });
});

describe("contract option hooks", () => {
  it("gives special routes a clear reason to pick them from the board", () => {
    expect(
      buildContractOptionHook({
        contractId: "gravity-slingshot",
        cargoKind: "fragile",
        cargoFragility: 0.8,
        hazardSeverityMultiplier: 1.2,
        goldSeconds: 26
      })
    ).toEqual({
      label: "Pick for",
      value: "Gravity arc mastery",
      tone: "style"
    });
    expect(
      buildContractOptionHook({
        contractId: "chain-relay",
        cargoKind: "unstable",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.3,
        goldSeconds: 22
      })
    ).toEqual({
      label: "Pick for",
      value: "Style chain pressure",
      tone: "style"
    });
    expect(
      buildContractOptionHook({
        contractId: "last-drop-run",
        cargoKind: "time-sensitive",
        cargoFragility: 0.9,
        goldSeconds: 27
      })
    ).toEqual({
      label: "Pick for",
      value: "Fuel clutch finish",
      tone: "fuel"
    });
  });

  it("turns pressure traits into readable board hooks", () => {
    expect(
      buildContractOptionHook({
        cargoKind: "volatile",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.45,
        goldSeconds: 24
      })
    ).toEqual({
      label: "Pick for",
      value: "Danger pay chase",
      tone: "danger"
    });
    expect(
      buildContractOptionHook({
        cargoKind: "fragile",
        cargoFragility: 0.8,
        goldSeconds: 35
      })
    ).toEqual({
      label: "Pick for",
      value: "Clean cargo control",
      tone: "precision"
    });
    expect(
      buildContractOptionHook({
        cargoKind: "standard",
        cargoFragility: 1,
        goldSeconds: 24
      })
    ).toEqual({
      label: "Pick for",
      value: "Gold split sprint",
      tone: "speed"
    });
  });
});

describe("launch commitment", () => {
  it("turns selected route pressure into CTA subcopy", () => {
    expect(
      buildLaunchCommitment({
        contractId: "asteroid-sprint",
        cargoKind: "volatile",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.45,
        goldSeconds: 24
      })
    ).toEqual({
      label: "Launch intent",
      value: "Commit high payout run",
      tone: "hot"
    });
    expect(
      buildLaunchCommitment({
        contractId: "last-drop-run",
        cargoKind: "time-sensitive",
        cargoFragility: 0.9,
        goldSeconds: 27
      })
    ).toEqual({
      label: "Launch intent",
      value: "Commit fuel clutch",
      tone: "tempo"
    });
    expect(
      buildLaunchCommitment({
        cargoKind: "fragile",
        cargoFragility: 0.8,
        goldSeconds: 35
      })
    ).toEqual({
      label: "Launch intent",
      value: "Commit clean cargo",
      tone: "care"
    });
    expect(
      buildLaunchCommitment({
        cargoKind: "standard",
        cargoFragility: 1,
        goldSeconds: 35
      })
    ).toEqual({
      label: "Launch intent",
      value: "Commit clean courier line",
      tone: "steady"
    });
  });
});
