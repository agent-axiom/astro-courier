import { describe, expect, it } from "vitest";
import { formatBearingGuidance } from "./bearing";

describe("objective bearing guidance", () => {
  it("turns relative bearing radians into compact direction labels", () => {
    expect(formatBearingGuidance(0.08)).toEqual({
      label: "Target ahead",
      value: "5deg",
      tone: "ahead"
    });
    expect(formatBearingGuidance(-0.7)).toEqual({
      label: "Target left",
      value: "40deg",
      tone: "side"
    });
    expect(formatBearingGuidance(0.85)).toEqual({
      label: "Target right",
      value: "49deg",
      tone: "side"
    });
    expect(formatBearingGuidance(Math.PI)).toEqual({
      label: "Turn around",
      value: "180deg",
      tone: "reverse"
    });
  });
});
