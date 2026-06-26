export type LeaderboardEntrySummary = {
  displayName: string;
  score: number;
  elapsedSeconds: number;
};

export type LeaderboardTeaser = {
  label: "Leaderboard";
  value: string;
  detail: string;
  tone: "empty" | "chase" | "lead";
};

export function buildLeaderboardTeaser(input: {
  entries: readonly LeaderboardEntrySummary[] | undefined;
  currentScore?: number;
}): LeaderboardTeaser {
  const top = input.entries?.[0];
  if (!top) {
    return { label: "Leaderboard", value: "First board", detail: "Post a run", tone: "empty" };
  }

  if ((input.currentScore ?? 0) > top.score) {
    return { label: "Leaderboard", value: "You lead", detail: `${top.displayName} ${top.score}`, tone: "lead" };
  }

  return { label: "Leaderboard", value: `Top ${top.score}`, detail: `Beat ${top.elapsedSeconds.toFixed(1)}s`, tone: "chase" };
}
