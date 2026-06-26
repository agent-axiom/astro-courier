import type { RunStatus } from "@astro-courier/shared";

export type CombatReadabilityInput = {
  status: RunStatus;
  preflightOpen: boolean;
  interceptorCount: number;
  incomingMissileCount: number;
  empAmmo: number;
  missileAmmo: number;
  weaponCooldownSeconds: number;
};

export type CombatReadability = {
  label: "Lock" | "Shield" | "Armor" | "Spacing";
  value: "Shoot missile" | "Q EMP" | "X missile" | "Keep range";
  tone: "danger" | "emp" | "opportunity" | "combat";
};

export function buildCombatReadability(input: CombatReadabilityInput): CombatReadability | undefined {
  if (input.status !== "flying" || input.preflightOpen || input.interceptorCount <= 0) {
    return undefined;
  }

  if (input.incomingMissileCount > 0) {
    return combatReadability("Lock", "Shoot missile", "danger");
  }
  if (input.empAmmo > 0) {
    return combatReadability("Shield", "Q EMP", "emp");
  }
  if (input.missileAmmo > 0) {
    return combatReadability("Armor", "X missile", "opportunity");
  }
  return combatReadability("Spacing", "Keep range", "combat");
}

function combatReadability(label: CombatReadability["label"], value: CombatReadability["value"], tone: CombatReadability["tone"]): CombatReadability {
  return { label, value, tone };
}
