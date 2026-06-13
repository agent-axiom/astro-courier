export type ResultStatsInput = {
  score: number;
  elapsedSeconds: number;
  cargoIntegrity: number;
};

export type ResultStat = {
  label: "Score" | "Time" | "Cargo";
  value: string;
};

export function buildResultStats(input: ResultStatsInput): ResultStat[] {
  return [
    { label: "Score", value: `${input.score}` },
    { label: "Time", value: `${input.elapsedSeconds.toFixed(1)}s` },
    { label: "Cargo", value: `${Math.round(Math.max(0, input.cargoIntegrity) * 100)}%` }
  ];
}
