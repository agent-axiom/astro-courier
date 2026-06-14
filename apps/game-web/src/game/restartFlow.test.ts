import { describe, expect, it } from "vitest";
import { getOverlayVisibility } from "./overlays";
import { buildRestartFlowTransition } from "./restartFlow";

describe("restart flow transition", () => {
  it("dismisses the stale result overlay before retrying directly into flight", () => {
    const transition = buildRestartFlowTransition("direct-run");

    expect(transition).toEqual({
      resultDismissed: true,
      preflightOpen: false,
      paused: false,
      shellRestartPaused: false
    });
    expect(getOverlayVisibility({ status: "crashed", ...transition })).toEqual({
      preflight: false,
      result: false
    });
  });

  it("lets restart to briefing hide the stale result behind preflight", () => {
    const transition = buildRestartFlowTransition("briefing");

    expect(transition).toEqual({
      resultDismissed: false,
      preflightOpen: true,
      paused: true,
      shellRestartPaused: true
    });
    expect(getOverlayVisibility({ status: "crashed", ...transition })).toEqual({
      preflight: true,
      result: false
    });
  });
});
