import { calculateHazardSkimStyleBonus } from "@astro-courier/simulation";

export type HazardPressureInput = {
  hazardDangerLevel?: "near" | "inside";
  hazardDistance?: number;
  hazardSeverity?: number;
  cargoDamage?: number;
};

export type HazardPressureReadout = {
  label: "Risk pulse";
  value: string;
  tone: "opportunity" | "warning" | "danger";
};

export function buildHazardPressureReadout(input: HazardPressureInput): HazardPressureReadout | undefined {
  if (!input.hazardDangerLevel) {
    return undefined;
  }

  const distance = input.hazardDistance === undefined ? "" : ` ${Math.round(input.hazardDistance)}m`;
  if (input.hazardDangerLevel === "inside") {
    return {
      label: "Risk pulse",
      value: `Exit field${distance}`,
      tone: "danger"
    };
  }

  const cargoDamage = input.cargoDamage ?? 0;
  if (cargoDamage <= 0.02 && input.hazardSeverity !== undefined) {
    const payout = calculateHazardSkimStyleBonus(input.hazardSeverity);
    const distanceSuffix = input.hazardDistance === undefined ? "" : ` / ${Math.round(input.hazardDistance)}m`;
    return {
      label: "Risk pulse",
      value: `Skim +${payout}${distanceSuffix}`,
      tone: "opportunity"
    };
  }

  return {
    label: "Risk pulse",
    value: cargoDamage <= 0.02 ? `Skim window${distance}` : `Keep wide${distance}`,
    tone: cargoDamage <= 0.02 ? "opportunity" : "warning"
  };
}
