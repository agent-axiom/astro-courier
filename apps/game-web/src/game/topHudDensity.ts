import type { RunStatus } from "@astro-courier/shared";

export type TopHudDensityInput = {
  status: RunStatus;
  preflightOpen: boolean;
  resultOpen: boolean;
};

export type TopHudDensity = {
  mode: "compact" | "full";
  showBrandCopy: boolean;
  showMetricLabels: boolean;
};

export function buildTopHudDensity(input: TopHudDensityInput): TopHudDensity {
  const compact = input.status === "flying" && !input.preflightOpen && !input.resultOpen;

  return {
    mode: compact ? "compact" : "full",
    showBrandCopy: !compact,
    showMetricLabels: !compact
  };
}
