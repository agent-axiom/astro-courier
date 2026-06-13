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
