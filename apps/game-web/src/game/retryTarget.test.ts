import { describe, expect, it } from "vitest";
import { buildRetryTarget } from "./retryTarget";

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
});
