import type { ShipUpgradeTrackItem } from "./bestRun";

export type UpgradeChoice = {
  label: "Next system" | "Upgrade choice";
  value: string;
  detail: string;
  tone: "next" | "online" | "elite";
};

export function buildUpgradeChoice(track: readonly ShipUpgradeTrackItem[]): UpgradeChoice | undefined {
  if (track.length === 0) {
    return undefined;
  }

  const unlocked = track.filter((item) => item.unlocked);
  const active = unlocked.at(-1) ?? track[0];
  const next = track.find((item) => !item.unlocked);

  if (!next) {
    return {
      label: "Upgrade choice",
      value: "All online",
      detail: `${active.label} active`,
      tone: "elite"
    };
  }

  return {
    label: "Next system",
    value: `${shortLabel(next.label)} in ${Math.max(1, next.marksRemaining)}`,
    detail: `${shortValue(active)} online`,
    tone: unlocked.length > 1 ? "online" : "next"
  };
}

function shortLabel(label: ShipUpgradeTrackItem["label"]): string {
  if (label === "Reinforced Hull") return "Hull";
  if (label === "Pulse Rail") return "Pulse";
  if (label === "Mag Clamp") return "Clamp";
  if (label === "Forge Core") return "Forge";
  return "Boost";
}

function shortValue(item: ShipUpgradeTrackItem): string {
  if (item.id === "reinforced-hull") return "Hull";
  if (item.id === "pulse-rail") return "Pulse";
  if (item.id === "mag-clamp") return "Clamp";
  if (item.id === "forge-core") return "Forge Core";
  return "Boost";
}
