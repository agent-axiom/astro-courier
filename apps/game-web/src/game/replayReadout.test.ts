import { describe, expect, it } from "vitest";
import { buildReplayCaptureReadout } from "./replayReadout";

describe("replay capture readout", () => {
  it("surfaces live replay capture after player input is recorded", () => {
    expect(buildReplayCaptureReadout({ status: "flying", replayFrameCount: 3 })).toEqual({
      label: "Replay REC",
      value: "3 inputs",
      tone: "live"
    });
  });

  it("stays hidden before meaningful replay input exists", () => {
    expect(buildReplayCaptureReadout({ status: "flying", replayFrameCount: 0 })).toBeUndefined();
    expect(buildReplayCaptureReadout({ status: "paused", replayFrameCount: 4 })).toBeUndefined();
  });
});
