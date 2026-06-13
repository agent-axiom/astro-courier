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
  "launch-burst": { frequency: 820, duration: 0.12, gain: 0.05 },
  "pb-pressure": { frequency: 760, duration: 0.1, gain: 0.045 },
  "pb-lead": { frequency: 960, duration: 0.12, gain: 0.05 },
  "ghost-pressure": { frequency: 880, duration: 0.1, gain: 0.045 },
  "ghost-pass": { frequency: 1120, duration: 0.13, gain: 0.052 },
  "comet-armed": { frequency: 1040, duration: 0.13, gain: 0.05 },
  "chain-critical": { frequency: 640, duration: 0.09, gain: 0.045 },
  "medal-drop": { frequency: 260, duration: 0.11, gain: 0.045 },
  "assist-burn": { frequency: 420, duration: 0.1, gain: 0.04 },
  "boost-burn": { frequency: 560, duration: 0.07, gain: 0.045 },
  "fuel-critical": { frequency: 220, duration: 0.14, gain: 0.05 },
  "cargo-damage": { frequency: 340, duration: 0.1, gain: 0.045 },
  "hazard-contact": { frequency: 160, duration: 0.14, gain: 0.055 },
  "trajectory-warning": { frequency: 300, duration: 0.11, gain: 0.045 }
};

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
      for (const event of events) {
        playTone(activeContext, eventTones[event]);
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

function playTone(context: GameAudioContextLike, tone: { frequency: number; duration: number; gain: number }): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime;
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
