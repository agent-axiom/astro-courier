import { describe, expect, it } from "vitest";
import { buildDailyShare } from "./dailyShare";

describe("daily share", () => {
  it("stays hidden outside the active daily dispatch", () => {
    expect(
      buildDailyShare({
        dispatch: { contractId: "asteroid-sprint", seed: "daily-2026-06-21-asteroid-sprint", label: "Daily dispatch" },
        contractId: "first-light-delivery",
        contractTitle: "First Light Delivery",
        status: "delivered",
        medal: "gold",
        score: 1200,
        elapsedSeconds: 18.4,
        isNewBest: false,
        url: "https://example.test"
      })
    ).toBeUndefined();
  });

  it("builds a compact visible summary and share text for daily clears", () => {
    expect(
      buildDailyShare({
        dispatch: { contractId: "asteroid-sprint", seed: "daily-2026-06-21-asteroid-sprint", label: "Daily dispatch" },
        contractId: "asteroid-sprint",
        contractTitle: "Asteroid Sprint",
        status: "delivered",
        medal: "comet",
        score: 1432,
        elapsedSeconds: 16.8,
        isNewBest: true,
        url: "https://example.test"
      })
    ).toEqual({
      label: "Daily share",
      value: "Comet 1,432",
      detail: "16.8s / PB",
      tone: "comet",
      text: "Astro Courier daily: Asteroid Sprint\nComet - 16.8s - 1,432 pts - PB\nhttps://example.test"
    });
  });

  it("keeps failed daily summaries short", () => {
    expect(
      buildDailyShare({
        dispatch: { contractId: "asteroid-sprint", seed: "daily-2026-06-21-asteroid-sprint", label: "Daily dispatch" },
        contractId: "asteroid-sprint",
        contractTitle: "Asteroid Sprint",
        status: "crashed",
        medal: "none",
        score: 312,
        elapsedSeconds: 11.2,
        isNewBest: false,
        url: "https://example.test"
      })
    ).toMatchObject({
      value: "Failed 312",
      detail: "11.2s",
      tone: "failed"
    });
  });
});
