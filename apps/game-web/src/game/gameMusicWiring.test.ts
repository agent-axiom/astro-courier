import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("game music wiring", () => {
  it("treats launch and direct restart as fresh gameplay music starts", () => {
    expect(appSource).toContain("void musicRef.current?.playGameplay({ forceNewTrack: true });");
    expect(appSource).toMatch(/const restartActiveRun = \(\) => \{[\s\S]*playGameplay\(\{ forceNewTrack: true \}\)/);
  });

  it("keeps preflight briefing on menu music", () => {
    expect(appSource).toContain("void music.playMenu();");
    expect(appSource).toContain("void musicRef.current?.playMenu();");
  });
});
