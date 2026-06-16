import { describe, expect, it } from "vitest";
import { buildTopHudDensity, buildTopHudSpeedTone } from "./topHudDensity";

describe("top HUD density", () => {
  it("compacts brand copy during active flight", () => {
    expect(buildTopHudDensity({ status: "flying", preflightOpen: false, resultOpen: false })).toEqual({
      mode: "compact",
      visible: true,
      showBrandCopy: false,
      showMetricLabels: false
    });
  });

  it("hides the top HUD while preflight owns the first launch", () => {
    expect(buildTopHudDensity({ status: "paused", preflightOpen: true, resultOpen: false })).toEqual({
      mode: "full",
      visible: false,
      showBrandCopy: false,
      showMetricLabels: false
    });
  });

  it("keeps brand copy around result overlays and paused routes", () => {
    expect(buildTopHudDensity({ status: "paused", preflightOpen: false, resultOpen: false })).toEqual({
      mode: "full",
      visible: true,
      showBrandCopy: true,
      showMetricLabels: true
    });
    expect(buildTopHudDensity({ status: "crashed", preflightOpen: false, resultOpen: true })).toEqual({
      mode: "full",
      visible: true,
      showBrandCopy: true,
      showMetricLabels: true
    });
  });
});

describe("top HUD speed tone", () => {
  it("keeps fast cruise neutral until landing guidance calls it too fast", () => {
    expect(buildTopHudSpeedTone({ speed: 58, landingStatus: "approach" })).toBe("normal");
    expect(buildTopHudSpeedTone({ speed: 38, landingStatus: "ready" })).toBe("normal");
  });

  it("warns only when the current target approach is actually too fast", () => {
    expect(buildTopHudSpeedTone({ speed: 43, landingStatus: "too-fast" })).toBe("warning");
  });
});
