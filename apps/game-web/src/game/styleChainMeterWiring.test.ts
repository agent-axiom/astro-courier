import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("style chain meter wiring", () => {
  it("builds a compact chain meter from the live HUD style state", () => {
    expect(appSource).toContain('import { buildLiveStyleReward, buildStyleChainMeter, buildStyleTargetCue } from "./game/style";');
    expect(appSource).toContain("const styleChainMeter = buildStyleChainMeter({");
    expect(appSource).toContain("styleChainCount: hud.styleChainCount");
    expect(appSource).toContain("const styleChainMeterStyle = { \"--style-chain-meter-progress\": styleChainMeter?.progress ?? 0 } as CSSProperties;");
  });

  it("renders the chain meter as lightweight visual feedback instead of duplicating style-burst text", () => {
    expect(appSource).toContain("!styleChainMeter ? (");
    expect(appSource).toContain('className={`style-chain-meter style-chain-meter-${styleChainMeter.tone}`}');
    expect(appSource).toContain("style={styleChainMeterStyle}");
    expect(appSource).toContain("styleChainMeter.pips.map");
    expect(appSource).toContain('aria-label={`${styleChainMeter.label}: ${styleChainMeter.value}. ${styleChainMeter.detail}`}');
  });
});
