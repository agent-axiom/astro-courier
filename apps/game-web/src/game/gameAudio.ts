import type { GameAudioEvent } from "./audioEvents";

export type GameAudioNodeLike = {
  connect: (destination: unknown) => unknown;
};

export type GameAudioOscillatorLike = GameAudioNodeLike & {
  frequency: {
    setValueAtTime: (value: number, startTime: number) => unknown;
  };
  start: (startTime: number) => void;
  stop: (stopTime: number) => void;
};

export type GameAudioGainLike = GameAudioNodeLike & {
  gain: {
    setValueAtTime: (value: number, startTime: number) => unknown;
    linearRampToValueAtTime: (value: number, endTime: number) => unknown;
    exponentialRampToValueAtTime: (value: number, endTime: number) => unknown;
  };
};

export type GameAudioContextLike = {
  currentTime: number;
  destination: unknown;
  state: AudioContextState;
  createOscillator: () => GameAudioOscillatorLike;
  createGain: () => GameAudioGainLike;
  resume: () => Promise<void>;
  close?: () => Promise<void>;
};

export type GameAudioController = {
  unlock: () => void;
  play: (events: GameAudioEvent[]) => void;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
  destroy: () => void;
};

export type GameAudioControllerOptions = {
  createContext?: () => GameAudioContextLike | undefined;
};

const eventTones: Record<GameAudioEvent, { frequency: number; duration: number; gain: number }> = {
  "delivery-complete": { frequency: 880, duration: 0.16, gain: 0.05 },
  "ship-crash": { frequency: 120, duration: 0.24, gain: 0.06 },
  "style-hit": { frequency: 720, duration: 0.08, gain: 0.045 },
  "antimatter-drift": { frequency: 1180, duration: 0.14, gain: 0.052 },
  "antimatter-armed": { frequency: 1060, duration: 0.11, gain: 0.048 },
  "route-launch": { frequency: 640, duration: 0.15, gain: 0.048 },
  "route-resume": { frequency: 760, duration: 0.09, gain: 0.04 },
  "tempo-flow": { frequency: 920, duration: 0.08, gain: 0.04 },
  "launch-burst": { frequency: 820, duration: 0.12, gain: 0.05 },
  "cargo-loaded": { frequency: 660, duration: 0.08, gain: 0.042 },
  "pickup-lineup": { frequency: 740, duration: 0.07, gain: 0.042 },
  "dock-lineup": { frequency: 780, duration: 0.08, gain: 0.044 },
  "pb-pressure": { frequency: 760, duration: 0.1, gain: 0.045 },
  "pb-lead": { frequency: 960, duration: 0.12, gain: 0.05 },
  "ghost-pressure": { frequency: 880, duration: 0.1, gain: 0.045 },
  "ghost-pass": { frequency: 1120, duration: 0.13, gain: 0.052 },
  "comet-armed": { frequency: 1040, duration: 0.13, gain: 0.05 },
  "perfect-approach-ready": { frequency: 980, duration: 0.1, gain: 0.048 },
  "last-drop-armed": { frequency: 1020, duration: 0.14, gain: 0.052 },
  "express-close": { frequency: 620, duration: 0.11, gain: 0.046 },
  "comet-reserve-tight": { frequency: 520, duration: 0.1, gain: 0.045 },
  "comet-reserve-lost": { frequency: 360, duration: 0.14, gain: 0.052 },
  "chain-critical": { frequency: 580, duration: 0.13, gain: 0.05 },
  "chain-save": { frequency: 900, duration: 0.11, gain: 0.05 },
  "medal-drop": { frequency: 260, duration: 0.11, gain: 0.045 },
  "assist-burn": { frequency: 420, duration: 0.1, gain: 0.04 },
  "boost-burn": { frequency: 560, duration: 0.07, gain: 0.045 },
  "fuel-critical": { frequency: 220, duration: 0.14, gain: 0.05 },
  "cargo-shock": { frequency: 260, duration: 0.1, gain: 0.046 },
  "cargo-stress": { frequency: 420, duration: 0.08, gain: 0.038 },
  "cargo-damage": { frequency: 340, duration: 0.1, gain: 0.045 },
  "hazard-contact": { frequency: 160, duration: 0.14, gain: 0.055 },
  "thread-window": { frequency: 860, duration: 0.09, gain: 0.046 },
  "clean-escape": { frequency: 940, duration: 0.1, gain: 0.047 },
  "trajectory-warning": { frequency: 300, duration: 0.11, gain: 0.045 },
  "trajectory-caution": { frequency: 440, duration: 0.08, gain: 0.038 },
  "trajectory-clear": { frequency: 680, duration: 0.07, gain: 0.04 }
};

const stackedToneStepSeconds = 0.045;

export function createGameAudioController(options: GameAudioControllerOptions = {}): GameAudioController {
  const createContext = options.createContext ?? createBrowserAudioContext;
  let context: GameAudioContextLike | undefined;
  let muted = false;

  const getContext = (): GameAudioContextLike | undefined => {
    context ??= createContext();
    return context;
  };

  return {
    unlock() {
      void getContext()?.resume();
    },
    play(events) {
      if (muted || events.length === 0) {
        return;
      }
      const activeContext = getContext();
      if (!activeContext) {
        return;
      }
      if (activeContext.state === "suspended") {
        void activeContext.resume();
      }
      for (const [index, event] of events.entries()) {
        playTone(activeContext, eventTones[event], index * stackedToneStepSeconds);
      }
    },
    setMuted(nextMuted) {
      muted = nextMuted;
    },
    isMuted() {
      return muted;
    },
    destroy() {
      void context?.close?.();
      context = undefined;
    }
  };
}

function createBrowserAudioContext(): GameAudioContextLike | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const browserWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const AudioContextConstructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
  return AudioContextConstructor ? (new AudioContextConstructor() as unknown as GameAudioContextLike) : undefined;
}

function playTone(context: GameAudioContextLike, tone: { frequency: number; duration: number; gain: number }, delaySeconds = 0): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delaySeconds;
  const stop = start + tone.duration;

  oscillator.frequency.setValueAtTime(tone.frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(tone.gain, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, stop);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(stop);
}
