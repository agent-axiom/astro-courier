import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("boss loop wiring", () => {
  it("wires the compact boss loop chip into preflight and live HUD", () => {
    expect(appSource).toContain("buildBossLoop({");
    expect(appSource).toContain("className={`boss-loop-chip boss-loop-${bossLoop.tone}`}");
    expect(appSource).toContain("liveHudDensity.showActionChips && bossLoop");
  });
});
