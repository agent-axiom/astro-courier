import {
  HAZARD_THREAD_SPEED_THRESHOLD,
  calculateHazardSkimStyleBonus,
  calculateHazardThreadStyleBonus
} from "@astro-courier/simulation";

export type HazardPressureInput = {
  hazardDangerLevel?: "near" | "inside";
  hazardDistance?: number;
  hazardSeverity?: number;
  styleMultiplier?: number;
  speed?: number;
  trajectoryRiskLevel?: "near" | "inside";
  trajectoryRiskSeconds?: number;
  gravitySlingDistance?: number;
  gravitySlingReady?: boolean;
  gravitySlingSpeedThreshold?: number;
  gravitySlingStyleBonus?: number;
  cargoDamage?: number;
};

export type HazardPressureReadout = {
  label: "Risk pulse";
  value: string;
  tone: "opportunity" | "warning" | "danger";
};

export function buildHazardPressureReadout(input: HazardPressureInput): HazardPressureReadout | undefined {
  if (!input.hazardDangerLevel) {
    return buildTrajectoryRiskPressureReadout(input) ?? buildGravitySlingPressureReadout(input);
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
  const fastSkim = (input.speed ?? 0) >= HAZARD_THREAD_SPEED_THRESHOLD;
  if (cargoDamage <= 0.02 && input.hazardSeverity !== undefined) {
    const multiplier = Math.max(1, input.styleMultiplier ?? 1);
    const basePayout = fastSkim
      ? calculateHazardThreadStyleBonus(input.hazardSeverity)
      : calculateHazardSkimStyleBonus(input.hazardSeverity);
    const payout = Math.round(basePayout * multiplier);
    const label = fastSkim ? "Thread" : "Skim";
    const multiplierSuffix = multiplier > 1 ? ` / x${multiplier.toFixed(2)}` : "";
    const distanceSuffix = input.hazardDistance === undefined ? "" : ` / ${Math.round(input.hazardDistance)}m`;
    if (!fastSkim && input.speed !== undefined) {
      return {
        label: "Risk pulse",
        value: `Thread ${HAZARD_THREAD_SPEED_THRESHOLD}+ / Skim +${payout}${multiplierSuffix}${distanceSuffix}`,
        tone: "opportunity"
      };
    }
    return {
      label: "Risk pulse",
      value: `${label} +${payout}${multiplierSuffix}${distanceSuffix}`,
      tone: "opportunity"
    };
  }

  return {
    label: "Risk pulse",
    value: cargoDamage <= 0.02 ? `${fastSkim ? "Thread" : "Skim"} window${distance}` : `Keep wide${distance}`,
    tone: cargoDamage <= 0.02 ? "opportunity" : "warning"
  };
}

function buildGravitySlingPressureReadout(input: HazardPressureInput): HazardPressureReadout | undefined {
  if (input.gravitySlingDistance === undefined || (input.cargoDamage ?? 0) > 0.02) {
    return undefined;
  }

  const distanceSuffix = ` / ${Math.round(input.gravitySlingDistance)}m`;
  if (input.gravitySlingReady && input.gravitySlingStyleBonus !== undefined) {
    const multiplier = Math.max(1, input.styleMultiplier ?? 1);
    const payout = Math.round(input.gravitySlingStyleBonus * multiplier);
    const multiplierSuffix = multiplier > 1 ? ` / x${multiplier.toFixed(2)}` : "";
    return {
      label: "Risk pulse",
      value: `Sling +${payout}${multiplierSuffix}${distanceSuffix}`,
      tone: "opportunity"
    };
  }

  const speedCall = input.gravitySlingSpeedThreshold === undefined ? "Sling window" : `Sling ${input.gravitySlingSpeedThreshold}+ speed`;
  return {
    label: "Risk pulse",
    value: `${speedCall}${distanceSuffix}`,
    tone: "opportunity"
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
  const fastThread = (input.speed ?? 0) >= HAZARD_THREAD_SPEED_THRESHOLD;
  return {
    label: "Risk pulse",
    value: cargoDamage <= 0.02 ? `${fastThread ? "Thread" : "Skim"} vector ${eta}` : `Hazard vector ${eta}`,
    tone: cargoDamage <= 0.02 ? "opportunity" : "warning"
  };
}
