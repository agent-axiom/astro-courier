import {
  DAMAGE_CONTROL_STYLE_BONUS,
  ECO_DRIFT_FUEL_USED_LIMIT,
  ECO_DRIFT_STYLE_BONUS,
  EXPRESS_FINISH_STYLE_BONUS,
  LAUNCH_BURST_STYLE_BONUS,
  LAST_DROP_FUEL_RATIO,
  LAST_DROP_STYLE_BONUS,
  PERFECT_APPROACH_STREAK_SECONDS,
  PERFECT_APPROACH_STYLE_BONUS
} from "@astro-courier/simulation";
import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";
import { COMET_RESERVE_MIN_RATIO, COMET_RESERVE_WARNING_RATIO } from "./comet";
import type { ContractPaceTier } from "./pace";

const FUEL_CRITICAL_RATIO = 0.15;

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

export type RouteFocusReadoutInput = {
  status: RunStatus;
  contractId?: string;
  objectivePhase: ObjectivePhase;
  hazardDangerLevel?: "near" | "inside";
  landingStatus?: LandingGuidanceStatus;
  fuel?: number;
  maxFuel?: number;
  gravitySlingReady?: boolean;
  gravitySlingStyleBonus?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type RouteFocusReadout = {
  label: "Route focus";
  value: string;
  tone: "danger" | "fuel" | "precision" | "speed" | "style";
};

export type TacticalCueInput = {
  status: RunStatus;
  contractId?: string;
  objectivePhase: ObjectivePhase;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
  trajectoryRiskSeconds?: number;
  landingStatus?: LandingGuidanceStatus;
  paceTier?: ContractPaceTier;
  paceSecondsRemaining?: number;
  cargoDamage?: number;
  fuelUsed?: number;
  fuel?: number;
  maxFuel?: number;
  quickPickupSecondsRemaining?: number;
  quickPickupBonus?: number;
  launchBurstSecondsRemaining?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
  gravitySlingReady?: boolean;
  gravitySlingStyleBonus?: number;
  approachStreakSeconds?: number;
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

export function buildRouteFocusReadout(input: RouteFocusReadoutInput): RouteFocusReadout | undefined {
  if (input.status !== "flying") {
    return undefined;
  }

  if (input.contractId === "gravity-slingshot") {
    if (input.gravitySlingReady === true && (input.gravitySlingStyleBonus ?? 0) > 0) {
      return {
        label: "Route focus",
        value: `Sling armed / +${Math.round((input.gravitySlingStyleBonus ?? 0) * styleMultiplier(input))}`,
        tone: "style"
      };
    }

    return {
      label: "Route focus",
      value: "Build sling entry / 54+ speed",
      tone: "speed"
    };
  }

  if (input.contractId === "chain-relay") {
    if ((input.styleMultiplier ?? 1) > 1 && (input.styleChainSecondsRemaining ?? 0) > 0) {
      return {
        label: "Route focus",
        value: `Keep relay / x${styleMultiplier(input).toFixed(2)}`,
        tone: "style"
      };
    }

    return {
      label: "Route focus",
      value: "Prime relay / skim danger",
      tone: "style"
    };
  }

  if (input.contractId === "last-drop-run") {
    if (
      input.objectivePhase === "delivery" &&
      input.landingStatus === "ready" &&
      fuelReserve(input) > 0 &&
      fuelReserve(input) <= LAST_DROP_FUEL_RATIO
    ) {
      return {
        label: "Route focus",
        value: "Cash Last Drop / dock now",
        tone: "fuel"
      };
    }

    return {
      label: "Route focus",
      value: input.objectivePhase === "delivery" ? "Spend to 5% / save dock" : "Save fuel / load clean",
      tone: "fuel"
    };
  }

  if (input.contractId === "asteroid-sprint") {
    return {
      label: "Route focus",
      value: input.hazardDangerLevel ? "Thread active / danger pay" : "Seek field / stay clean",
      tone: "danger"
    };
  }

  if (input.contractId === "return-leg") {
    return {
      label: "Route focus",
      value: "Reverse line / brake late",
      tone: "precision"
    };
  }

  return {
    label: "Route focus",
    value: input.objectivePhase === "pickup" ? "Load cargo / rush pickup" : "Clean delivery / soft dock",
    tone: input.objectivePhase === "pickup" ? "speed" : "precision"
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

  if (input.trajectoryRiskLevel === "near" && isRecoverableDamagedDelivery(input)) {
    return {
      label: "Tactical cue",
      value: `Clear vector / ${formatSeconds(input.trajectoryRiskSeconds)}`,
      tone: "urgent"
    };
  }

  if (input.landingStatus === "too-fast") {
    return {
      label: "Tactical cue",
      value: "Brake before dock",
      tone: "danger"
    };
  }

  if (isLastDropReady(input)) {
    return {
      label: "Tactical cue",
      value: `Last Drop / ${formatLastDropPayout(input)}`,
      tone: "urgent"
    };
  }

  if (isFuelCritical(input)) {
    return {
      label: "Tactical cue",
      value: "Fuel critical / coast",
      tone: "urgent"
    };
  }

  const chainSecondsRemaining = input.styleChainSecondsRemaining ?? 0;
  const urgentStyleChain = (input.styleMultiplier ?? 1) > 1 && chainSecondsRemaining > 0 && chainSecondsRemaining <= 1;
  if (urgentStyleChain) {
    return {
      label: "Tactical cue",
      value: `${buildUrgentChainAction(input)} / ${formatSeconds(input.styleChainSecondsRemaining)}`,
      tone: "urgent"
    };
  }

  if (isBankedPerfectApproach(input)) {
    return {
      label: "Tactical cue",
      value: `Soft dock / +${PERFECT_APPROACH_STYLE_BONUS}`,
      tone: "opportunity"
    };
  }

  if (isReadyGravitySling(input)) {
    return {
      label: "Tactical cue",
      value: `Sling now / ${formatGravitySlingPayout(input)}`,
      tone: "opportunity"
    };
  }

  if ((input.launchBurstSecondsRemaining ?? 0) > 0) {
    return {
      label: "Tactical cue",
      value: `Burst boost / +${LAUNCH_BURST_STYLE_BONUS} / ${formatSeconds(input.launchBurstSecondsRemaining)}`,
      tone: "opportunity"
    };
  }

  if (isCleanGoldDelivery(input) && (input.paceSecondsRemaining ?? 0) <= 4) {
    return {
      label: "Tactical cue",
      value: `Close express / +${EXPRESS_FINISH_STYLE_BONUS} / ${formatSeconds(input.paceSecondsRemaining)}`,
      tone: "opportunity"
    };
  }

  if (isTightCometReserve(input)) {
    return {
      label: "Tactical cue",
      value: `Save comet reserve / ${Math.round(fuelReserve(input) * 100)}%`,
      tone: "urgent"
    };
  }

  if (isRecoverableDamagedDelivery(input)) {
    return {
      label: "Tactical cue",
      value: `Damage control / +${DAMAGE_CONTROL_STYLE_BONUS}`,
      tone: "opportunity"
    };
  }

  if (isEcoDriftDelivery(input)) {
    return {
      label: "Tactical cue",
      value: `Eco drift / +${ECO_DRIFT_STYLE_BONUS}`,
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

function isRecoverableDamagedDelivery(input: TacticalCueInput): boolean {
  const cargoDamage = input.cargoDamage ?? 0;
  return input.objectivePhase === "delivery" && cargoDamage > 0.02 && cargoDamage <= 0.35;
}

function isReadyGravitySling(input: TacticalCueInput): boolean {
  return (
    input.gravitySlingReady === true &&
    (input.gravitySlingStyleBonus ?? 0) > 0 &&
    (input.cargoDamage ?? 0) <= 0.02
  );
}

function isBankedPerfectApproach(input: TacticalCueInput): boolean {
  return (
    input.landingStatus === "ready" &&
    (input.approachStreakSeconds ?? 0) >= PERFECT_APPROACH_STREAK_SECONDS &&
    (input.cargoDamage ?? 0) <= 0.02
  );
}

function isEcoDriftDelivery(input: TacticalCueInput): boolean {
  return (
    input.objectivePhase === "delivery" &&
    !isCleanGoldDelivery(input) &&
    (input.cargoDamage ?? 0) <= 0.02 &&
    (input.fuelUsed ?? Number.POSITIVE_INFINITY) <= ECO_DRIFT_FUEL_USED_LIMIT
  );
}

function isTightCometReserve(input: TacticalCueInput): boolean {
  const reserve = fuelReserve(input);
  return (
    isCleanGoldDelivery(input) &&
    reserve >= COMET_RESERVE_MIN_RATIO &&
    reserve < COMET_RESERVE_WARNING_RATIO
  );
}

function fuelReserve(input: TacticalCueInput): number {
  return input.maxFuel !== undefined && input.maxFuel > 0 && input.fuel !== undefined ? input.fuel / input.maxFuel : 0;
}

function isFuelCritical(input: TacticalCueInput): boolean {
  return input.maxFuel !== undefined && input.maxFuel > 0 && input.fuel !== undefined && input.fuel / input.maxFuel <= FUEL_CRITICAL_RATIO;
}

function isLastDropReady(input: TacticalCueInput): boolean {
  return (
    input.objectivePhase === "delivery" &&
    input.landingStatus === "ready" &&
    (input.cargoDamage ?? 0) <= 0.02 &&
    input.maxFuel !== undefined &&
    input.maxFuel > 0 &&
    input.fuel !== undefined &&
    input.fuel / input.maxFuel <= LAST_DROP_FUEL_RATIO
  );
}

function buildUrgentChainAction(input: TacticalCueInput): string {
  if (isReadyGravitySling(input)) {
    return `Sling now / x${styleMultiplier(input).toFixed(2)}`;
  }

  if (isBankedPerfectApproach(input)) {
    return `Soft dock / +${PERFECT_APPROACH_STYLE_BONUS}`;
  }

  if ((input.launchBurstSecondsRemaining ?? 0) > 0) {
    return `Boost now / +${LAUNCH_BURST_STYLE_BONUS}`;
  }

  if (input.contractId === "chain-relay" && input.objectivePhase === "delivery") {
    return "Dock chain";
  }

  return "Save chain";
}

function formatGravitySlingPayout(input: TacticalCueInput): string {
  const multiplier = styleMultiplier(input);
  const payout = Math.round((input.gravitySlingStyleBonus ?? 0) * multiplier);
  const multiplierSuffix = multiplier > 1 ? ` / x${multiplier.toFixed(2)}` : "";
  return `+${payout}${multiplierSuffix}`;
}

function formatLastDropPayout(input: TacticalCueInput): string {
  const multiplier = styleMultiplier(input);
  const payout = Math.round(LAST_DROP_STYLE_BONUS * multiplier);
  const multiplierSuffix = multiplier > 1 ? ` / x${multiplier.toFixed(2)}` : "";
  const chainSecondsRemaining = input.styleChainSecondsRemaining ?? 0;
  const timingSuffix = multiplier > 1 && chainSecondsRemaining > 0 && chainSecondsRemaining <= 1 ? ` / ${formatSeconds(chainSecondsRemaining)}` : "";
  return `+${payout}${multiplierSuffix}${timingSuffix}`;
}

function styleMultiplier(input: TacticalCueInput): number {
  return Math.max(1, input.styleMultiplier ?? 1);
}

function formatSeconds(seconds?: number): string {
  return `${(seconds ?? 0).toFixed(1)}s`;
}
