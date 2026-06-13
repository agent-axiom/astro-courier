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
