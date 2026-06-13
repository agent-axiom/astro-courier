import { describe, expect, it } from "vitest";
import { buildHazardPressureReadout } from "./hazard";

describe("hazard pressure readout", () => {
  it("stays hidden when no hazard is pressuring the route", () => {
    expect(buildHazardPressureReadout({})).toBeUndefined();
  });

  it("turns nearby clean hazards into a skim opportunity", () => {
    expect(
      buildHazardPressureReadout({
        hazardDangerLevel: "near",
        hazardDistance: 44,
        cargoDamage: 0.01
      })
    ).toEqual({
      label: "Risk pulse",
      value: "Skim window 44m",
      tone: "opportunity"
    });
  });

  it("shows the potential style payout when hazard severity is known", () => {
    expect(
      buildHazardPressureReadout({
        hazardDangerLevel: "near",
        hazardDistance: 44,
        hazardSeverity: 0.75,
        cargoDamage: 0.01
      })
    ).toEqual({
      label: "Risk pulse",
      value: "Skim +230 / 44m",
      tone: "opportunity"
    });
  });

  it("previews the multiplied skim payout during an active style chain", () => {
    expect(
      buildHazardPressureReadout({
        hazardDangerLevel: "near",
        hazardDistance: 44,
        hazardSeverity: 0.75,
        styleMultiplier: 1.5,
        cargoDamage: 0.01
      })
    ).toEqual({
      label: "Risk pulse",
      value: "Skim +345 / x1.50 / 44m",
      tone: "opportunity"
    });
  });

  it("shows a predicted hazard intercept before current proximity", () => {
    expect(
      buildHazardPressureReadout({
        trajectoryRiskLevel: "inside",
        trajectoryRiskSeconds: 1.2,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Risk pulse",
      value: "Collision vector 1.2s",
      tone: "danger"
    });
  });

  it("turns a clean near-field forecast into a skim vector", () => {
    expect(
      buildHazardPressureReadout({
        trajectoryRiskLevel: "near",
        trajectoryRiskSeconds: 0.8,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Risk pulse",
      value: "Skim vector 0.8s",
      tone: "opportunity"
    });
  });

  it("warns the player to keep damaged cargo wide near hazards", () => {
    expect(
      buildHazardPressureReadout({
        hazardDangerLevel: "near",
        hazardDistance: 62,
        cargoDamage: 0.16
      })
    ).toEqual({
      label: "Risk pulse",
      value: "Keep wide 62m",
      tone: "warning"
    });
  });

  it("escalates hazard contact into an exit callout", () => {
    expect(
      buildHazardPressureReadout({
        hazardDangerLevel: "inside",
        hazardDistance: 12,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Risk pulse",
      value: "Exit field 12m",
      tone: "danger"
    });
  });
});
