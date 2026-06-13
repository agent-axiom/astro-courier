import { describe, expect, it } from "vitest";
import {
  buildContractDangerPayTrait,
  buildContractHazardTrait,
  buildContractPreflightKicker,
  buildContractRoutePlan,
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
