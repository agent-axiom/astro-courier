import type { ShipUpgradeId, ShipUpgradeTrackItem } from "./bestRun";

export type HangarSystemChip = {
  id: ShipUpgradeId;
  label: ShipUpgradeTrackItem["label"];
  value: ShipUpgradeTrackItem["value"];
  tone: ShipUpgradeTrackItem["tone"];
};

export type HangarReadout = {
  label: "Hangar";
  value: string;
  detail: string;
  progress: number;
  tone: "starter" | "armed" | "elite";
  systems: HangarSystemChip[];
};

const courierMarks = ["I", "II", "III", "IV", "V"] as const;

export function buildHangarReadout(track: readonly ShipUpgradeTrackItem[]): HangarReadout {
  const unlocked = track.filter((item) => item.unlocked);
  const unlockedCount = Math.max(1, unlocked.length);
  const lastUnlocked = unlocked.at(-1);
  const nextUpgrade = track.find((item) => !item.unlocked);
  const progress = track.length > 0 ? round(unlocked.length / track.length, 2) : 0;

  return {
    label: "Hangar",
    value: `Courier Mk ${courierMarks[Math.min(unlockedCount, courierMarks.length) - 1]}`,
    detail: buildHangarDetail(lastUnlocked, nextUpgrade),
    progress,
    tone: !nextUpgrade ? "elite" : unlocked.some((item) => item.id === "pulse-rail") ? "armed" : "starter",
    systems: track.map((item) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      tone: item.tone
    }))
  };
}

function buildHangarDetail(lastUnlocked: ShipUpgradeTrackItem | undefined, nextUpgrade: ShipUpgradeTrackItem | undefined): string {
  if (!nextUpgrade) {
    return "All systems online";
  }
  if (lastUnlocked && lastUnlocked.id !== "boost-tune") {
    return `${lastUnlocked.label} online`;
  }
  return `${Math.max(1, nextUpgrade.marksRemaining)} ${markWord(nextUpgrade.marksRemaining)} to ${shortUpgradeLabel(nextUpgrade.label)}`;
}

function shortUpgradeLabel(label: ShipUpgradeTrackItem["label"]): string {
  if (label === "Reinforced Hull") return "Hull";
  return label;
}

function markWord(count: number): "mark" | "marks" {
  return count === 1 ? "mark" : "marks";
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
