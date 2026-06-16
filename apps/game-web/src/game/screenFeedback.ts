import type { RunStatus } from "@astro-courier/shared";
import type { GameAudioEvent } from "./audioEvents";
import type { RouteBoardCampaignMilestoneReceipt, RouteMarkReceipt } from "./bestRun";
import type { DailyDispatchProgressReceipt } from "./contracts";

export type ScreenFeedback = {
  label?: string;
  value?: string;
  accent?: "chain" | "fuel" | "precision" | "rush" | "sling" | "tempo";
  tone: "style" | "success" | "warning" | "danger";
  intensity: "light" | "medium" | "heavy";
  durationMs: number;
};

export type ProgressReceiptScreenFeedbackInput = {
  campaignMilestoneReceipt?: RouteBoardCampaignMilestoneReceipt;
  routeMarkReceipt?: RouteMarkReceipt;
  dailyProgressReceipt?: DailyDispatchProgressReceipt;
};

export type PauseResumeScreenFeedbackInput = {
  status: RunStatus;
  wasPaused: boolean;
  nextPaused: boolean;
  preflightOpen: boolean;
  resultOpen: boolean;
};

export type LaunchScreenFeedbackInput = {
  status: RunStatus;
  preflightOpen: boolean;
  resultOpen: boolean;
};

export function buildMilestoneScreenFeedback(milestone: string | undefined): ScreenFeedback | undefined {
  const styleFeedback = buildStyleMilestoneFeedback(milestone);
  if (styleFeedback) {
    return styleFeedback;
  }

  if (milestone === "Launch Burst") {
    return buildScreenFeedback(["launch-burst"]);
  }

  if (milestone === "Assist Burn") {
    return buildScreenFeedback(["assist-burn"]);
  }

  if (milestone === "Boost Burn") {
    return buildScreenFeedback(["boost-burn"]);
  }

  return undefined;
}

export function buildRouteMarkScreenFeedback(receipt: RouteMarkReceipt | undefined): ScreenFeedback | undefined {
  if (!receipt) {
    return undefined;
  }

  if (receipt.tone === "ghost") {
    return { label: "Ghost mark", value: "PB trail captured", tone: "success", intensity: "heavy", durationMs: 600 };
  }

  if (receipt.tone === "comet") {
    return { label: "Comet mark", value: "Route upgraded", tone: "style", intensity: "heavy", durationMs: 560 };
  }

  return { label: "Route mark", value: "Clear banked", tone: "success", intensity: "medium", durationMs: 500 };
}

export function buildCampaignMilestoneScreenFeedback(
  receipt: RouteBoardCampaignMilestoneReceipt | undefined
): ScreenFeedback | undefined {
  if (!receipt) {
    return undefined;
  }

  if (receipt.tone === "complete") {
    return {
      label: "Campaign mastered",
      value: "Full route board",
      tone: "success",
      intensity: "heavy",
      durationMs: 700
    };
  }

  if (receipt.tone === "mastery") {
    return {
      label: receipt.label,
      value: receipt.value,
      tone: "style",
      intensity: "heavy",
      durationMs: 620
    };
  }

  return {
    label: receipt.label,
    value: receipt.value,
    tone: "success",
    intensity: "medium",
    durationMs: 540
  };
}

export function buildProgressReceiptScreenFeedback(
  input: ProgressReceiptScreenFeedbackInput
): ScreenFeedback | undefined {
  return (
    buildCampaignMilestoneScreenFeedback(input.campaignMilestoneReceipt) ??
    buildRouteMarkScreenFeedback(input.routeMarkReceipt) ??
    buildDailyDispatchScreenFeedback(input.dailyProgressReceipt)
  );
}

export function buildDailyDispatchScreenFeedback(receipt: DailyDispatchProgressReceipt | undefined): ScreenFeedback | undefined {
  if (!receipt) {
    return undefined;
  }

  if (receipt.tone === "streak") {
    return {
      label: receipt.label,
      value: `${receipt.value} banked`,
      tone: "style",
      intensity: "heavy",
      durationMs: 560
    };
  }

  return {
    label: receipt.label,
    value: receipt.value,
    tone: "success",
    intensity: "medium",
    durationMs: 500
  };
}

export function buildPauseResumeScreenFeedback(input: PauseResumeScreenFeedbackInput): ScreenFeedback | undefined {
  if (input.status !== "paused" || !input.wasPaused || input.nextPaused || input.preflightOpen || input.resultOpen) {
    return undefined;
  }

  return {
    label: "Route live",
    value: "Controls armed",
    tone: "success",
    intensity: "light",
    durationMs: 300
  };
}

