import { describe, expect, it } from "vitest";
import { buildAudioTogglePresentation } from "./audioControls";

describe("audio controls", () => {
  it("labels the muted and audible toggle states", () => {
    expect(buildAudioTogglePresentation(false)).toEqual({
      label: "Mute audio",
      title: "Mute audio",
      icon: "volume"
    });
    expect(buildAudioTogglePresentation(true)).toEqual({
      label: "Unmute audio",
      title: "Unmute audio",
      icon: "muted"
    });
  });
});
