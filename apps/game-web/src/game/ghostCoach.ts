import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";

export type GhostCoachInput = {
  enabled: boolean;
  eligible: boolean;
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  cargoOnboard: boolean;
  targetDistance?: number;
  landingStatus?: LandingGuidanceStatus;
  speed: number;
};

export type GhostCoachCue = {
  label: "Coach";
  action: "Aim" | "Boost" | "Brake" | "Dock";
  detail: string;
  tone: "aim" | "boost" | "brake" | "dock";
};

export function buildGhostCoachCue(input: GhostCoachInput): GhostCoachCue | undefined {
  if (!input.enabled || !input.eligible || input.status === "delivered" || input.status === "crashed") {
    return undefined;
  }

  if (input.status === "paused") {
    return cue("Aim", "Set nose", "aim");
  }

  if (input.landingStatus === "too-fast") {
    return cue("Brake", "Slow dock", "brake");
  }

  if (input.objectivePhase === "delivery" && input.cargoOnboard && (input.targetDistance ?? Number.POSITIVE_INFINITY) <= 70) {
    return cue("Dock", input.landingStatus === "ready" ? "Touch down" : "Align nose", "dock");
  }

  if (input.objectivePhase === "pickup" && !input.cargoOnboard && input.speed < 10 && (input.targetDistance ?? 0) >= 120) {
    return cue("Boost", "Close gap", "boost");
  }

  return cue("Aim", input.objectivePhase === "pickup" ? "Line pickup" : "Line dock", "aim");
}

function cue(action: GhostCoachCue["action"], detail: string, tone: GhostCoachCue["tone"]): GhostCoachCue {
  return {
    label: "Coach",
    action,
    detail,
    tone
  };
}
