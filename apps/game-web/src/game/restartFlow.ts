export type RestartFlowMode = "direct-run" | "briefing";

export type RestartFlowTransition = {
  resultDismissed: boolean;
  preflightOpen: boolean;
  paused: boolean;
  shellRestartPaused: boolean;
};

export function buildRestartFlowTransition(mode: RestartFlowMode): RestartFlowTransition {
  if (mode === "briefing") {
    return {
      resultDismissed: false,
      preflightOpen: true,
      paused: true,
      shellRestartPaused: true
    };
  }

  return {
    resultDismissed: true,
    preflightOpen: false,
    paused: false,
    shellRestartPaused: false
  };
}
