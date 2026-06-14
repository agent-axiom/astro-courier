import { describe, expect, it } from "vitest";
import { buildCometRunReadout, isLiveCometDockArmed } from "./comet";

describe("live comet run readout", () => {
  it("stays hidden in preflight and after the run is over", () => {
    expect(
      buildCometRunReadout({
        status: "paused",
        preflightOpen: true,
        paceTier: "gold",
        fuel: 90,
        maxFuel: 100,
        cargoDamage: 0
      })
    ).toBeUndefined();
    expect(
      buildCometRunReadout({
        status: "delivered",
        preflightOpen: false,
        paceTier: "gold",
        fuel: 90,
        maxFuel: 100,
        cargoDamage: 0
      })
    ).toBeUndefined();
  });

  it("shows comet eligibility while gold pace, clean cargo, and reserve fuel are intact", () => {
    expect(
      buildCometRunReadout({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "pickup",
        paceTier: "gold",
        fuel: 82,
        maxFuel: 100,
        cargoDamage: 0.01
      })
    ).toEqual({
      label: "Comet run",
      value: "Clean + reserve",
      detail: "Reserve 82% / need 75%",
      tone: "live"
    });
  });

  it("arms the comet finish when the delivery dock is already perfect-ready", () => {
    expect(
      buildCometRunReadout({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        paceTier: "gold",
        fuel: 84,
        maxFuel: 100,
        cargoDamage: 0,
        landingStatus: "ready",
        perfectDockReady: true
      })
    ).toEqual({
      label: "Comet run",
      value: "Perfect dock armed",
      detail: "Reserve 84% / need 75%",
      tone: "live"
    });
  });

  it("coaches the missing final dock condition while comet pace and reserve remain alive", () => {
    expect(
      buildCometRunReadout({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        paceTier: "gold",
        fuel: 84,
        maxFuel: 100,
        cargoDamage: 0,
        landingStatus: "too-fast",
        perfectDockReady: false
      })
    ).toEqual({
      label: "Comet run",
      value: "Slow for perfect dock",
      detail: "Reserve 84% / need 75%",
      tone: "warning"
    });
    expect(
      buildCometRunReadout({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        paceTier: "gold",
        fuel: 84,
        maxFuel: 100,
        cargoDamage: 0,
        landingStatus: "misaligned",
        perfectDockReady: false
      })
    ).toEqual({
      label: "Comet run",
      value: "Line up perfect dock",
      detail: "Reserve 84% / need 75%",
      tone: "warning"
    });
    expect(
      buildCometRunReadout({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        paceTier: "gold",
        fuel: 84,
        maxFuel: 100,
        cargoDamage: 0,
        landingStatus: "ready",
        perfectDockReady: false
      })
    ).toEqual({
      label: "Comet run",
      value: "Feather for perfect dock",
      detail: "Reserve 84% / need 75%",
      tone: "warning"
    });
  });

  it("warns while comet reserve is still possible but tight", () => {
    expect(
      buildCometRunReadout({
        status: "flying",
        preflightOpen: false,
        paceTier: "gold",
        fuel: 78,
        maxFuel: 100,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Comet run",
      value: "Coast for comet",
      detail: "Reserve 78% / 3% burn buffer",
      tone: "warning"
    });
  });

  it("calls out missed gold pace first", () => {
    expect(
      buildCometRunReadout({
        status: "flying",
        preflightOpen: false,
        paceTier: "silver",
        fuel: 90,
        maxFuel: 100,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Comet run",
      value: "Gold missed",
      tone: "lost"
    });
  });

  it("calls out scratched cargo while gold pace remains live", () => {
    expect(
      buildCometRunReadout({
        status: "flying",
        preflightOpen: false,
        paceTier: "gold",
        fuel: 90,
        maxFuel: 100,
        cargoDamage: 0.03
      })
    ).toEqual({
      label: "Comet run",
      value: "Cargo scratched",
      tone: "lost"
    });
  });

  it("calls out low reserve after pace and cargo stay clean", () => {
    expect(
      buildCometRunReadout({
        status: "flying",
        preflightOpen: false,
        paceTier: "gold",
        fuel: 74,
        maxFuel: 100,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Comet run",
      value: "Reserve low",
      detail: "Reserve 74% / need 75%",
      tone: "lost"
    });
  });

  it("recognizes live comet dock arming conditions as a shared rule", () => {
    const armedInput = {
      status: "flying" as const,
      objectivePhase: "delivery" as const,
      paceTier: "gold" as const,
      fuel: 84,
      maxFuel: 100,
      cargoDamage: 0,
      perfectDockReady: true
    };

    expect(isLiveCometDockArmed(armedInput)).toBe(true);
    expect(isLiveCometDockArmed({ ...armedInput, objectivePhase: "pickup" })).toBe(false);
    expect(isLiveCometDockArmed({ ...armedInput, paceTier: "silver" })).toBe(false);
    expect(isLiveCometDockArmed({ ...armedInput, fuel: 70 })).toBe(false);
    expect(isLiveCometDockArmed({ ...armedInput, cargoDamage: 0.05 })).toBe(false);
    expect(isLiveCometDockArmed({ ...armedInput, perfectDockReady: false })).toBe(false);
  });
});
