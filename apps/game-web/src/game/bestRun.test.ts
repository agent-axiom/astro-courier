import { describe, expect, it } from "vitest";
import {
  buildBestRunChase,
  buildBestRunDelta,
  buildContractMasteryBadge,
  buildContractBestRunLabel,
  buildLiveBestPace,
  buildRouteBoardMastery,
  buildRouteBoardRecommendationBadge,
  buildRouteBoardProgress,
  buildRouteBoardSelectionAction,
  buildRouteBoardTarget,
  getBestRun,
  recordBestRun
} from "./bestRun";

describe("personal best run storage", () => {
  it("stores a first delivered run as the personal best", () => {
    const storage = new MemoryStorage();

    const result = recordBestRun(storage, "starter", {
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver"
    });

    expect(result.isNewBest).toBe(true);
    expect(getBestRun(storage, "starter")).toEqual({
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver"
    });
  });

  it("keeps the previous best unless score improves or the tie is faster", () => {
    const storage = new MemoryStorage();

    recordBestRun(storage, "starter", {
      score: 1400,
      elapsedSeconds: 39,
      medal: "gold"
    });

    expect(recordBestRun(storage, "starter", { score: 1300, elapsedSeconds: 35, medal: "gold" }).isNewBest).toBe(false);
    expect(recordBestRun(storage, "starter", { score: 1400, elapsedSeconds: 41, medal: "gold" }).isNewBest).toBe(false);
    expect(recordBestRun(storage, "starter", { score: 1400, elapsedSeconds: 37, medal: "gold" }).isNewBest).toBe(true);
    expect(getBestRun(storage, "starter")?.elapsedSeconds).toBe(37);
  });

  it("stores a sampled ghost trail with the personal best", () => {
    const storage = new MemoryStorage();

    recordBestRun(storage, "starter", {
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver",
      ghostTrail: [
        { x: 180, y: 20 },
        { x: 220.25, y: -12.5 },
        { x: 420, y: -140 }
      ]
    });

    expect(getBestRun(storage, "starter")).toEqual({
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver",
      ghostTrail: [
        { x: 180, y: 20 },
        { x: 220.25, y: -12.5 },
        { x: 420, y: -140 }
      ]
    });
  });
});

describe("personal best chase copy", () => {
  it("invites the player to set an initial personal best", () => {
    expect(buildBestRunChase(undefined)).toEqual({
      label: "First clear",
      value: "Sets personal best",
      tone: "empty"
    });
  });

  it("formats an existing personal best as a chase target", () => {
    expect(buildBestRunChase({ score: 3290, elapsedSeconds: 24.667, medal: "gold" })).toEqual({
      label: "PB target",
      value: "3290 / 24.7s",
      tone: "target"
    });
  });

  it("calls out when a saved personal best has a ghost route loaded", () => {
    expect(
      buildBestRunChase({
        score: 3290,
        elapsedSeconds: 24.667,
        medal: "gold",
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 12, y: -4 }
        ]
      })
    ).toEqual({
      label: "PB ghost",
      value: "3290 / 24.7s trail",
      tone: "target"
    });
  });
});

describe("contract option personal best copy", () => {
  it("marks unplayed contracts as open personal best slots", () => {
    expect(buildContractBestRunLabel(undefined)).toBe("PB open");
  });

  it("formats saved contract personal bests compactly", () => {
    expect(buildContractBestRunLabel({ score: 3290, elapsedSeconds: 24.667, medal: "gold" })).toBe("PB 3290 / 24.7s");
  });

  it("marks saved contract personal bests with replay trails as ghost routes", () => {
    expect(
      buildContractBestRunLabel({
        score: 3290,
        elapsedSeconds: 24.667,
        medal: "gold",
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 12, y: -4 }
        ]
      })
    ).toBe("Ghost 3290 / 24.7s");
  });
});

