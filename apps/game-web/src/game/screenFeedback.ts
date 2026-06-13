import type { GameAudioEvent } from "./audioEvents";

export type ScreenFeedback = {
  tone: "style" | "success" | "warning" | "danger";
  intensity: "light" | "medium" | "heavy";
  durationMs: number;
};

export function buildScreenFeedback(events: readonly GameAudioEvent[]): ScreenFeedback | undefined {
  if (events.includes("ship-crash")) {
    return { tone: "danger", intensity: "heavy", durationMs: 520 };
  }
  if (events.includes("delivery-complete")) {
    return { tone: "success", intensity: "heavy", durationMs: 620 };
  }
  if (events.includes("pb-lead")) {
    return { tone: "success", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("pb-pressure")) {
    return { tone: "style", intensity: "medium", durationMs: 360 };
  }
  if (events.includes("hazard-contact")) {
    return { tone: "danger", intensity: "medium", durationMs: 440 };
  }
  if (events.includes("trajectory-warning")) {
    return { tone: "warning", intensity: "medium", durationMs: 380 };
  }
  if (events.includes("medal-drop")) {
    return { tone: "warning", intensity: "medium", durationMs: 360 };
  }
  if (events.includes("chain-critical")) {
    return { tone: "warning", intensity: "light", durationMs: 320 };
  }
  if (events.includes("fuel-critical")) {
    return { tone: "warning", intensity: "medium", durationMs: 440 };
  }
  if (events.includes("cargo-damage")) {
    return { tone: "warning", intensity: "medium", durationMs: 400 };
  }
  if (events.includes("launch-burst")) {
    return { tone: "style", intensity: "medium", durationMs: 420 };
  }
  if (events.includes("boost-burn")) {
    return { tone: "style", intensity: "light", durationMs: 300 };
  }
  if (events.includes("style-hit") || events.includes("assist-burn")) {
    return { tone: "style", intensity: "light", durationMs: 360 };
  }
  return undefined;
}
