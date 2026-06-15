import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildTouchFlightPadPresentation } from "./touchControls";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("touch flight pad presentation", () => {
  it("shows the flight pad only during active flying", () => {
    expect(buildTouchFlightPadPresentation({ status: "flying", preflightOpen: false })).toEqual({
      visible: true,
      tone: "active"
    });
  });

  it("hides the flight pad while overlays own the screen", () => {
    expect(buildTouchFlightPadPresentation({ status: "paused", preflightOpen: true })).toEqual({
      visible: false,
      tone: "idle"
    });
    expect(buildTouchFlightPadPresentation({ status: "delivered", preflightOpen: false })).toEqual({
      visible: false,
      tone: "idle"
    });
  });

  it("shifts tone toward precision when a clean dock is ready", () => {
    expect(
      buildTouchFlightPadPresentation({
        status: "flying",
        preflightOpen: false,
        landingStatus: "ready"
      })
    ).toEqual({
      visible: true,
      tone: "precision"
    });
  });

  it("shifts tone toward danger for hard landing or hazard pressure", () => {
    expect(
      buildTouchFlightPadPresentation({
        status: "flying",
        preflightOpen: false,
        landingStatus: "too-fast"
      }).tone
    ).toBe("danger");
    expect(
      buildTouchFlightPadPresentation({
        status: "flying",
        preflightOpen: false,
        trajectoryRiskLevel: "inside"
      }).tone
    ).toBe("danger");
  });

  it("shifts tone toward opportunity for live style windows", () => {
    expect(
      buildTouchFlightPadPresentation({
        status: "flying",
        preflightOpen: false,
        gravitySlingReady: true
      }).tone
    ).toBe("opportunity");
    expect(
      buildTouchFlightPadPresentation({
        status: "flying",
        preflightOpen: false,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 2.4
      }).tone
    ).toBe("opportunity");
  });
});

describe("touch flight pad wiring", () => {
  it("feeds live HUD pressure and opportunity signals into the touch pad tone", () => {
    expect(appSource).toMatch(
      /const touchFlightPad = buildTouchFlightPadPresentation\(\{[\s\S]*status: hud\.status,[\s\S]*preflightOpen,[\s\S]*landingStatus: hud\.landingStatus,[\s\S]*hazardDangerLevel: hud\.hazardDangerLevel,[\s\S]*trajectoryRiskLevel: hud\.trajectoryRiskLevel,[\s\S]*gravitySlingReady: hud\.gravitySlingReady,[\s\S]*styleMultiplier: hud\.styleMultiplier,[\s\S]*styleChainSecondsRemaining: hud\.styleChainSecondsRemaining[\s\S]*\}\);/
    );
  });
});
