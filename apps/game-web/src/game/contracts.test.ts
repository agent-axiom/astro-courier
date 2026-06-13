import { describe, expect, it } from "vitest";
import {
  buildContractDangerPayTrait,
  buildContractHazardTrait,
  buildContractPreflightKicker,
  buildContractRoutePlan,
  buildDailyDispatch,
  buildDailyDispatchAction,
  buildDailyDispatchStatus,
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
      value: "Open today",
      tone: "open"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "none" })).toEqual({
      label: "Daily status",
      value: "Open today",
      tone: "open"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "gold" })).toEqual({
      label: "Daily status",
      value: "Cleared Gold",
      tone: "cleared"
    });
    expect(buildDailyDispatchStatus(dispatch, { medal: "comet" })).toEqual({
      label: "Daily status",
      value: "Comet held",
      tone: "comet"
    });
    expect(buildDailyDispatchStatus(undefined, { medal: "gold" })).toBeUndefined();
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
});
