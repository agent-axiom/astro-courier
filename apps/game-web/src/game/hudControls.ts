import type { RunStatus } from "@astro-courier/shared";
import { BOOST_COOLDOWN_SECONDS } from "@astro-courier/simulation";

export type ImpulseControlAction = "boost" | "brake";

export type ImpulseControlState = {
  action: ImpulseControlAction;
  fuel: number;
  boostCooldownSeconds?: number;
  paused: boolean;
  preflightOpen: boolean;
  status: RunStatus;
};

export type BoostControlPresentationInput = {
  canBoost: boolean;
  boostCooldownSeconds: number;
};

export type BoostControlPresentation = {
  label: string;
  tone: "ready" | "cooldown" | "disabled";
  cooldownProgress: number;
};

export function canUseImpulseControl(state: ImpulseControlState): boolean {
  if (state.preflightOpen || state.paused || state.status !== "flying") {
    return false;
  }

  const minimumFuel = state.action === "boost" ? 2 : 0;
  if (state.action === "boost" && (state.boostCooldownSeconds ?? 0) > 0) {
    return false;
  }

  return state.fuel > minimumFuel;
}

export function buildBoostControlPresentation(input: BoostControlPresentationInput): BoostControlPresentation {
  if (input.boostCooldownSeconds > 0) {
    return {
      label: `Boost ${input.boostCooldownSeconds.toFixed(1)}s`,
      tone: "cooldown",
      cooldownProgress: round(clamp(input.boostCooldownSeconds / BOOST_COOLDOWN_SECONDS, 0, 1), 2)
    };
  }

  return {
    label: "Boost",
    tone: input.canBoost ? "ready" : "disabled",
    cooldownProgress: 0
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
