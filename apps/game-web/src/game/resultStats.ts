import type { ScoreBreakdown } from "@astro-courier/shared";

export type ResultStatsInput = {
  score: number;
  elapsedSeconds: number;
  cargoIntegrity: number;
};

export type ResultStat = {
  label: "Score" | "Time" | "Cargo";
  value: string;
};

export type ResultHighlight = {
  label: "Run highlight";
  value: string;
  tone: "pace" | "efficiency" | "cargo" | "precision" | "style" | "danger";
};

export function buildResultStats(input: ResultStatsInput): ResultStat[] {
  return [
    { label: "Score", value: `${input.score}` },
    { label: "Time", value: `${input.elapsedSeconds.toFixed(1)}s` },
    { label: "Cargo", value: `${Math.round(Math.max(0, input.cargoIntegrity) * 100)}%` }
  ];
}

export function buildResultHighlight(breakdown: ScoreBreakdown): ResultHighlight | undefined {
  const candidates = [
    { label: "Style", value: breakdown.styleBonus, tone: "style" },
    { label: "Danger", value: breakdown.dangerBonus, tone: "danger" },
    { label: "Landing", value: breakdown.landingBonus, tone: "precision" },
    { label: "Cargo", value: breakdown.cargoBonus, tone: "cargo" },
    { label: "Fuel", value: breakdown.fuelBonus, tone: "efficiency" },
    { label: "Pace", value: breakdown.paceBonus, tone: "pace" }
  ] satisfies Array<{ label: string; value: number; tone: ResultHighlight["tone"] }>;
  const [winner] = candidates.filter((candidate) => candidate.value > 0).sort((left, right) => right.value - left.value);

  if (!winner) {
    return undefined;
  }

  return {
    label: "Run highlight",
    value: `${winner.label} +${Math.round(winner.value)}`,
    tone: winner.tone
  };
}
