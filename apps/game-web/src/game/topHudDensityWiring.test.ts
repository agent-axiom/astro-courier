import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("top HUD density wiring", () => {
  it("routes active flight brand copy through top HUD density", () => {
    expect(appSource).toContain('import { buildTopHudDensity } from "./game/topHudDensity";');
    expect(appSource).toContain("const topHudDensity = buildTopHudDensity({");
    expect(appSource).toContain('top-hud top-hud-${topHudDensity.mode}');
    expect(appSource).toMatch(/topHudDensity\.showBrandCopy \? \(\s*<div>/);
  });
});
