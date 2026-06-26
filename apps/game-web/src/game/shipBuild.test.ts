import { describe, expect, it } from "vitest";

import { buildShipBuild } from "./shipBuild";

describe("ship build presentation", () => {
  it("maps afterburner starts to a scout build", () => {
    expect(buildShipBuild({ activePerk: "afterburner", unlockedShipUpgradeIds: [] })).toEqual({
      label: "Build",
      value: "Scout",
      detail: "Fast line",
      tone: "speed"
    });
  });

  it("prioritizes combat when missile or weapon upgrades are active", () => {
    expect(buildShipBuild({ activePerk: "missile-rack", unlockedShipUpgradeIds: ["reinforced-hull"] })).toEqual({
      label: "Build",
      value: "Fighter",
      detail: "Burst damage",
      tone: "combat"
    });
  });

  it("labels defensive and pickup builds compactly", () => {
    expect(buildShipBuild({ activePerk: "shield-crate", unlockedShipUpgradeIds: [] }).value).toBe("Guard");
    expect(buildShipBuild({ activePerk: "magnet-clamp", unlockedShipUpgradeIds: [] }).value).toBe("Courier");
  });
});
