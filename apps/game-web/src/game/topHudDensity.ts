import type { LandingGuidanceStatus, RunStatus } from "@astro-courier/shared";

export type TopHudDensityInput = {
  status: RunStatus;
  preflightOpen: boolean;
  resultOpen: boolean;
};

export type TopHudDensity = {
  mode: "compact" | "full";
  visible: boolean;
  showBrandCopy: boolean;
  showMetricLabels: boolean;
};

export type TopHudSpeedToneInput = {
  speed: number;
  landingStatus?: LandingGuidanceStatus;
};

export type TopHudSpeedTone = "normal" | "warning";

export function buildTopHudDensity(input: TopHudDensityInput): TopHudDensity {
  const compact = input.status === "flying" && !input.preflightOpen && !input.resultOpen;
  const visible = !input.preflightOpen;

  return {
    mode: compact ? "compact" : "full",
    visible,
    showBrandCopy: visible && !compact,
    showMetricLabels: visible && !compact
  };
}

export function buildTopHudSpeedTone(input: TopHudSpeedToneInput): TopHudSpeedTone {
  return input.landingStatus === "too-fast" ? "warning" : "normal";
}
