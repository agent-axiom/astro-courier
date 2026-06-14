import { describe, expect, it } from "vitest";
import { buildResultRetryAction, buildRetryActionBriefing, buildRetryTarget } from "./retryTarget";

describe("result retry target", () => {
  it("asks crashed runs to finish the delivery first", () => {
    expect(
      buildRetryTarget({
        status: "crashed",
        medal: "none",
        elapsedSeconds: 14.2,
        goldSeconds: 30,
        score: 0,
        isNewBest: false,
        bestRun: { score: 2200, elapsedSeconds: 27.4, medal: "gold" }
      })
    ).toEqual({
      label: "Retry target",
      value: "Complete delivery",
      tone: "danger"
    });
  });

  it("turns hard landing failures into a concrete dock-speed target", () => {
    expect(
      buildRetryTarget({
        status: "crashed",
        crashReason: "Hard Landing",
        targetAllowedSpeed: 38,
        medal: "none",
        elapsedSeconds: 14.2,
        goldSeconds: 30,
        score: 0,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Dock under 38.0",
      tone: "danger"
    });
  });

  it("turns hull collisions into a concrete gravity-well target", () => {
    expect(
      buildRetryTarget({
        status: "crashed",
        crashReason: "Hull Collision",
        medal: "none",
        elapsedSeconds: 14.2,
        goldSeconds: 30,
        score: 0,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Clear gravity well",
      tone: "danger"
    });
  });

  it("turns gravity route hull collisions into a sling-lane target", () => {
    expect(
      buildRetryTarget({
        status: "crashed",
        contractId: "gravity-slingshot",
        crashReason: "Hull Collision",
        medal: "none",
        elapsedSeconds: 14.2,
        goldSeconds: 30,
        score: 0,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Hold outer sling lane",
      tone: "danger"
    });
  });

  it("turns asteroid sprint hull collisions into an asteroid-field target", () => {
    expect(
      buildRetryTarget({
        status: "crashed",
        contractId: "asteroid-sprint",
        crashReason: "Hull Collision",
        medal: "none",
        elapsedSeconds: 14.2,
        goldSeconds: 30,
        score: 0,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Clear asteroid field",
      tone: "danger"
    });
  });

  it("turns chain relay hull collisions into a relay-lane target", () => {
    expect(
      buildRetryTarget({
        status: "crashed",
        contractId: "chain-relay",
        crashReason: "Hull Collision",
        medal: "none",
        elapsedSeconds: 14.2,
        goldSeconds: 22,
        score: 0,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Clear relay lane",
      tone: "danger"
    });
  });

  it("turns a saved personal best score gap into a concrete score target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        elapsedSeconds: 25.8,
        goldSeconds: 30,
        score: 2960,
        isNewBest: false,
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" }
      })
    ).toEqual({
      label: "Retry target",
      value: "Find +330 score",
      tone: "chase"
    });
  });

  it("turns a tied score into a best-time target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        elapsedSeconds: 26.2,
        goldSeconds: 30,
        score: 3290,
        isNewBest: false,
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" }
      })
    ).toEqual({
      label: "Retry target",
      value: "Beat 24.7s",
      tone: "chase"
    });
  });

  it("asks new personal bests to defend the run", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        elapsedSeconds: 24.1,
        goldSeconds: 30,
        score: 3520,
        isNewBest: true,
        bestRun: { score: 3520, elapsedSeconds: 24.1, medal: "gold" }
      })
    ).toEqual({
      label: "Retry target",
      value: "Defend 3520 / 24.1s",
      tone: "success"
    });
  });

  it("falls back to the gold window when no personal best exists yet", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "silver",
        elapsedSeconds: 34.6,
        goldSeconds: 30,
        score: 1780,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Gold under 30.0s",
      tone: "opportunity"
    });
  });

  it("turns last-drop finishes into a repeatable clutch target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "silver",
        lastMilestone: "Last Drop",
        elapsedSeconds: 34.6,
        goldSeconds: 30,
        score: 2260,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Last Drop",
      tone: "opportunity"
    });
  });

  it("turns damage-control finishes into a repeatable recovery target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "silver",
        lastMilestone: "Damage Control",
        elapsedSeconds: 34.6,
        goldSeconds: 30,
        score: 2120,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Damage Control",
      tone: "opportunity"
    });
  });

  it("turns precision dock finishes into a repeatable approach target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Perfect Approach",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        score: 2780,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Perfect Approach",
      tone: "opportunity"
    });
  });

  it("turns chain finishes into a repeatable chain target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Chain Finish",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        score: 2940,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Chain Finish",
      tone: "opportunity"
    });
  });

  it("turns comet finishes into a repeatable elite target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "comet",
        lastMilestone: "Comet Finish",
        elapsedSeconds: 27.4,
        goldSeconds: 30,
        score: 3260,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Comet Finish",
      tone: "opportunity"
    });
  });

  it("turns gold comet near-misses into concrete comet chase targets", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Express Finish",
        elapsedSeconds: 27.4,
        goldSeconds: 30,
        cargoDamage: 0,
        fuel: 72,
        maxFuel: 100,
        landingBonus: 300,
        score: 3260,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Bank +3% fuel for comet",
      tone: "opportunity"
    });
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Express Finish",
        elapsedSeconds: 27.4,
        goldSeconds: 30,
        cargoDamage: 0,
        fuel: 82,
        maxFuel: 100,
        landingBonus: 120,
        score: 3260,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Perfect dock for comet",
      tone: "opportunity"
    });
  });

  it("turns launch bursts into a repeatable burst-chain target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Launch Burst",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        score: 2760,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Launch Burst",
      tone: "opportunity"
    });
  });

  it("turns assist and boost burns into repeatable burn-control targets", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "silver",
        lastMilestone: "Assist Burn",
        elapsedSeconds: 34.6,
        goldSeconds: 30,
        score: 2190,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Assist Burn",
      tone: "opportunity"
    });

    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "silver",
        lastMilestone: "Boost Burn",
        elapsedSeconds: 34.6,
        goldSeconds: 30,
        score: 2210,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Boost Burn",
      tone: "opportunity"
    });
  });

  it("turns quick pickups into a repeatable fast-load target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "silver",
        lastMilestone: "Quick Pickup",
        elapsedSeconds: 34.6,
        goldSeconds: 30,
        score: 2120,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Quick Pickup",
      tone: "opportunity"
    });
  });

  it("turns hazard and sling style hits into repeatable style targets", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "silver",
        lastMilestone: "Clean Hazard Skim",
        elapsedSeconds: 34.6,
        goldSeconds: 30,
        score: 2120,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Clean Hazard Skim",
      tone: "opportunity"
    });
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Needle Thread",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        score: 2860,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Needle Thread",
      tone: "opportunity"
    });
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Gravity Sling",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        score: 2860,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Gravity Sling",
      tone: "opportunity"
    });
  });

  it("turns no-brake finesse finishes into a repeatable finesse target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "silver",
        lastMilestone: "No Brake Finesse",
        elapsedSeconds: 34.6,
        goldSeconds: 30,
        score: 2210,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat No Brake Finesse",
      tone: "opportunity"
    });
  });

  it("turns danger-pay clears into a repeatable risk-line target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Express Finish",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        cargoDamage: 0,
        landingBonus: 300,
        score: 3120,
        scoreBreakdown: {
          base: 1000,
          paceBonus: 400,
          fuelBonus: 180,
          cargoBonus: 500,
          landingBonus: 300,
          styleBonus: 120,
          dangerBonus: 360,
          incidentPenalty: 0,
          total: 2660
        },
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Repeat Danger Pay",
      tone: "opportunity"
    });
  });

  it("turns scratched deliveries into a clean-cargo recovery target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Express Finish",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        cargoDamage: 0.05,
        score: 2520,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Restore clean cargo",
      tone: "opportunity"
    });
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Express Finish",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        cargoDamage: 0.01,
        score: 2520,
        isNewBest: false,
        bestRun: undefined
      })
    ).not.toEqual({
      label: "Retry target",
      value: "Restore clean cargo",
      tone: "opportunity"
    });
  });

  it("nudges return-leg gold clears without chain finish toward a chain target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        contractId: "return-leg",
        medal: "gold",
        lastMilestone: "Express Finish",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        score: 2520,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Carry Chain Finish",
      tone: "opportunity"
    });
  });

  it("nudges chain relay gold clears without chain finish toward a chain target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        contractId: "chain-relay",
        medal: "gold",
        lastMilestone: "Express Finish",
        elapsedSeconds: 21.8,
        goldSeconds: 22,
        score: 2760,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Carry Chain Finish",
      tone: "opportunity"
    });
  });

  it("nudges gold clears without express finish toward the express target", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Eco Drift",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        score: 2520,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Chase Express Finish",
      tone: "opportunity"
    });
  });

  it("nudges clean gold express clears without a perfect landing toward a perfect dock", () => {
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Express Finish",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        cargoDamage: 0,
        landingBonus: 120,
        score: 2520,
        isNewBest: false,
        bestRun: undefined
      })
    ).toEqual({
      label: "Retry target",
      value: "Perfect dock",
      tone: "opportunity"
    });
    expect(
      buildRetryTarget({
        status: "delivered",
        medal: "gold",
        lastMilestone: "Express Finish",
        elapsedSeconds: 28.4,
        goldSeconds: 30,
        cargoDamage: 0,
        landingBonus: 300,
        score: 2520,
        isNewBest: false,
        bestRun: undefined
      })
    ).not.toEqual({
      label: "Retry target",
      value: "Perfect dock",
      tone: "opportunity"
    });
  });
});