describe("contract option mastery badge copy", () => {
  it("marks unplayed contracts as open route slots", () => {
    expect(buildContractMasteryBadge(undefined)).toEqual({ label: "Mastery", value: "Open", tone: "open" });
  });

  it("marks non-comet clears as cleared routes", () => {
    expect(buildContractMasteryBadge({ score: 2400, elapsedSeconds: 31.4, medal: "gold" })).toEqual({
      label: "Mastery",
      value: "Cleared",
      tone: "cleared"
    });
  });

  it("marks comet clears as mastered routes", () => {
    expect(buildContractMasteryBadge({ score: 3600, elapsedSeconds: 19.8, medal: "comet" })).toEqual({
      label: "Mastery",
      value: "Comet",
      tone: "comet"
    });
  });
});

describe("route board progress copy", () => {
  const contracts = [{ id: "first-light-delivery" }, { id: "return-leg" }, { id: "asteroid-sprint" }, { id: "gravity-slingshot" }];

  it("counts cleared routes, ghost routes, and comet clears across the contract board", () => {
    expect(
      buildRouteBoardProgress(contracts, {
        "first-light-delivery": {
          score: 1800,
          elapsedSeconds: 34.2,
          medal: "silver",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 24, y: -8 }
          ]
        },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
        "asteroid-sprint": undefined,
        "gravity-slingshot": undefined
      })
    ).toEqual([
      { label: "Routes cleared", value: "2/4", tone: "progress" },
      { label: "Ghost routes", value: "1/4", tone: "progress" },
      { label: "Comet clears", value: "1/4", tone: "mastery" }
    ]);
  });

  it("marks a fully mastered board distinctly", () => {
    expect(
      buildRouteBoardProgress(contracts, {
        "first-light-delivery": { score: 3200, elapsedSeconds: 22.4, medal: "comet" },
        "return-leg": { score: 3100, elapsedSeconds: 23.1, medal: "comet" },
        "asteroid-sprint": { score: 3500, elapsedSeconds: 21.8, medal: "comet" },
        "gravity-slingshot": { score: 3300, elapsedSeconds: 20.9, medal: "comet" }
      })
    ).toEqual([
      { label: "Routes cleared", value: "4/4", tone: "complete" },
      { label: "Ghost routes", value: "0/4", tone: "open" },
      { label: "Comet clears", value: "4/4", tone: "complete" }
    ]);
  });
});

describe("route board mastery copy", () => {
  const contracts = [{ id: "first-light-delivery" }, { id: "return-leg" }, { id: "asteroid-sprint" }, { id: "gravity-slingshot" }];

  it("frames unopened boards as a route-clearing campaign", () => {
    expect(
      buildRouteBoardMastery(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "return-leg": undefined,
        "asteroid-sprint": undefined,
        "gravity-slingshot": undefined
      })
    ).toEqual({
      label: "Board mastery",
      value: "3 routes to clear",
      tone: "progress"
    });
  });

  it("switches to comet mastery once every route has a clear", () => {
    expect(
      buildRouteBoardMastery(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
        "asteroid-sprint": { score: 2400, elapsedSeconds: 35.5, medal: "gold" },
        "gravity-slingshot": { score: 2100, elapsedSeconds: 48.6, medal: "bronze" }
      })
    ).toEqual({
      label: "Board mastery",
      value: "3 comets to master",
      tone: "mastery"
    });
  });

  it("celebrates full comet sweeps", () => {
    expect(
      buildRouteBoardMastery(contracts, {
        "first-light-delivery": { score: 3200, elapsedSeconds: 22.4, medal: "comet" },
        "return-leg": { score: 3100, elapsedSeconds: 23.1, medal: "comet" },
        "asteroid-sprint": { score: 3500, elapsedSeconds: 21.8, medal: "comet" },
        "gravity-slingshot": { score: 3300, elapsedSeconds: 20.9, medal: "comet" }
      })
    ).toEqual({
      label: "Board mastery",
      value: "Full comet sweep",
      tone: "complete"
    });
  });
});

