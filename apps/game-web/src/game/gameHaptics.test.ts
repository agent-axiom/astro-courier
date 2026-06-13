import { describe, expect, it, vi } from "vitest";
import { createGameHapticsController, hapticPatternForEvents } from "./gameHaptics";

describe("game haptics", () => {
  it("maps gameplay event batches to tactile patterns by priority", () => {
    expect(hapticPatternForEvents(["boost-burn"])).toEqual([12]);
    expect(hapticPatternForEvents(["style-hit"])).toEqual([14]);
    expect(hapticPatternForEvents(["launch-burst"])).toEqual([18, 18]);
    expect(hapticPatternForEvents(["pb-lead"])).toEqual([16, 20, 16]);
    expect(hapticPatternForEvents(["chain-critical"])).toEqual([10, 18, 10]);
    expect(hapticPatternForEvents(["medal-drop"])).toEqual([18, 28]);
    expect(hapticPatternForEvents(["fuel-critical"])).toEqual([24, 30, 24]);
    expect(hapticPatternForEvents(["trajectory-warning"])).toEqual([18, 24, 18]);
    expect(hapticPatternForEvents(["hazard-contact"])).toEqual([30, 32, 36]);
    expect(hapticPatternForEvents(["style-hit", "ship-crash"])).toEqual([45, 45, 65]);
    expect(hapticPatternForEvents([])).toBeUndefined();
  });

  it("uses navigator vibration only when a pattern exists and vibration is available", () => {
    const vibrate = vi.fn(() => true);
    const controller = createGameHapticsController({ vibrate });

    controller.play([]);
    controller.play(["boost-burn"]);

    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith([12]);
  });
});
