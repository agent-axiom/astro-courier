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
  destroy: () => void;
};

export type GameAudioControllerOptions = {
  createContext?: () => GameAudioContextLike | undefined;
};

const eventTones: Record<GameAudioEvent, { frequency: number; duration: number; gain: number }> = {
  "delivery-complete": { frequency: 880, duration: 0.16, gain: 0.05 },
  "ship-crash": { frequency: 120, duration: 0.24, gain: 0.06 },
  "style-hit": { frequency: 720, duration: 0.08, gain: 0.045 },
  "assist-burn": { frequency: 420, duration: 0.1, gain: 0.04 },
  "fuel-critical": { frequency: 220, duration: 0.14, gain: 0.05 },
  "hazard-contact": { frequency: 160, duration: 0.14, gain: 0.055 }
};

export function createGameAudioController(options: GameAudioControllerOptions = {}): GameAudioController {
  const createContext = options.createContext ?? createBrowserAudioContext;
  let context: GameAudioContextLike | undefined;

  const getContext = (): GameAudioContextLike | undefined => {
    context ??= createContext();
    return context;
  };

  return {
    unlock() {
      void getContext()?.resume();
    },
    play(events) {
      if (events.length === 0) {
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
