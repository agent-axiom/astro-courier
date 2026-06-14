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
  const styleFeedback = buildStyleMilestoneFeedback(milestone);
  if (styleFeedback) {
    return styleFeedback;
  }

  if (milestone === "Launch Burst") {
    return buildScreenFeedback(["launch-burst"]);
  }

  if (milestone === "Boost Burn") {
    return buildScreenFeedback(["boost-burn"]);
  }

  return undefined;
}

export function buildScreenFeedback(events: readonly GameAudioEvent[], milestone?: string): ScreenFeedback | undefined {
  if (events.includes("ship-crash")) {
    return { label: "Insurance event", value: "Recover line", tone: "danger", intensity: "heavy", durationMs: 520 };
  }
  if (events.includes("delivery-complete")) {
    return { label: "Delivery sealed", value: "Manifest closed", tone: "success", intensity: "heavy", durationMs: 620 };
  }
  if (events.includes("cargo-loaded")) {
    return { label: "Cargo secured", value: "Outbound line", tone: "success", intensity: "medium", durationMs: 360 };
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
    return { tone: "style", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("pb-pressure")) {
    return { tone: "style", intensity: "medium", durationMs: 360 };
  }
  if (events.includes("comet-armed")) {
    return { label: "Comet dock", value: "Perfect line armed", tone: "style", intensity: "medium", durationMs: 460 };
  }
  if (events.includes("perfect-approach-ready")) {
    return { label: "Perfect setup", value: "Soft dock armed", tone: "style", intensity: "medium", durationMs: 420 };
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
  if (events.includes("trajectory-clear")) {
    return { label: "Vector clear", value: "Line recovered", tone: "success", intensity: "light", durationMs: 300 };
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
  if (events.includes("assist-burn")) {
    return { label: "Assist burn", value: "Vector trim", tone: "style", intensity: "light", durationMs: 320 };
  }
  if (events.includes("style-hit")) {
    return buildStyleMilestoneFeedback(milestone) ?? { label: "Style hit", value: "Bonus banked", tone: "style", intensity: "light", durationMs: 360 };
  }
  return undefined;
}

function buildStyleMilestoneFeedback(milestone: string | undefined): ScreenFeedback | undefined {
  switch (milestone) {
    case "Clean Hazard Skim":
      return { label: "Clean skim", value: "Danger pay", tone: "style", intensity: "medium", durationMs: 440 };
    case "Needle Thread":
      return { label: "Needle thread", value: "Clean gap", tone: "style", intensity: "medium", durationMs: 440 };
    case "Gravity Sling":
      return { label: "Gravity sling", value: "Arc held", tone: "style", intensity: "medium", durationMs: 440 };
    case "Quick Pickup":
      return { label: "Quick pickup", value: "Rush banked", tone: "style", intensity: "medium", durationMs: 420 };
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
    default:
      return undefined;
  }
}
