import { describe, expect, it } from "vitest";
import { buildWeeklyChallenge, buildWeeklyChallengeAction } from "./weeklyChallenge";

const contracts = [
  {
    id: "first-light-delivery",
    title: "First Light",
    missionType: "delivery",
    difficultyTier: "standard"
  },
  {
    id: "interceptor-swarm",
    title: "Interceptor Swarm",
    missionType: "combat",
    difficultyTier: "hard"
  },
  {
    id: "black-forge-capture",
    title: "Black Forge Capture",
    missionType: "raid",
    difficultyTier: "boss"
  }
];

describe("weekly challenge", () => {
  it("selects a stable weekly route from harder contracts", () => {
    const challenge = buildWeeklyChallenge({ contracts, now: new Date("2026-06-21T12:00:00Z") });

    expect(challenge).toMatchObject({
      label: "Weekly challenge",
      contractId: "black-forge-capture",
      value: "Black Forge Capture",
      seed: "weekly-2026-06-15-black-forge-capture",
      tone: "raid"
    });
  });

  it("rotates on the following UTC week", () => {
    expect(buildWeeklyChallenge({ contracts, now: new Date("2026-06-28T12:00:00Z") })?.contractId).toBe("interceptor-swarm");
  });

  it("builds a compact action only when another route is active", () => {
    const challenge = buildWeeklyChallenge({ contracts, now: new Date("2026-06-21T12:00:00Z") });

    expect(buildWeeklyChallengeAction(challenge, "first-light-delivery")).toEqual({
      label: "Open weekly",
      contractId: "black-forge-capture"
    });
    expect(buildWeeklyChallengeAction(challenge, "black-forge-capture")).toBeUndefined();
  });
});
