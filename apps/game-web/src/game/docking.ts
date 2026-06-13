export type DockingSpeedReadoutInput = {
  speed: number;
  allowedSpeed?: number;
};

export type DockingSpeedReadout = {
  label: "Dock speed";
  value: string;
  tone: "normal" | "over-limit";
};

export function buildDockingSpeedReadout(input: DockingSpeedReadoutInput): DockingSpeedReadout | undefined {
  if (input.allowedSpeed === undefined) {
    return undefined;
  }

  return {
    label: "Dock speed",
    value: `${input.speed.toFixed(1)} / ${input.allowedSpeed.toFixed(1)}`,
    tone: input.speed > input.allowedSpeed ? "over-limit" : "normal"
  };
}
