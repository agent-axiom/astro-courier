import type { GameAudioEvent } from "./audioEvents";

export type ScreenFeedback = {
  label?: string;
  value?: string;
  accent?: "chain";
  tone: "style" | "success" | "warning" | "danger";
  intensity: "light" | "medium" | "heavy";
  durationMs: number;
};

export function buildMilestoneScreenFeedback(milestone: string | undefined): ScreenFeedback | undefined {
  if (milestone === "Launch Burst") {
    return buildScreenFeedback(["launch-burst"]);
  }

  if (milestone === "Boost Burn") {
    return buildScreenFeedback(["boost-burn"]);
  }

  return undefined;
}

export function buildScreenFeedback(events: readonly GameAudioEvent[]): ScreenFeedback | undefined {
  if (events.includes("ship-crash")) {
    return { label: "Insurance event", value: "Recover line", tone: "danger", intensity: "heavy", durationMs: 520 };
  }
  if (events.includes("delivery-complete")) {
    return { label: "Delivery sealed", value: "Manifest closed", tone: "success", intensity: "heavy", durationMs: 620 };
  }
  if (events.includes("cargo-loaded")) {
    return { label: "Cargo secured", value: "Outbound line", tone: "success", intensity: "medium", durationMs: 360 };
  }
  if (events.includes("ghost-pass")) {
    return { label: "Ghost passed", value: "Keep it clean", tone: "success", intensity: "heavy", durationMs: 520 };
  }
  if (events.includes("pb-lead")) {
    return { label: "PB lead", value: "Hold pace", tone: "success", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("ghost-pressure")) {
    return { tone: "style", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("pb-pressure")) {
    return { tone: "style", intensity: "medium", durationMs: 360 };
  }
  if (events.includes("comet-armed")) {
    return { label: "Comet dock", value: "Perfect line armed", tone: "style", intensity: "medium", durationMs: 460 };
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
  if (events.includes("medal-drop")) {
    return { label: "Pace slipping", value: "Recover medal", tone: "warning", intensity: "medium", durationMs: 360 };
  }
  if (events.includes("comet-reserve-tight")) {
    return { label: "Comet reserve", value: "Coast now", tone: "warning", intensity: "medium", durationMs: 380 };
  }
  if (events.includes("chain-critical")) {
    return { label: "Chain critical", value: "Save it", tone: "warning", intensity: "light", durationMs: 320 };
  }
  if (events.includes("chain-save")) {
    return { label: "Chain saved", value: "Combo restored", accent: "chain", tone: "style", intensity: "medium", durationMs: 440 };
  }
  if (events.includes("fuel-critical")) {
    return { label: "Fuel critical", value: "Coast now", tone: "warning", intensity: "medium", durationMs: 440 };
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
  if (events.includes("style-hit") || events.includes("assist-burn")) {
    return { tone: "style", intensity: "light", durationMs: 360 };
  }
  return undefined;
}
