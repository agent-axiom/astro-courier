import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("upgrade choice wiring", () => {
  it("renders the compact upgrade-choice strip in preflight", () => {
    expect(appSource).toContain('from "./game/upgradeChoice"');
    expect(appSource).toContain("const upgradeChoice = buildUpgradeChoice(shipUpgradeTrack)");
    expect(appSource).toContain('className={`upgrade-choice-chip upgrade-choice-${upgradeChoice.tone}`}');
  });
});
