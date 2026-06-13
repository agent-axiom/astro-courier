import type { ObjectivePhase, RunStatus } from "@astro-courier/shared";

export type ObjectiveDirectiveInput = {
  objectivePhase: ObjectivePhase;
  pickupLabel: string;
  destinationLabel: string;
  lastMilestone?: string;
};

export type ObjectiveDirective = {
  label: "Pickup" | "Pickup first" | "Deliver" | "Complete";
  value: string;
};

export type ObjectiveInterceptReadoutInput = {
  status: RunStatus;
  targetDistance?: number;
  speed: number;
};

export type ObjectiveInterceptReadout = {
  label: "Intercept";
  value: string;
  tone: "fast" | "steady" | "slow" | "hold";
};

export function buildObjectiveDirective(input: ObjectiveDirectiveInput): ObjectiveDirective {
  if (input.objectivePhase === "complete") {
    return {
      label: "Complete",
      value: "Cargo delivered"
    };
  }

  if (input.objectivePhase === "delivery") {
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

export function buildObjectiveInterceptReadout(
  input: ObjectiveInterceptReadoutInput
): ObjectiveInterceptReadout | undefined {
  if (input.targetDistance === undefined || input.status === "delivered" || input.status === "crashed") {
    return undefined;
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
