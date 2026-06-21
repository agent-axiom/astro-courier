import type { RunStatus } from "@astro-courier/shared";

export type CombatFeelCueInput = {
  status: RunStatus;
  preflightOpen: boolean;
  incomingMissileCount: number;
  empAmmo: number;
  shipHp: number;
  shipMaxHp: number;
  interceptorCount: number;
  missileAmmo: number;
};

export type CombatFeelCue = {
  label: "Incoming" | "Hull low" | "EMP ready" | "Armor break" | "Combat";
  value: string;
  tone: "danger" | "warning" | "emp" | "opportunity" | "combat";
};

export function buildCombatFeelCue(input: CombatFeelCueInput): CombatFeelCue | undefined {
  if (input.status !== "flying" || input.preflightOpen || input.interceptorCount <= 0) {
    return undefined;
  }

  if (input.incomingMissileCount > 0) {
    return {
      label: "Incoming",
      value: "Shoot missile",
      tone: "danger"
    };
  }

  const hpRatio = input.shipMaxHp > 0 ? input.shipHp / input.shipMaxHp : 1;
  if (hpRatio <= 0.35) {
    return {
      label: "Hull low",
      value: "Break away",
      tone: "warning"
    };
  }

  if (input.empAmmo > 0) {
    return {
      label: "EMP ready",
      value: "Crack shields",
      tone: "emp"
    };
  }

  if (input.missileAmmo > 0) {
    return {
      label: "Armor break",
      value: "Use missile",
      tone: "opportunity"
    };
  }

  return {
    label: "Combat",
    value: "Keep spacing",
    tone: "combat"
  };
}
