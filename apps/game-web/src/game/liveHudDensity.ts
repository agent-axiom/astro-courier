import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";
import type { ContractPaceTier } from "./pace";

export type LiveHudDensityInput = {
  status: RunStatus;
  preflightOpen: boolean;
  objectivePhase: ObjectivePhase;
  targetDistance?: number;
  cargoDamage?: number;
  fuelRatio?: number;
  paceTier?: ContractPaceTier;
  trajectoryRiskLevel?: "near" | "inside";
  hazardDangerLevel?: "near" | "inside";
  quickPickupSecondsRemaining?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
  gravitySlingReady?: boolean;
  landingStatus?: LandingGuidanceStatus;
};

export type LiveHudDensity = {
  visible: boolean;
  expanded: boolean;
  showRadioMessage: boolean;
  showRouteTempo: boolean;
  showPrimaryStatusRows: boolean;
  showActionChips: boolean;
  showTelemetryChips: boolean;
  showRunFeed: boolean;
};

const LOW_FUEL_RATIO = 0.18;
const CARGO_DAMAGE_WARNING = 0.02;

export function buildLiveHudDensity(input: LiveHudDensityInput): LiveHudDensity {
  if (input.preflightOpen || input.status === "delivered" || input.status === "crashed") {
    return {
      visible: false,
      expanded: false,
      showRadioMessage: false,
      showRouteTempo: false,
      showPrimaryStatusRows: false,
      showActionChips: false,
      showTelemetryChips: false,
      showRunFeed: false
    };
  }

  if (input.status !== "flying") {
    return {
      visible: true,
      expanded: true,
      showRadioMessage: true,
      showRouteTempo: true,
      showPrimaryStatusRows: true,
      showActionChips: true,
      showTelemetryChips: true,
      showRunFeed: true
    };
  }

  const approachProblem = input.landingStatus === "too-fast" || input.landingStatus === "misaligned";
  const hazardContactPressure = input.hazardDangerLevel === "inside";
  const dangerPressure = hazardContactPressure || input.trajectoryRiskLevel !== undefined || approachProblem;
  const readyDockFocus = input.objectivePhase === "delivery" && input.landingStatus === "ready";
  const activeOpportunity =
    (input.styleMultiplier ?? 1) > 1 ||
    (input.styleChainSecondsRemaining ?? 0) > 0 ||
    input.gravitySlingReady === true ||
    readyDockFocus;
  const fragileState =
    (input.cargoDamage ?? 0) > CARGO_DAMAGE_WARNING ||
    (input.fuelRatio ?? 1) <= LOW_FUEL_RATIO ||
    input.paceTier === "overtime";
  const expanded = dangerPressure || activeOpportunity || fragileState;

  return {
    visible: true,
    expanded,
    showRadioMessage: expanded && !readyDockFocus,
    showRouteTempo: expanded && !readyDockFocus,
    showPrimaryStatusRows: false,
    showActionChips: (dangerPressure || activeOpportunity) && !readyDockFocus,
    showTelemetryChips: dangerPressure || fragileState,
    showRunFeed: false
  };
}
