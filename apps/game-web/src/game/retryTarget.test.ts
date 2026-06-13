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
});

describe("result retry action copy", () => {
  it("turns failed runs into a direct route retry", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Complete delivery", tone: "danger" })).toEqual({
      label: "Retry Route",
      mode: "restart-run"
    });
  });

  it("turns personal best defense into a stronger call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Defend 3520 / 24.1s", tone: "success" })).toEqual({
      label: "Defend PB",
      mode: "restart-run"
    });
  });

  it("turns personal best gaps into a chase call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Find +330 score", tone: "chase" })).toEqual({
      label: "Chase PB",
      mode: "restart-run"
    });
  });

  it("turns repeatable style targets into a repeat-line call to action", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Repeat Chain Finish", tone: "opportunity" })).toEqual({
      label: "Repeat Line",
      mode: "restart-run"
    });
  });

  it("keeps route improvement opportunities readable", () => {
    expect(buildResultRetryAction({ label: "Retry target", value: "Chase Express Finish", tone: "opportunity" })).toEqual({
      label: "Run Again",
      mode: "restart-run"
    });
  });
});

describe("result retry action briefing", () => {
  it("turns personal best defense into a high-confidence rematch hook", () => {
    expect(
      buildRetryActionBriefing(
        { label: "Defend PB", mode: "restart-run" },
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
        { label: "Chase PB", mode: "restart-run" },
        { label: "Retry target", value: "Find +330 score", tone: "chase" }
      )
    ).toEqual({
      label: "Next run",
      value: "Route has score left",
      tone: "chase"
    });
    expect(
      buildRetryActionBriefing(
        { label: "Repeat Line", mode: "restart-run" },
        { label: "Retry target", value: "Repeat Chain Finish", tone: "opportunity" }
      )
    ).toEqual({
      label: "Next run",
      value: "Lock the style route",
      tone: "opportunity"
    });
  });

  it("keeps failed retries focused on the repair target", () => {
    expect(
      buildRetryActionBriefing(
        { label: "Retry Route", mode: "restart-run" },
        { label: "Retry target", value: "Clear asteroid field", tone: "danger" }
      )
    ).toEqual({
      label: "Next run",
      value: "Fix the failure point",
      tone: "danger"
    });
  });
});
