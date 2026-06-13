import { describe, expect, it } from "vitest";
import { buildDockingSpeedReadout } from "./docking";

describe("docking speed readout", () => {
  it("stays hidden until a target speed limit is known", () => {
    expect(buildDockingSpeedReadout({ speed: 12 })).toBeUndefined();
  });

  it("formats current speed against the active pad limit", () => {
    expect(buildDockingSpeedReadout({ speed: 18.25, allowedSpeed: 42 })).toEqual({
      label: "Dock speed",
      value: "18.3 / 42.0",
      tone: "normal"
    });
  });

  it("warns when current speed exceeds the active pad limit", () => {
    expect(buildDockingSpeedReadout({ speed: 44, allowedSpeed: 42 })).toEqual({
      label: "Dock speed",
      value: "44.0 / 42.0",
      tone: "over-limit"
    });
  });
});
