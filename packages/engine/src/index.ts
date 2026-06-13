import { createHash } from "node:crypto";
import type { InputFrame, PlayerCommand, ReplayEnvelope } from "@astro-courier/shared";

export type CommandBuffer = {
  commandsForTick(tick: number): PlayerCommand[];
  frames(): InputFrame[];
};

export function createCommandBuffer(frames: InputFrame[] = []): CommandBuffer {
  const sorted = frames
    .map((frame, index) => ({ frame, index }))
    .sort((left, right) => left.frame.tick - right.frame.tick || left.index - right.index)
    .map(({ frame }) => ({
      tick: frame.tick,
      command: normalizeCommand(frame.command)
    }));

  const byTick = new Map<number, PlayerCommand[]>();
  for (const frame of sorted) {
    const commands = byTick.get(frame.tick) ?? [];
    commands.push(frame.command);
    byTick.set(frame.tick, commands);
  }

  return {
    commandsForTick(tick) {
      return [...(byTick.get(tick) ?? [])];
    },
    frames() {
      return sorted.map((frame) => ({
        tick: frame.tick,
        command: normalizeCommand(frame.command)
      }));
    }
  };
}

export type FixedStepAccumulatorInput = {
  accumulator: number;
  deltaSeconds: number;
  fixedDt: number;
  maxSubSteps: number;
};

export type FixedStepAccumulatorResult = {
  accumulator: number;
  steps: number;
  alpha: number;
  droppedTime: number;
};

export function fixedStepAccumulator(input: FixedStepAccumulatorInput): FixedStepAccumulatorResult {
  const available = Math.max(0, input.accumulator + input.deltaSeconds);
  const maxSimulated = Math.max(0, input.fixedDt * input.maxSubSteps);
  const simulated = Math.min(available, maxSimulated);
  const steps = Math.floor(simulated / input.fixedDt);
  const accumulator = simulated - steps * input.fixedDt;
  const droppedTime = Math.max(0, available - simulated);

  return {
    accumulator,
    steps,
    alpha: input.fixedDt > 0 ? accumulator / input.fixedDt : 0,
    droppedTime
  };
}

export function checksumReplay(replay: ReplayEnvelope): string {
  return createHash("sha256").update(canonicalJson(replay)).digest("hex");
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)])
    );
  }

  return value;
}

function normalizeCommand(command: PlayerCommand): PlayerCommand {
  if (command.type === "THRUST" || command.type === "BRAKE") {
    return {
      type: command.type,
      amount: clamp(command.amount, 0, 1)
    };
  }

  if (command.type === "AIM") {
    return {
      type: "AIM",
      angle: normalizeAngle(command.angle)
    };
  }

  return command;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(angle: number): number {
  let next = angle;
  while (next <= -Math.PI) next += Math.PI * 2;
  while (next > Math.PI) next -= Math.PI * 2;
  return next;
}

