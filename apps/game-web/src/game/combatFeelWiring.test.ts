import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("combat feel wiring", () => {
  it("renders one compact live combat-feel cue", () => {
    expect(appSource).toContain('from "./game/combatFeel"');
    expect(appSource).toContain("const combatFeelCue = buildCombatFeelCue({");
    expect(appSource).toContain('className={`combat-feel-cue combat-feel-${combatFeelCue.tone}`}');
  });
});
