import { describe, expect, it } from "vitest";
import { buildCargoManifest, buildCargoRiskReadout, buildContractCargoTrait } from "./cargo";

describe("cargo manifest HUD copy", () => {
  it("shows the assigned cargo before pickup", () => {
    expect(buildCargoManifest({ cargoName: "Volatile Comet Ice", cargoOnboard: false })).toEqual({
      label: "Cargo",
      value: "Volatile Comet Ice"
    });
  });

  it("keeps the cargo identity visible after pickup", () => {
    expect(buildCargoManifest({ cargoName: "Bottled Starlight", cargoOnboard: true })).toEqual({
      label: "Cargo",
      value: "Bottled Starlight"
    });
  });

  it("surfaces unstable cargo risk before launch", () => {
    expect(
      buildCargoRiskReadout({
        cargoKind: "unstable",
        cargoFragility: 1,
        cargoDamage: 0,
        cargoOnboard: false
      })
    ).toEqual({
      label: "Cargo risk",
      value: "Unstable 1.00x",
      tone: "warning"
    });
  });

  it("surfaces time-sensitive cargo as a gold-window warning", () => {
    expect(
      buildCargoRiskReadout({
        cargoKind: "time-sensitive",
        cargoFragility: 0.9,
        cargoDamage: 0,
        cargoOnboard: false,
        paceSecondsRemaining: 27.4
      })
    ).toEqual({
      label: "Cargo risk",
      value: "Rush cargo / 27.4s gold",
      tone: "warning"
    });
  });

  it("raises urgent cargo stress when the rush window is closing onboard", () => {
    expect(
      buildCargoRiskReadout({
        cargoKind: "time-sensitive",
        cargoFragility: 0.9,
        cargoDamage: 0,
        cargoOnboard: true,
        paceSecondsRemaining: 4.2
      })
    ).toEqual({
      label: "Cargo stress",
      value: "Rush window 4.2s",
      tone: "danger"
    });
  });

  it("switches to stress readout during hazard contact", () => {
    expect(
      buildCargoRiskReadout({
        cargoKind: "unstable",
        cargoFragility: 1,
        cargoDamage: 0.18,
        cargoOnboard: true,
        hazardDangerLevel: "inside"
      })
    ).toEqual({
      label: "Cargo stress",
      value: "82% / contact",
      tone: "danger"
    });
  });

  it("formats cargo risk for compact contract cards", () => {
    expect(buildContractCargoTrait({ cargoKind: "fragile", cargoFragility: 0.8 })).toBe("Fragile 0.80x");
  });
});
