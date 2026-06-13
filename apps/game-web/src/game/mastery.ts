export type PreflightMasteryTargetInput = {
  goldSeconds: number;
};

export type PreflightMasteryTarget = {
  label: "Gold" | "Comet";
  value: string;
};

export function buildPreflightMasteryTargets(input: PreflightMasteryTargetInput): PreflightMasteryTarget[] {
  return [
    {
      label: "Gold",
      value: `${Math.round(input.goldSeconds)}s`
    },
    {
      label: "Comet",
      value: "Perfect + reserve"
    }
  ];
}
