import { describe, expect, it } from "vitest";
import { buildTopHudDensity } from "./topHudDensity";

describe("top HUD density", () => {
  it("compacts brand copy during active flight", () => {
    expect(buildTopHudDensity({ status: "flying", preflightOpen: false, resultOpen: false })).toEqual({
      mode: "compact",
      showBrandCopy: false
    });
  });

  it("keeps brand copy around overlays and paused routes", () => {
    expect(buildTopHudDensity({ status: "paused", preflightOpen: false, resultOpen: false })).toEqual({
      mode: "full",
      showBrandCopy: true
    });
    expect(buildTopHudDensity({ status: "flying", preflightOpen: true, resultOpen: false })).toEqual({
      mode: "full",
      showBrandCopy: true
    });
    expect(buildTopHudDensity({ status: "crashed", preflightOpen: false, resultOpen: true })).toEqual({
      mode: "full",
      showBrandCopy: true
    });
  });
});
