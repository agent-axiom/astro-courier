import { describe, expect, it, vi } from "vitest";
import {
  createGameAudioController,
  type GameAudioContextLike,
  type GameAudioGainLike,
  type GameAudioOscillatorLike
} from "./gameAudio";

describe("game audio controller", () => {
  it("lazily creates an audio context and schedules tones for events", () => {
    const context = new FakeAudioContext();
    const createContext = vi.fn(() => context);
    const controller = createGameAudioController({ createContext });

    controller.play(["style-hit"]);

    expect(createContext).toHaveBeenCalledTimes(1);
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(720);
    expect(context.oscillators[0]?.startedAt).toBe(0);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.08, 3);
  });

  it("plays a distinct warning tone for projected trajectory danger", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["trajectory-warning"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(300);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.11, 3);
  });

  it("plays a light caution tone when projected trajectory risk is near", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["trajectory-caution"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(440);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.08, 3);
  });

  it("plays a bright thread-window tone when a fast clean hazard line opens", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["thread-window"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(860);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.09, 3);
  });

  it("plays a quick release tone when projected trajectory danger clears", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["trajectory-clear"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(680);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.07, 3);
  });

  it("plays a stronger style tone for launch bursts", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["launch-burst"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(820);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.12, 3);
  });

  it("plays a bright success tone for personal-best leads", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["pb-lead"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(960);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.12, 3);
  });

  it("plays a glassy pass tone for ghost overtakes", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["ghost-pass"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(1120);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.13, 3);
  });

  it("plays a clear arming tone when the perfect approach window is ready", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["perfect-approach-ready"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(980);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.1, 3);
  });

  it("plays an anticipatory tone for personal-best pressure", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["pb-pressure"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(760);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.1, 3);
  });

  it("plays an anticipatory shimmer for ghost pressure", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["ghost-pressure"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(880);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.1, 3);
  });

  it("plays a stronger deadline tone for critical style chains", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["chain-critical"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(580);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.13, 3);
  });

  it("plays a bright restore tone when a style chain is saved", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["chain-save"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(900);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.11, 3);
  });

  it("plays a pace warning tone when a medal window drops", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["medal-drop"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(260);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.11, 3);
  });

  it("plays a tight-reserve warning tone for comet fuel pressure", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["comet-reserve-tight"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(520);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.1, 3);
  });

  it("plays a cargo warning tone when clean cargo is damaged", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["cargo-damage"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(340);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.1, 3);
  });

  it("plays a compact confirmation tone when cargo is loaded", () => {
    const context = new FakeAudioContext();
    const controller = createGameAudioController({ createContext: () => context });

    controller.play(["cargo-loaded"]);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.frequencyValue).toBe(660);
    expect(context.oscillators[0]?.stoppedAt).toBeCloseTo(0.08, 3);
  });

  it("does not create an audio context for empty event batches", () => {
    const createContext = vi.fn(() => new FakeAudioContext());
    const controller = createGameAudioController({ createContext });

    controller.play([]);

    expect(createContext).not.toHaveBeenCalled();
  });

  it("suppresses playback while muted", () => {
    const context = new FakeAudioContext();
    const createContext = vi.fn(() => context);
    const controller = createGameAudioController({ createContext });

    controller.setMuted(true);
    controller.play(["style-hit"]);

    expect(createContext).not.toHaveBeenCalled();
    expect(controller.isMuted()).toBe(true);

    controller.setMuted(false);
    controller.play(["style-hit"]);

    expect(createContext).toHaveBeenCalledTimes(1);
    expect(context.oscillators).toHaveLength(1);
  });
});

class FakeAudioContext implements GameAudioContextLike {
  readonly destination = {};
  readonly oscillators: FakeOscillator[] = [];
  readonly gains: FakeGain[] = [];
  currentTime = 0;
  state: "running" | "suspended" = "running";

  createOscillator(): GameAudioOscillatorLike {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain(): GameAudioGainLike {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  resume(): Promise<void> {
    this.state = "running";
    return Promise.resolve();
  }
}

class FakeOscillator {
  readonly frequency = {
    setValueAtTime: (value: number) => {
      this.frequencyValue = value;
    }
  };
  frequencyValue = 0;
  startedAt = 0;
  stoppedAt = 0;

  connect(): void {
    return undefined;
  }

  start(time: number): void {
    this.startedAt = time;
  }

  stop(time: number): void {
    this.stoppedAt = time;
  }
}

class FakeGain {
  readonly gain = {
    setValueAtTime: () => undefined,
    linearRampToValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined
  };

  connect(): void {
    return undefined;
  }
}