describe("route board next target copy", () => {
  const contracts = [
    { id: "first-light-delivery", title: "First Light" },
    { id: "return-leg", title: "Return Leg" },
    { id: "asteroid-sprint", title: "Asteroid Sprint" },
    { id: "gravity-slingshot", title: "Gravity Slingshot" }
  ];

  it("prioritizes the first route without any clear", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "return-leg": undefined,
        "asteroid-sprint": undefined,
        "gravity-slingshot": undefined
      })
    ).toEqual({ label: "Next clear", value: "Clear Return Leg", tone: "clear", contractId: "return-leg" });
  });

  it("switches to comet chase once every route is cleared", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
        "asteroid-sprint": { score: 2400, elapsedSeconds: 35.5, medal: "gold" },
        "gravity-slingshot": { score: 2100, elapsedSeconds: 48.6, medal: "bronze" }
      })
    ).toEqual({ label: "Comet chase", value: "Comet Asteroid Sprint", tone: "comet", contractId: "asteroid-sprint" });
  });

  it("keeps board order as the tie-breaker among equal comet chases", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "gold" },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "gold" },
        "asteroid-sprint": { score: 2400, elapsedSeconds: 35.5, medal: "silver" },
        "gravity-slingshot": { score: 2100, elapsedSeconds: 48.6, medal: "bronze" }
      })
    ).toEqual({ label: "Comet chase", value: "Comet First Light", tone: "comet", contractId: "first-light-delivery" });
  });

  it("celebrates a fully mastered route board", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": { score: 3200, elapsedSeconds: 22.4, medal: "comet" },
        "return-leg": { score: 3100, elapsedSeconds: 23.1, medal: "comet" },
        "asteroid-sprint": { score: 3500, elapsedSeconds: 21.8, medal: "comet" },
        "gravity-slingshot": { score: 3300, elapsedSeconds: 20.9, medal: "comet" }
      })
    ).toEqual({ label: "Board status", value: "Board mastered", tone: "complete" });
  });
});

describe("route board target selection action", () => {
  it("selects the recommended target when it differs from the current route", () => {
    expect(
      buildRouteBoardSelectionAction(
        { label: "Next clear", value: "Clear Return Leg", tone: "clear", contractId: "return-leg" },
        "first-light-delivery"
      )
    ).toEqual({ label: "Select target", contractId: "return-leg" });
  });

  it("stays passive when the current route is already the target", () => {
    expect(
      buildRouteBoardSelectionAction(
        { label: "Comet chase", value: "Comet Asteroid Sprint", tone: "comet", contractId: "asteroid-sprint" },
        "asteroid-sprint"
      )
    ).toBeUndefined();
  });

  it("stays passive after the full route board is mastered", () => {
    expect(buildRouteBoardSelectionAction({ label: "Board status", value: "Board mastered", tone: "complete" }, "gravity-slingshot")).toBeUndefined();
  });
});

describe("route board recommendation badge", () => {
  it("labels clear targets as the next recommended route", () => {
    expect(
      buildRouteBoardRecommendationBadge({
        label: "Next clear",
        value: "Clear Return Leg",
        tone: "clear",
        contractId: "return-leg"
      })
    ).toBe("Next");
  });

  it("labels chain relay clear targets as relay badges", () => {
    expect(
      buildRouteBoardRecommendationBadge({
        label: "Next clear",
        value: "Clear Chain Relay",
        tone: "clear",
        contractId: "chain-relay"
      })
    ).toBe("Relay");
  });

  it("labels comet targets as comet badges", () => {
    expect(
      buildRouteBoardRecommendationBadge({
        label: "Comet chase",
        value: "Comet Asteroid Sprint",
        tone: "comet",
        contractId: "asteroid-sprint"
      })
    ).toBe("Comet");
  });

  it("stays hidden once the route board is complete", () => {
    expect(buildRouteBoardRecommendationBadge({ label: "Board status", value: "Board mastered", tone: "complete" })).toBeUndefined();
  });
});

