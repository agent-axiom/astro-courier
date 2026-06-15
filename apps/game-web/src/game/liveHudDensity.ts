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

const FINAL_APPROACH_DISTANCE = 120;
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

  const finalApproach = input.targetDistance !== undefined && input.targetDistance <= FINAL_APPROACH_DISTANCE;
  const dangerPressure = input.hazardDangerLevel !== undefined || input.trajectoryRiskLevel !== undefined || input.landingStatus === "too-fast";
  const pickupRushActive = input.objectivePhase === "pickup" && (input.quickPickupSecondsRemaining ?? 0) > 0;
  const activeOpportunity =
    pickupRushActive ||
    (input.styleMultiplier ?? 1) > 1 ||
    (input.styleChainSecondsRemaining ?? 0) > 0 ||
    input.gravitySlingReady === true ||
    input.landingStatus === "ready";
  const fragileState =
    (input.cargoDamage ?? 0) > CARGO_DAMAGE_WARNING ||
    (input.fuelRatio ?? 1) <= LOW_FUEL_RATIO ||
    input.paceTier === "overtime";
  const expanded = finalApproach || dangerPressure || activeOpportunity || fragileState;

  return {
    visible: true,
    expanded,
    showRadioMessage: expanded,
    showRouteTempo: expanded,
    showPrimaryStatusRows: false,
    showActionChips: finalApproach || dangerPressure || activeOpportunity,
    showTelemetryChips: dangerPressure || fragileState,
    showRunFeed: false
  };
}
