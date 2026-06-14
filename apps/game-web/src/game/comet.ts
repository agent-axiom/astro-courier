import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";
import type { ContractPaceTier } from "./pace";

export const COMET_RESERVE_MIN_RATIO = 0.75;
export const COMET_RESERVE_WARNING_RATIO = 0.82;
const cleanCargoDamageLimit = 0.02;

export type LiveCometDockInput = {
  status: RunStatus;
  objectivePhase?: ObjectivePhase;
  paceTier?: ContractPaceTier;
  fuel: number;
  maxFuel: number;
  cargoDamage?: number;
  perfectDockReady?: boolean;
};

export type CometRunReadoutInput = {
  status: RunStatus;
  preflightOpen: boolean;
  objectivePhase?: ObjectivePhase;
  paceTier: ContractPaceTier;
  fuel: number;
  maxFuel: number;
  cargoDamage: number;
  landingStatus?: LandingGuidanceStatus;
  perfectDockReady?: boolean;
};

export type CometRunReadout = {
  label: "Comet run";
  value: string;
  detail?: string;
  tone: "live" | "warning" | "lost";
};

function formatCometReserveDetail(fuelReserve: number): string {
  const reservePercent = Math.max(0, Math.round(fuelReserve * 100));
  return `Reserve ${reservePercent}% / need ${Math.round(COMET_RESERVE_MIN_RATIO * 100)}%`;
}

function formatCometReserveBufferDetail(fuelReserve: number): string {
  const reservePercent = Math.max(0, Math.round(fuelReserve * 100));
  const bufferPercent = Math.max(0, Math.round((fuelReserve - COMET_RESERVE_MIN_RATIO) * 100));
  return `Reserve ${reservePercent}% / ${bufferPercent}% burn buffer`;
}

function formatCometReserveShortfallDetail(fuelReserve: number): string {
  const reservePercent = Math.max(0, Math.round(fuelReserve * 100));
  const shortPercent = Math.max(0, Math.round((COMET_RESERVE_MIN_RATIO - fuelReserve) * 100));
  return `Reserve ${reservePercent}% / ${shortPercent}% short`;
}

export function isLiveCometDockArmed(input: LiveCometDockInput): boolean {
  const fuelReserve = input.maxFuel > 0 ? input.fuel / input.maxFuel : 0;
  return (
    input.status === "flying" &&
    input.objectivePhase === "delivery" &&
    input.paceTier === "gold" &&
    fuelReserve >= COMET_RESERVE_MIN_RATIO &&
    (input.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    input.perfectDockReady === true
  );
}

export function buildCometRunReadout(input: CometRunReadoutInput): CometRunReadout | undefined {
  if (input.preflightOpen || input.status === "delivered" || input.status === "crashed") {
    return undefined;
  }

  if (input.paceTier !== "gold") {
    return {
      label: "Comet run",
      value: "Gold missed",
      tone: "lost"
    };
  }

  if (input.cargoDamage > cleanCargoDamageLimit) {
    return {
      label: "Comet run",
      value: "Cargo scratched",
      tone: "lost"
    };
  }

  const fuelReserve = input.maxFuel > 0 ? input.fuel / input.maxFuel : 0;
  const reserveDetail = formatCometReserveDetail(fuelReserve);
  if (fuelReserve < COMET_RESERVE_MIN_RATIO) {
    return {
      label: "Comet run",
      value: "Reserve short",
      detail: formatCometReserveShortfallDetail(fuelReserve),
      tone: "lost"
    };
  }

  if (isLiveCometDockArmed(input)) {
    return {
      label: "Comet run",
      value: "Perfect dock armed",
      detail: reserveDetail,
      tone: "live"
    };
  }

  if (fuelReserve < COMET_RESERVE_WARNING_RATIO) {
    return {
      label: "Comet run",
      value: "Coast for comet",
      detail: formatCometReserveBufferDetail(fuelReserve),
      tone: "warning"
    };
  }

  if (input.objectivePhase === "delivery") {
    if (input.landingStatus === "too-fast") {
      return {
        label: "Comet run",
        value: "Slow for perfect dock",
        detail: reserveDetail,
        tone: "warning"
      };
    }
    if (input.landingStatus === "misaligned") {
      return {
        label: "Comet run",
        value: "Line up perfect dock",
        detail: reserveDetail,
        tone: "warning"
      };
    }
    if (input.landingStatus === "ready") {
      return {
        label: "Comet run",
        value: "Feather for perfect dock",
        detail: reserveDetail,
        tone: "warning"
      };
    }
  }

  return {
    label: "Comet run",
    value: "Clean + reserve",
    detail: reserveDetail,
    tone: "live"
  };
}