describe("personal best result delta copy", () => {
  it("stays hidden before a contract has any saved best", () => {
    expect(
      buildBestRunDelta({
        bestRun: undefined,
        run: { score: 1800, elapsedSeconds: 31.2, medal: "silver" },
        isNewBest: false
      })
    ).toBeUndefined();
  });

  it("celebrates a new personal best result", () => {
    expect(
      buildBestRunDelta({
        bestRun: { score: 2200, elapsedSeconds: 28.4, medal: "gold" },
        run: { score: 2200, elapsedSeconds: 28.4, medal: "gold" },
        isNewBest: true
      })
    ).toEqual({
      label: "PB delta",
      value: "New personal best",
      tone: "success"
    });
  });

  it("shows the score gap when the saved best is still ahead", () => {
    expect(
      buildBestRunDelta({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        run: { score: 3040, elapsedSeconds: 23.8, medal: "gold" },
        isNewBest: false
      })
    ).toEqual({
      label: "PB delta",
      value: "Need +250 score",
      tone: "chase"
    });
  });

  it("shows the time gap when the score is tied but the saved best is faster", () => {
    expect(
      buildBestRunDelta({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        run: { score: 3290, elapsedSeconds: 26.1, medal: "gold" },
        isNewBest: false
      })
    ).toEqual({
      label: "PB delta",
      value: "Need 1.4s faster",
      tone: "chase"
    });
  });

  it("recognizes an exact personal best match", () => {
    expect(
      buildBestRunDelta({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        run: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        isNewBest: false
      })
    ).toEqual({
      label: "PB delta",
      value: "Matched personal best",
      tone: "success"
    });
  });
});

describe("live personal best pace copy", () => {
  const ghostBestRun = {
    score: 3290,
    elapsedSeconds: 24.7,
    medal: "gold" as const,
    ghostTrail: [
      { x: 0, y: 0 },
      { x: 12, y: 8 }
    ]
  };

  it("stays hidden without a saved best or after the run has finished", () => {
    expect(buildLiveBestPace({ bestRun: undefined, elapsedSeconds: 12, status: "flying" })).toBeUndefined();
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        elapsedSeconds: 12,
        status: "delivered"
      })
    ).toBeUndefined();
  });

  it("shows time bank while the current run is ahead of the saved finish time", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        elapsedSeconds: 18.2,
        status: "flying"
      })
    ).toEqual({
      label: "PB pace",
      value: "6.5s bank",
      tone: "ahead"
    });
  });

  it("uses ghost chase copy when the saved best has a replay trail", () => {
    expect(
      buildLiveBestPace({
        bestRun: ghostBestRun,
        elapsedSeconds: 18.2,
        status: "flying"
      })
    ).toEqual({
      label: "Ghost chase",
      value: "6.5s ahead of ghost",
      tone: "ahead"
    });
  });

  it("uses ghost copy for live score leads and score gaps", () => {
    expect(
      buildLiveBestPace({
        bestRun: ghostBestRun,
        score: 3440,
        elapsedSeconds: 18.2,
        status: "flying"
      })
    ).toEqual({
      label: "Ghost chase",
      value: "+150 ghost lead",
      tone: "ahead"
    });
    expect(
      buildLiveBestPace({
        bestRun: ghostBestRun,
        score: 3040,
        elapsedSeconds: 27.1,
        status: "flying"
      })
    ).toEqual({
      label: "Ghost chase",
      value: "Need +250 vs ghost",
      tone: "behind"
    });
  });

  it("uses ghost clutch copy for live score leads near the dock", () => {
    expect(
      buildLiveBestPace({
        bestRun: ghostBestRun,
        score: 3440,
        elapsedSeconds: 22.4,
        targetDistance: 120,
        status: "flying"
      })
    ).toEqual({
      label: "Ghost clutch",
      value: "Defend ghost +150",
      tone: "clutch"
    });
  });

  it("prioritizes a live score lead over the saved finish time", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        score: 3440,
        elapsedSeconds: 18.2,
        status: "flying"
      })
    ).toEqual({
      label: "PB chase",
      value: "+150 score lead",
      tone: "ahead"
    });
  });

  it("turns a live score lead into a clutch defend cue near the dock", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        score: 3440,
        elapsedSeconds: 22.4,
        targetDistance: 120,
        status: "flying"
      })
    ).toEqual({
      label: "PB clutch",
      value: "Defend +150 into dock",
      tone: "clutch"
    });
  });

  it("shows overtime once the current run has passed the saved finish time", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        elapsedSeconds: 27.1,
        status: "paused"
      })
    ).toEqual({
      label: "PB pace",
      value: "2.4s over",
      tone: "behind"
    });
  });

  it("shows the live score gap once the run is behind the saved score and time", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        score: 3040,
        elapsedSeconds: 27.1,
        status: "flying"
      })
    ).toEqual({
      label: "PB chase",
      value: "Need +250 score",
      tone: "behind"
    });
  });
});

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
