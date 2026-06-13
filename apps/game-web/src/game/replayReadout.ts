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
};

export function buildReplayCaptureReadout(input: ReplayCaptureReadoutInput): ReplayCaptureReadout | undefined {
  if (input.status !== "flying" || input.replayFrameCount <= 0) {
    return undefined;
  }

  if (input.hasGhostTrail) {
    return {
      label: "Ghost REC",
      value: `${input.replayFrameCount} chase ${input.replayFrameCount === 1 ? "input" : "inputs"}`,
      tone: "ghost"
    };
  }

  return {
    label: "Replay REC",
    value: `${input.replayFrameCount} ${input.replayFrameCount === 1 ? "input" : "inputs"}`,
    tone: "live"
  };
}
