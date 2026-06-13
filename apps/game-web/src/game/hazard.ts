import { calculateHazardSkimStyleBonus } from "@astro-courier/simulation";

export type HazardPressureInput = {
  hazardDangerLevel?: "near" | "inside";
  hazardDistance?: number;
  hazardSeverity?: number;
  styleMultiplier?: number;
  trajectoryRiskLevel?: "near" | "inside";
  trajectoryRiskSeconds?: number;
  cargoDamage?: number;
};

export type HazardPressureReadout = {
  label: "Risk pulse";
  value: string;
  tone: "opportunity" | "warning" | "danger";
};

export function buildHazardPressureReadout(input: HazardPressureInput): HazardPressureReadout | undefined {
  if (!input.hazardDangerLevel) {
    return buildTrajectoryRiskPressureReadout(input);
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
    const multiplier = Math.max(1, input.styleMultiplier ?? 1);
    const payout = Math.round(calculateHazardSkimStyleBonus(input.hazardSeverity) * multiplier);
    const multiplierSuffix = multiplier > 1 ? ` / x${multiplier.toFixed(2)}` : "";
    const distanceSuffix = input.hazardDistance === undefined ? "" : ` / ${Math.round(input.hazardDistance)}m`;
    return {
      label: "Risk pulse",
      value: `Skim +${payout}${multiplierSuffix}${distanceSuffix}`,
      tone: "opportunity"
    };
  }

  return {
    label: "Risk pulse",
    value: cargoDamage <= 0.02 ? `Skim window${distance}` : `Keep wide${distance}`,
    tone: cargoDamage <= 0.02 ? "opportunity" : "warning"
  };
}

function buildTrajectoryRiskPressureReadout(input: HazardPressureInput): HazardPressureReadout | undefined {
  if (!input.trajectoryRiskLevel) {
    return undefined;
  }

  const eta = input.trajectoryRiskSeconds === undefined ? "soon" : `${input.trajectoryRiskSeconds.toFixed(1)}s`;
  if (input.trajectoryRiskLevel === "inside") {
    return {
      label: "Risk pulse",
      value: `Collision vector ${eta}`,
      tone: "danger"
    };
  }

  const cargoDamage = input.cargoDamage ?? 0;
  return {
    label: "Risk pulse",
    value: cargoDamage <= 0.02 ? `Skim vector ${eta}` : `Hazard vector ${eta}`,
    tone: cargoDamage <= 0.02 ? "opportunity" : "warning"
  };
}
