import { describe, expect, it } from "vitest";
import { buildTouchFlightPadPresentation } from "./touchControls";

describe("touch flight pad presentation", () => {
  it("shows the flight pad only during active flying", () => {
    expect(buildTouchFlightPadPresentation({ status: "flying", preflightOpen: false })).toEqual({
      visible: true,
      tone: "active"
    });
  });

  it("hides the flight pad while overlays own the screen", () => {
    expect(buildTouchFlightPadPresentation({ status: "paused", preflightOpen: true })).toEqual({
      visible: false,
      tone: "idle"
    });
    expect(buildTouchFlightPadPresentation({ status: "delivered", preflightOpen: false })).toEqual({
      visible: false,
      tone: "idle"
    });
  });
});
