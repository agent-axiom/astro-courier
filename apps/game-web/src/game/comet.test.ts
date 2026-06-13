import { describe, expect, it } from "vitest";
import { buildCometRunReadout } from "./comet";

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
        paceTier: "gold",
        fuel: 82,
        maxFuel: 100,
        cargoDamage: 0.01
      })
    ).toEqual({
      label: "Comet run",
      value: "Clean + reserve",
      tone: "live"
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
      value: "Reserve tight",
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
      tone: "lost"
    });
  });
});
