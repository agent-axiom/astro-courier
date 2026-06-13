import type { RunStatus } from "@astro-courier/shared";

export type ReplayCaptureReadout = {
  label: "Replay REC";
  value: string;
  tone: "live";
};

export type ReplayCaptureReadoutInput = {
  status: RunStatus;
  replayFrameCount: number;
};

export function buildReplayCaptureReadout(input: ReplayCaptureReadoutInput): ReplayCaptureReadout | undefined {
  if (input.status !== "flying" || input.replayFrameCount <= 0) {
    return undefined;
  }

  return {
    label: "Replay REC",
    value: `${input.replayFrameCount} ${input.replayFrameCount === 1 ? "input" : "inputs"}`,
    tone: "live"
  };
}
