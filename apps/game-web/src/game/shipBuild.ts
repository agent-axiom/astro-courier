import type { PlayerPerkId, ShipUpgradeId } from "@astro-courier/shared";

export type ShipBuildPresentation = {
  label: "Build";
  value: string;
  detail: string;
  tone: "speed" | "combat" | "guard" | "dock";
};

export function buildShipBuild(input: {
  activePerk: PlayerPerkId;
  unlockedShipUpgradeIds: readonly ShipUpgradeId[];
}): ShipBuildPresentation {
  const upgrades = new Set(input.unlockedShipUpgradeIds);

  if (input.activePerk === "missile-rack" || upgrades.has("pulse-rail") || upgrades.has("forge-core")) {
    return { label: "Build", value: "Fighter", detail: "Burst damage", tone: "combat" };
  }

  if (input.activePerk === "shield-crate" || upgrades.has("reinforced-hull")) {
    return { label: "Build", value: "Guard", detail: "Safer cargo", tone: "guard" };
  }

  if (input.activePerk === "magnet-clamp" || upgrades.has("mag-clamp")) {
    return { label: "Build", value: "Courier", detail: "Wide pickup", tone: "dock" };
  }

  return { label: "Build", value: "Scout", detail: "Fast line", tone: "speed" };
}
