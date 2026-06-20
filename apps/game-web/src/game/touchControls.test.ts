import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildFlightControlPrimerItems,
  buildMobileActionLabels,
  buildTouchFlightPadPresentation,
  buildTouchPadGeometry,
  buildTouchPointerVisual,
  resolveTouchSteeringOrigin
} from "./touchControls";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("touch flight pad presentation", () => {
  it("keeps control labels explicit for first-time players", () => {
    expect(buildFlightControlPrimerItems()).toEqual([
      { id: "aim", label: "Aim", detail: "Mouse / drag" },
      { id: "thrust", label: "Thrust", detail: "Hold to fly" },
      { id: "brake", label: "Brake", detail: "Slow down" },
      { id: "boost", label: "Boost", detail: "Tap burst" },
      { id: "fire", label: "Fire", detail: "Shoot" }
    ]);
    expect(buildMobileActionLabels()).toEqual({
      steering: "Drag to fly",
      brake: "Brake",
      boost: "Boost",
      fire: "Fire"
    });
  });

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

describe("touch pointer visual", () => {
  it("stays centered when the pointer is not actively steering", () => {
    expect(
      buildTouchPointerVisual({
        active: false,
        center: { x: 200, y: 200 },
        pointer: { x: 280, y: 220 }
      })
    ).toEqual({
      active: false,
      offsetX: 0,
      offsetY: 0,
      angleDeg: 0,
      strength: 0
    });
  });

  it("converts active drag direction into clamped stick offset and vector strength", () => {
    expect(
      buildTouchPointerVisual({
        active: true,
        center: { x: 200, y: 200 },
        pointer: { x: 250, y: 200 },
        maxOffset: 32,
        fullStrengthDistance: 100
      })
    ).toEqual({
      active: true,
      offsetX: 16,
      offsetY: 0,
      angleDeg: 0,
      strength: 0.5
    });

    expect(
      buildTouchPointerVisual({
        active: true,
        center: { x: 200, y: 200 },
        pointer: { x: 200, y: 340 },
        maxOffset: 32,
        fullStrengthDistance: 100
      })
    ).toEqual({
      active: true,
      offsetX: 0,
      offsetY: 32,
      angleDeg: 90,
      strength: 1
    });
  });
});

describe("touch pad geometry", () => {
  it("centers phone steering in a low bottom zone instead of a huge joystick disk", () => {
    expect(buildTouchPadGeometry({ viewportWidth: 390, viewportHeight: 844 })).toEqual({
      size: 104,
      width: 366,
      height: 104,
      bottom: 88,
      center: {
        x: 195,
        y: 704
      }
    });
  });

  it("keeps tablet steering close to a visible lower steering strip", () => {
    expect(buildTouchPadGeometry({ viewportWidth: 760, viewportHeight: 1024 })).toEqual({
      size: 112,
      width: 420,
      height: 112,
      bottom: 96,
      center: {
        x: 380,
        y: 872
      }
    });
  });
});

describe("touch steering origin", () => {
  const phoneGeometry = buildTouchPadGeometry({ viewportWidth: 390, viewportHeight: 844 });

  it("uses the first thumb contact inside the phone steering strip as the neutral origin", () => {
    expect(
      resolveTouchSteeringOrigin({
        geometry: phoneGeometry,
        pointer: { x: 112, y: 704 }
      })
    ).toEqual({ x: 112, y: 704 });
  });

  it("falls back to the safe strip center when the contact starts outside the steering strip", () => {
    expect(
      resolveTouchSteeringOrigin({
        geometry: phoneGeometry,
        pointer: { x: 112, y: 520 }
      })
    ).toEqual({ x: 195, y: 704 });
  });
});

describe("touch flight pad wiring", () => {
  it("feeds live HUD pressure and opportunity signals into the touch pad tone", () => {
    expect(appSource).toMatch(
      /const touchFlightPad = buildTouchFlightPadPresentation\(\{[\s\S]*status: hud\.status,[\s\S]*preflightOpen,[\s\S]*landingStatus: hud\.landingStatus,[\s\S]*hazardDangerLevel: hud\.hazardDangerLevel,[\s\S]*trajectoryRiskLevel: hud\.trajectoryRiskLevel,[\s\S]*gravitySlingReady: hud\.gravitySlingReady,[\s\S]*styleMultiplier: hud\.styleMultiplier,[\s\S]*styleChainSecondsRemaining: hud\.styleChainSecondsRemaining[\s\S]*\}\);/
    );
  });

  it("feeds pointer drag visuals into touch pad CSS variables", () => {
    expect(appSource).toContain("const touchPointerStyle = {");
    expect(appSource).toContain("buildTouchPadGeometry({");
    expect(appSource).toContain("touchPointerOriginRef");
    expect(appSource).toContain("resolveTouchSteeringOrigin({");
    expect(appSource).toContain('"--touch-stick-x": `${touchPointer.offsetX}px`');
    expect(appSource).toContain('"--touch-stick-y": `${touchPointer.offsetY}px`');
    expect(appSource).toContain('"--touch-vector-angle": `${touchPointer.angleDeg}deg`');
    expect(appSource).toContain('"--touch-vector-strength": touchPointer.strength');
    expect(appSource).toContain("style={touchPointerStyle}");
  });

  it("renders explicit labeled mobile action buttons for brake, boost, and fire", () => {
    expect(appSource).toContain('className="mobile-action-dock"');
    expect(appSource).toContain('className="touch-flight-pad-label"');
    expect(appSource).toContain("mobile-action-brake");
    expect(appSource).toContain("mobile-action-boost");
    expect(appSource).toContain("mobile-action-fire");
    expect(appSource).toContain("{mobileActionLabels.steering}");
    expect(appSource).toContain("{mobileActionLabels.brake}");
    expect(appSource).toContain("{mobileActionLabels.boost}");
    expect(appSource).toContain("{mobileActionLabels.fire}");
    expect(appSource).toContain('shellRef.current?.queueCommand({ type: "FIRE" })');
  });
});
