import type { LandingGuidanceStatus, RunStatus } from "@astro-courier/shared";

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
