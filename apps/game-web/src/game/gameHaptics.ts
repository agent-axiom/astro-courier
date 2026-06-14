import type { GameAudioEvent } from "./audioEvents";

export type HapticPattern = number[];

export type GameHapticsController = {
  play: (events: readonly GameAudioEvent[]) => void;
};

export type GameHapticsControllerOptions = {
  vibrate?: (pattern: HapticPattern) => boolean;
};

export function hapticPatternForEvents(events: readonly GameAudioEvent[]): HapticPattern | undefined {
  if (events.includes("ship-crash")) {
    return [45, 45, 65];
  }
  if (events.includes("delivery-complete")) {
    return [20, 30, 20];
  }
  if (events.includes("hazard-contact")) {
    return [30, 32, 36];
  }
  if (events.includes("fuel-critical")) {
    return [24, 30, 24];
  }
  if (events.includes("trajectory-warning")) {
    return [18, 24, 18];
  }
  if (events.includes("trajectory-caution")) {
    return [8, 12];
  }
  if (events.includes("thread-window")) {
    return [10, 10];
  }
  if (events.includes("trajectory-clear")) {
    return [8, 8];
  }
  if (events.includes("medal-drop")) {
    return [18, 28];
  }
  if (events.includes("comet-reserve-lost")) {
    return [24, 26, 34];
  }
  if (events.includes("comet-reserve-tight")) {
    return [14, 22, 14];
  }
  if (events.includes("cargo-damage")) {
    return [16, 24];
  }
  if (events.includes("cargo-loaded")) {
    return [10, 12];
  }
  if (events.includes("dock-lineup")) {
    return [9, 12];
  }
  if (events.includes("pickup-lineup")) {
    return [8, 10];
  }
  if (events.includes("pb-lead")) {
    return [16, 20, 16];
  }
  if (events.includes("ghost-pass")) {
    return [18, 20, 18, 20];
  }
  if (events.includes("comet-armed")) {
    return [12, 16, 12];
  }
  if (events.includes("perfect-approach-ready")) {
    return [10, 12, 10];
  }
  if (events.includes("ghost-pressure")) {
    return [10, 14, 10, 14];
  }
  if (events.includes("pb-pressure")) {
    return [12, 18, 12];
  }
  if (events.includes("chain-critical")) {
    return [12, 24, 12, 24];
  }
  if (events.includes("chain-save")) {
    return [12, 14, 12];
  }
  if (events.includes("launch-burst")) {
    return [18, 18];
  }
  if (events.includes("style-hit") || events.includes("assist-burn")) {
    return [14];
  }
  if (events.includes("boost-burn")) {
    return [12];
  }
  return undefined;
}

export function createGameHapticsController(options: GameHapticsControllerOptions = {}): GameHapticsController {
  const vibrate = options.vibrate ?? browserVibrate;

  return {
    play: (events) => {
      const pattern = hapticPatternForEvents(events);
      if (pattern) {
        vibrate?.(pattern);
      }
    }
  };
}

function browserVibrate(pattern: HapticPattern): boolean {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return false;
  }

  return navigator.vibrate(pattern);
}
