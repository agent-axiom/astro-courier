import type { RunStatus } from "@astro-courier/shared";

export type ReplayCaptureReadout = {
  label: "Ghost REC" | "Replay REC";
  value: string;
  tone: "ghost" | "live";
};

export type ReplayCaptureReadoutInput = {
  status: RunStatus;
  replayFrameCount: number;
  hasGhostTrail?: boolean;
  score?: number;
  bestRunScore?: number;
};

export function buildReplayCaptureReadout(input: ReplayCaptureReadoutInput): ReplayCaptureReadout | undefined {
  if (input.status !== "flying" || input.replayFrameCount <= 0) {
    return undefined;
  }

  if (input.hasGhostTrail) {
    const ghostPressure = buildGhostPressureCopy(input);
    const inputCopy = `${input.replayFrameCount} ${input.replayFrameCount === 1 ? "input" : "inputs"}`;
    return {
      label: "Ghost REC",
      value: ghostPressure ? `${ghostPressure} / ${inputCopy}` : `${input.replayFrameCount} chase ${input.replayFrameCount === 1 ? "input" : "inputs"}`,
      tone: "ghost"
    };
  }

  return {
    label: "Replay REC",
    value: `${input.replayFrameCount} ${input.replayFrameCount === 1 ? "input" : "inputs"}`,
    tone: "live"
  };
}

function buildGhostPressureCopy(input: ReplayCaptureReadoutInput): string | undefined {
  if (input.score === undefined || input.bestRunScore === undefined) {
    return undefined;
  }

  const scoreDelta = Math.round(input.score - input.bestRunScore);
  if (scoreDelta >= 0) {
    return `+${scoreDelta} ghost lead`;
  }

  return `${Math.abs(scoreDelta)} behind ghost`;
}
