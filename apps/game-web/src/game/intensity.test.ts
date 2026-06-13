import { describe, expect, it } from "vitest";
import { buildRunIntensity } from "./intensity";

describe("adaptive run intensity", () => {
  it("keeps preflight and clean flight in stealth intensity", () => {
    expect(buildRunIntensity({ status: "paused", preflightOpen: true, fuelRatio: 1 })).toBe("stealth");
    expect(buildRunIntensity({ status: "flying", preflightOpen: false, fuelRatio: 0.9, paceSecondsRemaining: 20 })).toBe("stealth");
  });

  it("raises alarm for nearby pressure before the route is critical", () => {
    expect(buildRunIntensity({ status: "flying", preflightOpen: false, fuelRatio: 0.24 })).toBe("alarm");
    expect(buildRunIntensity({ status: "flying", preflightOpen: false, fuelRatio: 0.9, hazardDangerLevel: "near" })).toBe("alarm");
    expect(buildRunIntensity({ status: "flying", preflightOpen: false, fuelRatio: 0.9, trajectoryRiskLevel: "near" })).toBe("alarm");
  });

  it("locks down for crashes and immediate loss pressure", () => {
    expect(buildRunIntensity({ status: "crashed", preflightOpen: false, fuelRatio: 0.6 })).toBe("lockdown");
    expect(buildRunIntensity({ status: "flying", preflightOpen: false, fuelRatio: 0.12 })).toBe("lockdown");
    expect(buildRunIntensity({ status: "flying", preflightOpen: false, fuelRatio: 0.9, hazardDangerLevel: "inside" })).toBe("lockdown");
    expect(buildRunIntensity({ status: "flying", preflightOpen: false, fuelRatio: 0.9, trajectoryRiskLevel: "inside" })).toBe("lockdown");
  });

  it("locks down during closing express and style-chain windows", () => {
    expect(
      buildRunIntensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 3.5,
        cargoDamage: 0,
        fuelRatio: 0.9
      })
    ).toBe("lockdown");
    expect(
      buildRunIntensity({
        status: "flying",
        preflightOpen: false,
        fuelRatio: 0.9,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8
      })
    ).toBe("lockdown");
  });
});
