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

  it("uses singular copy for one replay input", () => {
    expect(buildReplayCaptureReadout({ status: "flying", replayFrameCount: 1 })?.value).toBe("1 input");
  });

  it("labels live capture as a ghost chase when a saved trail is loaded", () => {
    expect(buildReplayCaptureReadout({ status: "flying", replayFrameCount: 3, hasGhostTrail: true })).toEqual({
      label: "Ghost REC",
      value: "3 chase inputs",
      tone: "ghost"
    });
  });

  it("adds live ghost score pressure when a saved trail is loaded", () => {
    expect(
      buildReplayCaptureReadout({
        status: "flying",
        replayFrameCount: 3,
        hasGhostTrail: true,
        score: 3440,
        bestRunScore: 3290
      })
    ).toEqual({
      label: "Ghost REC",
      value: "+150 ghost lead / 3 inputs",
      tone: "ghost"
    });

    expect(
      buildReplayCaptureReadout({
        status: "flying",
        replayFrameCount: 3,
        hasGhostTrail: true,
        score: 3105,
        bestRunScore: 3290
      })
    ).toEqual({
      label: "Ghost REC",
      value: "185 behind ghost / 3 inputs",
      tone: "ghost"
    });
  });

  it("stays hidden before meaningful replay input exists", () => {
    expect(buildReplayCaptureReadout({ status: "flying", replayFrameCount: 0 })).toBeUndefined();
    expect(buildReplayCaptureReadout({ status: "paused", replayFrameCount: 4 })).toBeUndefined();
  });
});
