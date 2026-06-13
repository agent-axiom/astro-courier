import type { RunStatus } from "@astro-courier/shared";

export type TouchFlightPadPresentation = {
  visible: boolean;
  tone: "active" | "idle";
};

export type TouchFlightPadPresentationInput = {
  status: RunStatus;
  preflightOpen: boolean;
};

export function buildTouchFlightPadPresentation(input: TouchFlightPadPresentationInput): TouchFlightPadPresentation {
  const visible = input.status === "flying" && !input.preflightOpen;
  return {
    visible,
    tone: visible ? "active" : "idle"
  };
}
