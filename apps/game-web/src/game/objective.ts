import { EXPRESS_FINISH_STYLE_BONUS } from "@astro-courier/simulation";
import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";
import type { ContractPaceTier } from "./pace";

export type ObjectiveDirectiveInput = {
  objectivePhase: ObjectivePhase;
  pickupLabel: string;
  destinationLabel: string;
  lastMilestone?: string;
  paceTier?: ContractPaceTier;
  paceSecondsRemaining?: number;
  cargoDamage?: number;
};

export type ObjectiveDirective = {
  label: "Pickup" | "Pickup first" | "Deliver" | "Express finish" | "Complete";
  value: string;
};

export type ObjectiveInterceptReadoutInput = {
  status: RunStatus;
  targetDistance?: number;
  speed: number;
  landingStatus?: LandingGuidanceStatus;
};

export type ObjectiveInterceptReadout = {
  label: "Intercept";
  value: string;
  tone: "fast" | "steady" | "slow" | "hold";
};

export type ExpressFinishReadoutInput = {
  objectivePhase: ObjectivePhase;
  paceTier?: ContractPaceTier;
  paceSecondsRemaining?: number;
  cargoDamage?: number;
};

export type ExpressFinishReadout = {
  label: "Finish window";
  value: string;
  tone: "open" | "urgent";
};

export type TacticalCueInput = {
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
  trajectoryRiskSeconds?: number;
  landingStatus?: LandingGuidanceStatus;
  paceTier?: ContractPaceTier;
  paceSecondsRemaining?: number;
  cargoDamage?: number;
  quickPickupSecondsRemaining?: number;
  quickPickupBonus?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type TacticalCue = {
  label: "Tactical cue";
  value: string;
  tone: "danger" | "urgent" | "opportunity";
};

export function buildObjectiveDirective(input: ObjectiveDirectiveInput): ObjectiveDirective {
  if (input.objectivePhase === "complete") {
    return {
      label: "Complete",
      value: "Cargo delivered"
    };
  }

  if (input.objectivePhase === "delivery") {
    if (input.paceTier === "gold" && (input.paceSecondsRemaining ?? 0) > 0 && (input.cargoDamage ?? 0) <= 0.02) {
      return {
        label: "Express finish",
        value: `${input.destinationLabel} / ${(input.paceSecondsRemaining ?? 0).toFixed(1)}s`
      };
    }

    return {
      label: "Deliver",
      value: input.destinationLabel
    };
  }

  return {
    label: input.lastMilestone === "Pickup Required" ? "Pickup first" : "Pickup",
    value: input.pickupLabel
  };
}

export function buildExpressFinishReadout(input: ExpressFinishReadoutInput): ExpressFinishReadout | undefined {
  const secondsRemaining = input.paceSecondsRemaining ?? 0;
  if (
    input.objectivePhase !== "delivery" ||
    input.paceTier !== "gold" ||
    secondsRemaining <= 0 ||
    (input.cargoDamage ?? 0) > 0.02
  ) {
    return undefined;
  }

  const timeLabel = `${secondsRemaining.toFixed(1)}s`;
  if (secondsRemaining <= 4) {
    return {
      label: "Finish window",
      value: `Close now / +${EXPRESS_FINISH_STYLE_BONUS} / ${timeLabel}`,
      tone: "urgent"
    };
  }

  return {
    label: "Finish window",
    value: `Express +${EXPRESS_FINISH_STYLE_BONUS} / ${timeLabel}`,
    tone: "open"
  };
}

export function buildObjectiveInterceptReadout(
  input: ObjectiveInterceptReadoutInput
): ObjectiveInterceptReadout | undefined {
  if (input.targetDistance === undefined || input.status === "delivered" || input.status === "crashed") {
    return undefined;
  }

  if (input.landingStatus === "ready") {
    return {
      label: "Intercept",
      value: "Dock now",
      tone: "fast"
    };
  }

  if (input.landingStatus === "too-fast") {
    return {
      label: "Intercept",
      value: "Brake",
      tone: "hold"
    };
  }

  if (input.landingStatus === "misaligned") {
    return {
      label: "Intercept",
      value: "Align nose",
      tone: "steady"
    };
  }

  if (input.speed < 1) {
    return {
      label: "Intercept",
      value: "Build speed",
      tone: "hold"
    };
  }

  const etaSeconds = Math.max(0, input.targetDistance / input.speed);
  return {
    label: "Intercept",
    value: `ETA ${etaSeconds.toFixed(1)}s`,
    tone: etaSeconds <= 8 ? "fast" : etaSeconds <= 20 ? "steady" : "slow"
  };
}

export function buildTacticalCue(input: TacticalCueInput): TacticalCue | undefined {
  if (input.status !== "flying") {
    return undefined;
  }

  if (input.hazardDangerLevel === "inside") {
    return {
      label: "Tactical cue",
      value: "Exit hazard field",
      tone: "danger"
    };
  }

  if (input.trajectoryRiskLevel === "inside") {
    return {
      label: "Tactical cue",
      value: `Evade vector / ${formatSeconds(input.trajectoryRiskSeconds)}`,
      tone: "danger"
    };
  }

  if (input.landingStatus === "too-fast") {
    return {
      label: "Tactical cue",
      value: "Brake before dock",
      tone: "danger"
    };
  }

  const chainSecondsRemaining = input.styleChainSecondsRemaining ?? 0;
  const urgentStyleChain = (input.styleMultiplier ?? 1) > 1 && chainSecondsRemaining > 0 && chainSecondsRemaining <= 1;
  if (urgentStyleChain) {
    return {
      label: "Tactical cue",
      value: `Save chain / ${formatSeconds(input.styleChainSecondsRemaining)}`,
      tone: "urgent"
    };
  }

  if (isCleanGoldDelivery(input) && (input.paceSecondsRemaining ?? 0) <= 4) {
    return {
      label: "Tactical cue",
      value: `Close express / +${EXPRESS_FINISH_STYLE_BONUS} / ${formatSeconds(input.paceSecondsRemaining)}`,
      tone: "opportunity"
    };
  }

  const quickPickupSecondsRemaining = input.quickPickupSecondsRemaining ?? 0;
  const quickPickupBonus = input.quickPickupBonus ?? 0;
  if (input.objectivePhase === "pickup" && quickPickupSecondsRemaining > 0 && quickPickupBonus > 0) {
    return {
      label: "Tactical cue",
      value: `Rush pickup / +${Math.round(quickPickupBonus)} / ${formatSeconds(quickPickupSecondsRemaining)}`,
      tone: "opportunity"
    };
  }

  return undefined;
}

function isCleanGoldDelivery(input: TacticalCueInput): boolean {
  return (
    input.objectivePhase === "delivery" &&
    input.paceTier === "gold" &&
    (input.paceSecondsRemaining ?? 0) > 0 &&
    (input.cargoDamage ?? 0) <= 0.02
  );
}

function formatSeconds(seconds?: number): string {
  return `${(seconds ?? 0).toFixed(1)}s`;
}
