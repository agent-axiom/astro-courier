import { describe, expect, it } from "vitest";
import { buildBestRunChase, buildBestRunDelta, buildLiveBestPace, getBestRun, recordBestRun } from "./bestRun";

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