describe("result retry action copy", () => {
  it("turns failed runs into a direct route retry", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Complete delivery", tone: "danger" })).toEqual({
      label: "Retry Route",
      tone: "danger",
      mode: "restart-run"
    });
  });

  it("turns concrete failure targets into specific repair calls to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Dock under 38.0", tone: "danger" })).toEqual({
      label: "Fix Dock",
      tone: "danger",
      mode: "restart-run"
    });
    expect(buildResultRetryAction({ label: "Retry target", value: "Clear asteroid field", tone: "danger" })).toEqual({
      label: "Clear Lane",
      tone: "danger",
      mode: "restart-run"
    });
    expect(buildResultRetryAction({ label: "Retry target", value: "Hold outer sling lane", tone: "danger" })).toEqual({
      label: "Clear Lane",
      tone: "danger",
      mode: "restart-run"
    });
  });

  it("turns personal best defense into a stronger call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Defend 3520 / 24.1s", tone: "success" })).toEqual({
      label: "Defend PB",
      tone: "success",
      mode: "restart-run"
    });
  });

  it("turns personal best gaps into a chase call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Find +330 score", tone: "chase" })).toEqual({
      label: "Chase PB",
      tone: "chase",
      mode: "restart-run"
    });
  });

  it("turns repeatable style targets into a repeat-line call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Repeat Chain Finish", tone: "opportunity" })).toEqual({
      label: "Repeat Line",
      tone: "opportunity",
      mode: "restart-run"
    });
  });

  it("turns chain-finish setup targets into a chain-run call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Carry Chain Finish", tone: "opportunity" })).toEqual({
      label: "Chain Run",
      tone: "opportunity",
      mode: "restart-run"
    });
  });

  it("turns clean-cargo recovery into a specific clean-run call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Restore clean cargo", tone: "opportunity" })).toEqual({
      label: "Clean Run",
      tone: "opportunity",
      mode: "restart-run"
    });
  });

  it("turns medal, express, and first-PB opportunities into specific calls to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Gold under 24.0s", tone: "opportunity" })).toEqual({
      label: "Chase Gold",
      tone: "opportunity",
      mode: "restart-run"
    });
    expect(buildResultRetryAction({ label: "Retry target", value: "Chase Express Finish", tone: "opportunity" })).toEqual({
      label: "Express Run",
      tone: "opportunity",
      mode: "restart-run"
    });
    expect(buildResultRetryAction({ label: "Retry target", value: "Set first PB", tone: "opportunity" })).toEqual({
      label: "Set PB",
      tone: "opportunity",
      mode: "restart-run"
    });
  });

  it("turns perfect dock targets into a landing-focused call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Perfect dock", tone: "opportunity" })).toEqual({
      label: "Perfect Dock",
      tone: "opportunity",
      mode: "restart-run"
    });
  });

  it("turns comet near-miss targets into a comet chase call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Bank +3% fuel for comet", tone: "opportunity" })).toEqual({
      label: "Chase Comet",
      tone: "opportunity",
      mode: "restart-run"
    });
    expect(buildResultRetryAction({ label: "Retry target", value: "Perfect dock for comet", tone: "opportunity" })).toEqual({
      label: "Chase Comet",
      tone: "opportunity",
      mode: "restart-run"
    });
  });
});

