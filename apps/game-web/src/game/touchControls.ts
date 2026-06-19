import type { LandingGuidanceStatus, RunStatus } from "@astro-courier/shared";

export type TouchPoint = {
  x: number;
  y: number;
};

export type TouchFlightPadPresentation = {
  visible: boolean;
  tone: "active" | "danger" | "idle" | "opportunity" | "precision";
};

export type TouchFlightPadPresentationInput = {
  status: RunStatus;
  preflightOpen: boolean;
  landingStatus?: LandingGuidanceStatus;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
  gravitySlingReady?: boolean;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type TouchPointerVisualInput = {
  active: boolean;
  center: TouchPoint;
  pointer: TouchPoint;
  maxOffset?: number;
  fullStrengthDistance?: number;
};

export type TouchPadGeometryInput = {
  viewportWidth: number;
  viewportHeight: number;
  safeAreaBottom?: number;
};

export type TouchPadGeometry = {
  size: number;
  width: number;
  height: number;
  bottom: number;
  center: TouchPoint;
};

export type TouchPointerVisual = {
  active: boolean;
  offsetX: number;
  offsetY: number;
  angleDeg: number;
  strength: number;
};

export function buildTouchFlightPadPresentation(input: TouchFlightPadPresentationInput): TouchFlightPadPresentation {
  const visible = input.status === "flying" && !input.preflightOpen;
  if (!visible) {
    return {
      visible,
      tone: "idle"
    };
  }

  if (
    input.landingStatus === "too-fast" ||
    input.hazardDangerLevel !== undefined ||
    input.trajectoryRiskLevel !== undefined
  ) {
    return {
      visible,
      tone: "danger"
    };
  }

  if (input.landingStatus === "ready") {
    return {
      visible,
      tone: "precision"
    };
  }

  if (
    input.gravitySlingReady === true ||
    ((input.styleMultiplier ?? 1) > 1 && (input.styleChainSecondsRemaining ?? 0) > 0)
  ) {
    return {
      visible,
      tone: "opportunity"
    };
  }

  return {
    visible,
    tone: "active"
  };
}

export function buildTouchPointerVisual(input: TouchPointerVisualInput): TouchPointerVisual {
  if (!input.active) {
    return centeredTouchPointerVisual();
  }

  const dx = input.pointer.x - input.center.x;
  const dy = input.pointer.y - input.center.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0) {
    return {
      ...centeredTouchPointerVisual(),
      active: true
    };
  }

  const maxOffset = input.maxOffset ?? 32;
  const fullStrengthDistance = input.fullStrengthDistance ?? 100;
  const strength = clamp(distance / fullStrengthDistance, 0, 1);
  const offsetDistance = maxOffset * strength;

  return {
    active: true,
    offsetX: round((dx / distance) * offsetDistance, 2),
    offsetY: round((dy / distance) * offsetDistance, 2),
    angleDeg: round((Math.atan2(dy, dx) * 180) / Math.PI, 2),
    strength: round(strength, 2)
  };
}

export function buildTouchPadGeometry(input: TouchPadGeometryInput): TouchPadGeometry {
  const safeAreaBottom = input.safeAreaBottom ?? 0;
  const isPhone = input.viewportWidth <= 480;
  const isTablet = input.viewportWidth <= 760;
  const width = isPhone ? Math.min(input.viewportWidth - 24, 366) : isTablet ? Math.min(input.viewportWidth - 28, 420) : 116;
  const height = isPhone ? 104 : isTablet ? 112 : 116;
  const bottom = isPhone
    ? Math.max(88, safeAreaBottom + 84)
    : isTablet
      ? Math.max(96, safeAreaBottom + 84)
      : Math.max(28, safeAreaBottom + 24);
  const size = height;

  return {
    size: round(size, 2),
    width: round(width, 2),
    height: round(height, 2),
    bottom: round(bottom, 2),
    center: {
      x: round(input.viewportWidth / 2, 2),
      y: round(input.viewportHeight - bottom - height / 2, 2)
    }
  };
}

function centeredTouchPointerVisual(): TouchPointerVisual {
  return {
    active: false,
    offsetX: 0,
    offsetY: 0,
    angleDeg: 0,
    strength: 0
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