export function buildLaunchScreenFeedback(input: LaunchScreenFeedbackInput): ScreenFeedback | undefined {
  if (input.status !== "paused" || !input.preflightOpen || input.resultOpen) {
    return undefined;
  }

  return {
    label: "Route live",
    value: "Launch vector",
    tone: "success",
    intensity: "medium",
    durationMs: 360
  };
}

export function buildScreenFeedback(events: readonly GameAudioEvent[], milestone?: string): ScreenFeedback | undefined {
  if (events.includes("ship-crash")) {
    return { label: "Insurance event", value: "Recover line", tone: "danger", intensity: "heavy", durationMs: 520 };
  }
  if (events.includes("delivery-complete")) {
    return {
      label: "Delivery sealed",
      value: "Manifest closed",
      accent: "precision",
      tone: "success",
      intensity: "heavy",
      durationMs: 620
    };
  }
  if (events.includes("cargo-loaded")) {
    return {
      label: "Cargo secured",
      value: "Outbound line",
      accent: "rush",
      tone: "success",
      intensity: "medium",
      durationMs: 360
    };
  }
  if (events.includes("shield-rebound")) {
    return { label: "Shield rebound", value: "Recover route", tone: "warning", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("dock-lineup")) {
    return { label: "Dock lined", value: "Commit approach", tone: "success", intensity: "light", durationMs: 340 };
  }
  if (events.includes("pickup-lineup")) {
    return { label: "Pickup lined", value: "Load window", tone: "success", intensity: "light", durationMs: 320 };
  }
  if (events.includes("ghost-pass")) {
    return { label: "Ghost passed", value: "Keep it clean", tone: "success", intensity: "heavy", durationMs: 520 };
  }
  if (events.includes("pb-lead")) {
    return { label: "PB lead", value: "Hold pace", tone: "success", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("ghost-pressure")) {
    return { label: "Ghost pressure", value: "Close the gap", tone: "style", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("pb-pressure")) {
    return { label: "PB pressure", value: "Close the gap", tone: "style", intensity: "medium", durationMs: 360 };
  }
  if (events.includes("comet-armed")) {
    return { label: "Comet dock", value: "Perfect line armed", tone: "style", intensity: "medium", durationMs: 460 };
  }
  if (events.includes("last-drop-armed")) {
    return { label: "Last drop", value: "Dock empty", accent: "fuel", tone: "style", intensity: "heavy", durationMs: 500 };
  }
  if (events.includes("express-close")) {
    return { label: "Express close", value: "Dock now", tone: "warning", intensity: "medium", durationMs: 400 };
  }
  if (events.includes("antimatter-armed")) {
    return { label: "Drift armed", value: "No brake dock", accent: "precision", tone: "style", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("perfect-approach-ready")) {
    return {
      label: "Perfect setup",
      value: "Soft dock armed",
      accent: "precision",
      tone: "style",
      intensity: "medium",
      durationMs: 420
    };
  }
  if (events.includes("tempo-flow")) {
    return { label: "Tempo flow", value: "Hold line", accent: "tempo", tone: "success", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("tempo-clutch")) {
    return { label: "Tempo clutch", value: "Cash soon", accent: "tempo", tone: "warning", intensity: "medium", durationMs: 400 };
  }
  if (events.includes("hazard-contact")) {
    return { label: "Hazard contact", value: "Burn out", tone: "danger", intensity: "medium", durationMs: 440 };
  }
  if (events.includes("trajectory-warning") && events.includes("cargo-damage")) {
    return { label: "Cargo vector", value: "Clear hazard", tone: "warning", intensity: "heavy", durationMs: 460 };
  }
  if (events.includes("trajectory-warning")) {
    return { label: "Vector warning", value: "Change line", tone: "warning", intensity: "medium", durationMs: 380 };
  }
  if (events.includes("trajectory-caution")) {
    return { label: "Vector caution", value: "Thread line", tone: "warning", intensity: "light", durationMs: 300 };
  }
  if (events.includes("thread-window") && events.includes("chain-critical")) {
    return { label: "Thread chain", value: "Cash the gap", accent: "chain", tone: "style", intensity: "heavy", durationMs: 500 };
  }
  if (events.includes("thread-window")) {
    return { label: "Thread window", value: "Needle gap", accent: "precision", tone: "style", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("clean-escape")) {
    return { label: "Clean escape", value: "Hazard dodged", accent: "precision", tone: "success", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("trajectory-clear")) {
    return { label: "Vector clear", value: "Line recovered", tone: "success", intensity: "light", durationMs: 300 };
  }
  if (events.includes("medal-drop")) {
    return { label: "Pace slipping", value: "Recover medal", tone: "warning", intensity: "medium", durationMs: 360 };
  }
  if (events.includes("comet-reserve-lost")) {
    return { label: "Comet lost", value: "Bank more fuel", tone: "danger", intensity: "heavy", durationMs: 460 };
  }
  if (events.includes("comet-reserve-tight")) {
    return { label: "Comet reserve", value: "Coast now", tone: "warning", intensity: "medium", durationMs: 380 };
  }
  if (events.includes("chain-critical")) {
    return { label: "Chain critical", value: "Cash out now", accent: "chain", tone: "warning", intensity: "medium", durationMs: 380 };
  }
  if (events.includes("chain-save")) {
    return { label: "Chain saved", value: "Combo restored", accent: "chain", tone: "style", intensity: "medium", durationMs: 440 };
  }
  if (events.includes("fuel-critical")) {
    return { label: "Fuel critical", value: "Coast now", tone: "warning", intensity: "medium", durationMs: 440 };
  }
  if (events.includes("cargo-shock")) {
    return { label: "Brake shock", value: "Volatile load", tone: "warning", intensity: "medium", durationMs: 360 };
  }
  if (events.includes("cargo-stress")) {
    return { label: "Cargo stress", value: "Smooth inputs", tone: "warning", intensity: "light", durationMs: 320 };
  }
  if (events.includes("cargo-damage")) {
    return { label: "Cargo hit", value: "Keep control", tone: "warning", intensity: "medium", durationMs: 400 };
  }
  if (events.includes("launch-burst")) {
    return { label: "Launch burst", value: "+120 style", tone: "style", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("boost-burn")) {
    return { label: "Impulse burn", value: "Vector kick", tone: "style", intensity: "light", durationMs: 300 };
  }
  if (events.includes("assist-burn")) {
    return { label: "Assist burn", value: "Vector trim", tone: "style", intensity: "light", durationMs: 320 };
  }
  if (events.includes("antimatter-drift")) {
    return buildStyleMilestoneFeedback(milestone ?? "Antimatter Drift");
  }
  if (events.includes("style-hit")) {
    return buildStyleMilestoneFeedback(milestone) ?? { label: "Style hit", value: "Bonus banked", tone: "style", intensity: "light", durationMs: 360 };
  }
  return undefined;
}

function buildStyleMilestoneFeedback(milestone: string | undefined): ScreenFeedback | undefined {
  switch (milestone) {
    case "Clean Hazard Skim":
      return { label: "Clean skim", value: "Danger pay", accent: "precision", tone: "style", intensity: "medium", durationMs: 440 };
    case "Needle Thread":
      return { label: "Needle thread", value: "Clean gap", accent: "precision", tone: "style", intensity: "medium", durationMs: 440 };
    case "Gravity Sling":
      return { label: "Gravity sling", value: "Arc held", accent: "sling", tone: "style", intensity: "medium", durationMs: 440 };
    case "Quick Pickup":
      return { label: "Quick pickup", value: "Rush banked", accent: "rush", tone: "style", intensity: "medium", durationMs: 420 };
    case "Comet Finish":
      return { label: "Comet finish", value: "Perfect delivery", tone: "style", intensity: "heavy", durationMs: 560 };
    case "Perfect Approach":
      return { label: "Perfect approach", value: "Soft dock", tone: "style", intensity: "medium", durationMs: 460 };
    case "Eco Drift":
      return { label: "Eco drift", value: "Fuel banked", tone: "style", intensity: "medium", durationMs: 420 };
    case "Chain Finish":
      return { label: "Chain finish", value: "Combo delivered", accent: "chain", tone: "style", intensity: "heavy", durationMs: 560 };
    case "Express Finish":
      return { label: "Express finish", value: "Time banked", tone: "style", intensity: "heavy", durationMs: 520 };
    case "Damage Control":
      return { label: "Damage control", value: "Cargo saved", tone: "style", intensity: "medium", durationMs: 460 };
    case "Last Drop":
      return { label: "Last drop", value: "Fuel miracle", tone: "style", intensity: "heavy", durationMs: 520 };
    case "No Brake Finesse":
      return { label: "No brake finesse", value: "Clean hands", tone: "style", intensity: "medium", durationMs: 460 };
    case "Antimatter Drift":
      return { label: "Antimatter drift", value: "No brake line", accent: "precision", tone: "style", intensity: "heavy", durationMs: 520 };
    default:
      return undefined;
  }
}
