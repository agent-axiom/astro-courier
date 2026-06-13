import type { RunStatus } from "@astro-courier/shared";
import type { ContractPaceTier } from "./pace";

export const COMET_RESERVE_MIN_RATIO = 0.75;
export const COMET_RESERVE_WARNING_RATIO = 0.82;

export type CometRunReadoutInput = {
  status: RunStatus;
  preflightOpen: boolean;
  paceTier: ContractPaceTier;
  fuel: number;
  maxFuel: number;
  cargoDamage: number;
};

export type CometRunReadout = {
  label: "Comet run";
  value: string;
  tone: "live" | "warning" | "lost";
};

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

  if (input.cargoDamage > 0.02) {
    return {
      label: "Comet run",
      value: "Cargo scratched",
      tone: "lost"
    };
  }

  const fuelReserve = input.maxFuel > 0 ? input.fuel / input.maxFuel : 0;
  if (fuelReserve < COMET_RESERVE_MIN_RATIO) {
    return {
      label: "Comet run",
      value: "Reserve low",
      tone: "lost"
    };
  }

  if (fuelReserve < COMET_RESERVE_WARNING_RATIO) {
    return {
      label: "Comet run",
      value: "Reserve tight",
      tone: "warning"
    };
  }

  return {
    label: "Comet run",
    value: "Clean + reserve",
    tone: "live"
  };
}
