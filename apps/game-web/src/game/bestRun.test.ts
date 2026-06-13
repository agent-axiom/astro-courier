import { describe, expect, it } from "vitest";
import { getBestRun, recordBestRun } from "./bestRun";

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

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
