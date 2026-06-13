import type { RunStatus } from "@astro-courier/shared";

export type OverlayVisibilityInput = {
  status: RunStatus;
  preflightOpen: boolean;
};

export type OverlayVisibility = {
  preflight: boolean;
  result: boolean;
};

export function getOverlayVisibility(input: OverlayVisibilityInput): OverlayVisibility {
  const runFinished = input.status === "delivered" || input.status === "crashed";

  return {
    preflight: input.preflightOpen,
    result: runFinished && !input.preflightOpen
  };
}
