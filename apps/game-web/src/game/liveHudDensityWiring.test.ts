import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("live HUD density wiring", () => {
  it("wires focused and expanded live HUD modes into the run panel", () => {
    expect(appSource).toContain('import { buildLiveHudDensity } from "./game/liveHudDensity";');
    expect(appSource).toContain("const liveHudDensity = buildLiveHudDensity({");
    expect(appSource).toContain('run-panel-${liveHudDensity.expanded ? "expanded" : "focused"}');
  });

  it("keeps action and telemetry chips behind live density gates", () => {
    expect(appSource).toMatch(/liveHudDensity\.showActionChips && tacticalCue \?/);
    expect(appSource).toMatch(/liveHudDensity\.showActionChips && objectiveInterceptReadout \?/);
    expect(appSource).toMatch(/liveHudDensity\.showTelemetryChips && dockingSpeedReadout \?/);
    expect(appSource).toMatch(/liveHudDensity\.showTelemetryChips \? \(\s*<div className="status-row">\s*<span>Time<\/span>/);
  });
});
