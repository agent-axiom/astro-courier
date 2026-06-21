import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("weekly challenge wiring", () => {
  it("renders the weekly challenge entry and selects it with its replay seed", () => {
    expect(appSource).toContain('from "./game/weeklyChallenge"');
    expect(appSource).toContain("const weeklyChallenge = buildWeeklyChallenge({");
    expect(appSource).toContain("const weeklyChallengeAction = buildWeeklyChallengeAction(weeklyChallenge, hud.contractId);");
    expect(appSource).toContain("const selectWeeklyChallenge = () => {");
    expect(appSource).toContain("className={`weekly-challenge-briefing weekly-challenge-${weeklyChallenge.tone}");
    expect(appSource).toContain("shellRef.current?.selectContract(weeklyChallengeAction.contractId, { replaySeed: weeklyChallenge.seed });");
  });
});
