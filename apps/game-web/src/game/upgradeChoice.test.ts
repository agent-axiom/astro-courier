import { describe, expect, it } from "vitest";
import { buildUpgradeChoice } from "./upgradeChoice";
import type { ShipUpgradeTrackItem } from "./bestRun";

describe("upgrade choice presentation", () => {
  it("shows the next unlock when the ship is still early", () => {
    expect(
      buildUpgradeChoice([
        upgrade("boost-tune", "Boost Tune", "Boost", 0, true, 0, "online"),
        upgrade("reinforced-hull", "Reinforced Hull", "+HP", 3, false, 2, "next"),
        upgrade("pulse-rail", "Pulse Rail", "Shot", 7, false, 6, "locked")
      ])
    ).toEqual({
      label: "Next system",
      value: "Hull in 2",
      detail: "Boost online",
      tone: "next"
    });
  });

  it("celebrates an elite hangar without extra instructions", () => {
    expect(
      buildUpgradeChoice([
        upgrade("boost-tune", "Boost Tune", "Boost", 0, true, 0, "online"),
        upgrade("reinforced-hull", "Reinforced Hull", "+HP", 3, true, 0, "online"),
        upgrade("pulse-rail", "Pulse Rail", "Shot", 7, true, 0, "online"),
        upgrade("mag-clamp", "Mag Clamp", "Pickup", 12, true, 0, "online"),
        upgrade("forge-core", "Forge Core", "Raid", 18, true, 0, "online")
      ])
    ).toEqual({
      label: "Upgrade choice",
      value: "All online",
      detail: "Forge Core active",
      tone: "elite"
    });
  });
});

function upgrade(
  id: ShipUpgradeTrackItem["id"],
  label: ShipUpgradeTrackItem["label"],
  value: ShipUpgradeTrackItem["value"],
  requiredMarks: number,
  unlocked: boolean,
  marksRemaining: number,
  tone: ShipUpgradeTrackItem["tone"]
): ShipUpgradeTrackItem {
  return { id, label, value, requiredMarks, unlocked, marksRemaining, tone };
}
