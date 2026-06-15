import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("top HUD density wiring", () => {
  it("routes active flight brand copy through top HUD density", () => {
    expect(appSource).toContain('import { buildTopHudDensity, buildTopHudSpeedTone } from "./game/topHudDensity";');
    expect(appSource).toContain("const topHudDensity = buildTopHudDensity({");
    expect(appSource).toContain("const topHudSpeedTone = buildTopHudSpeedTone({");
    expect(appSource).toContain('top-hud top-hud-${topHudDensity.mode}');
    expect(appSource).toMatch(/topHudDensity\.showBrandCopy \? \(\s*<div>/);
    expect(appSource).toContain("showLabel={topHudDensity.showMetricLabels}");
    expect(appSource).toMatch(/type MetricProps = \{[\s\S]*showLabel: boolean;/);
    expect(appSource).toMatch(/aria-label=\{`\$\{label\}: \$\{value\}`\}/);
    expect(appSource).toMatch(/showLabel \? <span>\{label\}<\/span> : null/);
  });

  it("keeps speed warning tone behind landing guidance instead of a hard-coded cruise threshold", () => {
    expect(appSource).toContain("tone={topHudSpeedTone}");
    expect(appSource).not.toContain("tone={hud.speed > 45 ? \"warning\" : \"normal\"}");
  });
});
