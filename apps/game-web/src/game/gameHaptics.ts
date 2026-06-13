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
