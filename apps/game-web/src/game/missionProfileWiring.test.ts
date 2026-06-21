import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("mission profile wiring", () => {
  it("renders the compact preflight mission profile chip", () => {
    expect(appSource).toContain('from "./game/missionProfile"');
    expect(appSource).toContain("const missionProfile = buildMissionProfile");
    expect(appSource).toContain('className={`mission-profile-chip mission-profile-${missionProfile.tone}`}');
  });
});
