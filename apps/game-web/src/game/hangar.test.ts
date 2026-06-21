import { describe, expect, it } from "vitest";

import { buildHangarReadout } from "./hangar";
import type { ShipUpgradeTrackItem } from "./bestRun";

const starterTrack: ShipUpgradeTrackItem[] = [
  { id: "boost-tune", label: "Boost Tune", value: "Boost", requiredMarks: 0, marksRemaining: 0, unlocked: true, tone: "online" },
  { id: "reinforced-hull", label: "Reinforced Hull", value: "+HP", requiredMarks: 3, marksRemaining: 3, unlocked: false, tone: "next" },
  { id: "pulse-rail", label: "Pulse Rail", value: "Shot", requiredMarks: 7, marksRemaining: 7, unlocked: false, tone: "locked" },
  { id: "mag-clamp", label: "Mag Clamp", value: "Pickup", requiredMarks: 12, marksRemaining: 12, unlocked: false, tone: "locked" },
  { id: "forge-core", label: "Forge Core", value: "Raid", requiredMarks: 18, marksRemaining: 18, unlocked: false, tone: "locked" }
];

describe("hangar readout", () => {
  it("shows the starter courier with the next upgrade target", () => {
    expect(buildHangarReadout(starterTrack)).toEqual({
      label: "Hangar",
      value: "Courier Mk I",
      detail: "3 marks to Hull",
      progress: 0.2,
      tone: "starter",
      systems: [
        { id: "boost-tune", label: "Boost Tune", value: "Boost", tone: "online" },
        { id: "reinforced-hull", label: "Reinforced Hull", value: "+HP", tone: "next" },
        { id: "pulse-rail", label: "Pulse Rail", value: "Shot", tone: "locked" },
        { id: "mag-clamp", label: "Mag Clamp", value: "Pickup", tone: "locked" },
        { id: "forge-core", label: "Forge Core", value: "Raid", tone: "locked" }
      ]
    });
  });

  it("switches to armed tone when weapons are online", () => {
    const readout = buildHangarReadout(
      starterTrack.map((item) =>
        item.id === "reinforced-hull" || item.id === "pulse-rail"
          ? { ...item, marksRemaining: 0, unlocked: true, tone: "online" }
          : item.id === "mag-clamp"
            ? { ...item, marksRemaining: 5, tone: "next" }
            : item
      )
    );

    expect(readout.value).toBe("Courier Mk III");
    expect(readout.detail).toBe("Pulse Rail online");
    expect(readout.progress).toBe(0.6);
    expect(readout.tone).toBe("armed");
  });

  it("marks the hangar complete when every ship system is online", () => {
    const readout = buildHangarReadout(starterTrack.map((item) => ({ ...item, marksRemaining: 0, unlocked: true, tone: "online" })));

    expect(readout.value).toBe("Courier Mk V");
    expect(readout.detail).toBe("All systems online");
    expect(readout.progress).toBe(1);
    expect(readout.tone).toBe("elite");
  });
});
