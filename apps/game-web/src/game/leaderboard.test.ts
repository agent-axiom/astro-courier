import { describe, expect, it } from "vitest";

import { buildLeaderboardTeaser } from "./leaderboard";

describe("leaderboard teaser", () => {
  it("invites the first posted run when no entries exist", () => {
    expect(buildLeaderboardTeaser({ entries: [] })).toEqual({
      label: "Leaderboard",
      value: "First board",
      detail: "Post a run",
      tone: "empty"
    });
  });

  it("shows the top ghost target compactly", () => {
    expect(buildLeaderboardTeaser({ entries: [{ displayName: "Axiom", score: 4200, elapsedSeconds: 31.2 }] })).toEqual({
      label: "Leaderboard",
      value: "Top 4200",
      detail: "Beat 31.2s",
      tone: "chase"
    });
  });

  it("celebrates when the current score is ahead of the board", () => {
    expect(buildLeaderboardTeaser({ entries: [{ displayName: "Axiom", score: 4200, elapsedSeconds: 31.2 }], currentScore: 4300 })).toEqual({
      label: "Leaderboard",
      value: "You lead",
      detail: "Axiom 4200",
      tone: "lead"
    });
  });
});
