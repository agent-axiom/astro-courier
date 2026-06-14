import type { ObjectivePhase, RunStatus } from "@astro-courier/shared";
import { BOOST_COOLDOWN_SECONDS, NO_BRAKE_STYLE_BONUS } from "@astro-courier/simulation";

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
  launchBurstSecondsRemaining?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type BoostControlPresentation = {
  label: string;
  badge?: string;
  tone: "ready" | "burst" | "chain" | "cooldown" | "disabled";
  cooldownProgress: number;
};

export type BrakeControlPresentationInput = {
  canBrake: boolean;
  manualBrakeUsed: boolean;
  objectivePhase?: ObjectivePhase;
  cargoKind?: string;
  cargoDamage?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type BrakeControlPresentation = {
  label: string;
  badge?: string;
  tone: "ready" | "finesse" | "stress" | "disabled";
};

export type PrimaryRunControlPresentationInput = {
  preflightOpen: boolean;
  paused: boolean;
};

export type PrimaryRunControlPresentation =
  | {
      visible: false;
    }
  | {
      visible: true;
      label: "Pause" | "Resume";
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

  if (input.canBoost && (input.launchBurstSecondsRemaining ?? 0) > 0) {
    const launchBurstBadge = `${(input.launchBurstSecondsRemaining ?? 0).toFixed(1)}s`;
    return {
      label: `Launch Burst ${launchBurstBadge}`,
      badge: launchBurstBadge,
      tone: "burst",
      cooldownProgress: 0
    };
  }

  if (input.canBoost && (input.styleMultiplier ?? 1) > 1 && (input.styleChainSecondsRemaining ?? 0) > 0) {
    const chainBadge = `x${(input.styleMultiplier ?? 1).toFixed(2)}`;
    return {
      label: `Boost chain ${chainBadge}`,
      badge: chainBadge,
      tone: "chain",
      cooldownProgress: 0
    };
  }

  return {
    label: "Boost",
    tone: input.canBoost ? "ready" : "disabled",
    cooldownProgress: 0
  };
}

export function buildBrakeControlPresentation(input: BrakeControlPresentationInput): BrakeControlPresentation {
  if (!input.canBrake) {
    return {
      label: "Brake",
      tone: "disabled"
    };
  }

  const noBrakeFinesseLive =
    input.objectivePhase === "delivery" && !input.manualBrakeUsed && (input.cargoDamage ?? 0) <= 0.02;
  if (noBrakeFinesseLive) {
    if ((input.styleMultiplier ?? 1) > 1 && (input.styleChainSecondsRemaining ?? 0) > 0) {
      return {
        label: `No Brake chain x${(input.styleMultiplier ?? 1).toFixed(2)}`,
        badge: `${(input.styleChainSecondsRemaining ?? 0).toFixed(1)}s`,
        tone: "finesse"
      };
    }

    return {
      label: `No Brake +${NO_BRAKE_STYLE_BONUS} armed`,
      badge: `+${NO_BRAKE_STYLE_BONUS}`,
      tone: "finesse"
    };
  }

  if (isVolatileCargo(input.cargoKind)) {
    return {
      label: "Brake shock",
      badge: "volatile",
      tone: "stress"
    };
  }

  if (isBrakeSensitiveCargo(input.cargoKind)) {
    return {
      label: "Brake stress",
      badge: "cargo",
      tone: "stress"
    };
  }

  return {
    label: "Brake",
    tone: "ready"
  };
}

export function buildPrimaryRunControlPresentation(input: PrimaryRunControlPresentationInput): PrimaryRunControlPresentation {
  if (input.preflightOpen) {
    return { visible: false };
  }

  return {
    visible: true,
    label: input.paused ? "Resume" : "Pause"
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function isBrakeSensitiveCargo(cargoKind: string | undefined): boolean {
  return cargoKind === "unstable" || cargoKind === "volatile";
}

function isVolatileCargo(cargoKind: string | undefined): boolean {
  return cargoKind === "volatile";
}
