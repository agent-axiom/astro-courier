import type { RunStatus } from "@astro-courier/shared";

export type PauseOverlayActionId = "resume" | "restart" | "briefing";

export type PauseOverlayAction = {
  id: PauseOverlayActionId;
  icon: "play" | "restart" | "route";
  label: string;
  tone: "primary" | "secondary";
};

export type PauseOverlayStat = {
  label: string;
  value: string;
};

export type PauseOverlayPresentation = {
  title: string;
  detail: string;
  stats: PauseOverlayStat[];
  actions: PauseOverlayAction[];
};

export type PauseOverlayInput = {
  status: RunStatus;
  preflightOpen: boolean;
  resultOpen: boolean;
  contractTitle: string;
  elapsedSeconds: number;
  score: number;
  cargoIntegrity: number;
};

export function buildPauseOverlayPresentation(input: PauseOverlayInput): PauseOverlayPresentation | undefined {
  if (input.status !== "paused" || input.preflightOpen || input.resultOpen) {
    return undefined;
  }

  return {
    title: "Route Paused",
    detail: input.contractTitle,
    stats: [
      { label: "Time", value: `${input.elapsedSeconds.toFixed(1)}s` },
      { label: "Score", value: `${Math.round(input.score)}` },
      { label: "Cargo", value: `${Math.round(Math.max(0, Math.min(1, input.cargoIntegrity)) * 100)}%` }
    ],
    actions: [
      { id: "resume", icon: "play", label: "Resume", tone: "primary" },
      { id: "restart", icon: "restart", label: "Restart", tone: "secondary" },
      { id: "briefing", icon: "route", label: "Briefing", tone: "secondary" }
    ]
  };
}
