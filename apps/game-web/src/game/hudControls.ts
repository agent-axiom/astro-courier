import type { RunStatus } from "@astro-courier/shared";

export type ImpulseControlAction = "boost" | "brake";

export type ImpulseControlState = {
  action: ImpulseControlAction;
  fuel: number;
  boostCooldownSeconds?: number;
  paused: boolean;
  preflightOpen: boolean;
  status: RunStatus;
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
