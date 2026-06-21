import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("ghost coach wiring", () => {
  it("wires the optional coach toggle and compact live cue", () => {
    expect(appSource).toContain("buildGhostCoachCue({");
    expect(appSource).toContain("setGhostCoachEnabled");
    expect(appSource).toContain("className={`ghost-coach-chip ghost-coach-${ghostCoachCue.tone}`}");
  });
});