describe("result retry action briefing", () => {
  it("turns personal best defense into a high-confidence rematch hook", () => {
    expect(
      buildRetryActionBriefing(
        { label: "Defend PB", tone: "success", mode: "restart-run" },
        { label: "Retry target", value: "Defend 3520 / 24.1s", tone: "success" }
      )
    ).toEqual({
      label: "Next run",
      value: "Protect the new line",
      tone: "success"
    });
  });

  it("turns chase and repeat actions into focused rematch hooks", () => {
    expect(
      buildRetryActionBriefing(
        { label: "Chase PB", tone: "chase", mode: "restart-run" },
        { label: "Retry target", value: "Find +330 score", tone: "chase" }
      )
    ).toEqual({
      label: "Next run",
      value: "Route has score left",
      tone: "chase"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Repeat Line", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Repeat Chain Finish", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Lock the style route",
      tone: "opportunity"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Repeat Line", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Repeat Danger Pay", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Lock the risk line",
      tone: "opportunity"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Repeat Line", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Repeat Assist Burn", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Lock burn control",
      tone: "opportunity"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Chain Run", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Carry Chain Finish", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Carry the chain home",
      tone: "opportunity"
    });
  });

  it("keeps failed retries focused on the repair target", () => {
    expect(
      buildRetryActionBriefing(
        { label: "Retry Route", tone: "danger", mode: "restart-run" },
        { label: "Retry target", value: "Clear asteroid field", tone: "danger" }
      )
    ).toEqual({
      label: "Next run",
      value: "Fix the failure point",
      tone: "danger"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Fix Dock", tone: "danger", mode: "restart-run" },
        { label: "Retry target", value: "Dock under 38.0", tone: "danger" }
      )
    ).toEqual({
      label: "Next run",
      value: "Feather final brake",
      tone: "danger"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Clear Lane", tone: "danger", mode: "restart-run" },
        { label: "Retry target", value: "Clear asteroid field", tone: "danger" }
      )
    ).toEqual({
      label: "Next run",
      value: "Widen the route line",
      tone: "danger"
    });
  });

  it("turns clean-cargo recovery targets into a no-scratch rematch hook", () => {
    expect(
      buildRetryActionBriefing(
        { label: "Run Again", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Restore clean cargo", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "No-scratch rematch",
      tone: "opportunity"
    });
  });

  it("turns medal, express, and first-PB actions into focused rematch hooks", () => {
    expect(
      buildRetryActionBriefing(
        { label: "Chase Gold", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Gold under 24.0s", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Convert medal pace",
      tone: "opportunity"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Express Run", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Chase Express Finish", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Cut the delivery split",
      tone: "opportunity"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Set PB", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Set first PB", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Bank the first line",
      tone: "opportunity"
    });
  });

  it("turns comet chase actions into elite rematch hooks", () => {
    expect(
      buildRetryActionBriefing(
        { label: "Chase Comet", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Bank +3% fuel for comet", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Coast +3% fuel",
      tone: "opportunity"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Chase Comet", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Perfect dock for comet", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Perfect final dock",
      tone: "opportunity"
    });
  });

  it("turns perfect dock actions into a final-brake rematch hook", () => {
    expect(
      buildRetryActionBriefing(
        { label: "Perfect Dock", tone: "opportunity", mode: "restart-run" },
        { label: "Retry target", value: "Perfect dock", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Feather the final brake",
      tone: "opportunity"
    });
  });
});
