import { describe, expect, it } from "vitest";
import { getOverlayVisibility } from "./overlays";

describe("overlay visibility", () => {
  it("shows the result overlay only while a finished run owns the screen", () => {
    expect(getOverlayVisibility({ status: "delivered", preflightOpen: false })).toEqual({
      preflight: false,
      result: true
    });
  });

  it("hides the result overlay immediately once restart opens preflight", () => {
    expect(getOverlayVisibility({ status: "crashed", preflightOpen: true })).toEqual({
      preflight: true,
      result: false
    });
  });

  it("hides the result overlay immediately once retry dismisses the old result", () => {
    expect(getOverlayVisibility({ status: "crashed", preflightOpen: false, resultDismissed: true })).toEqual({
      preflight: false,
      result: false
    });
  });

  it("keeps ordinary flight clear of blocking overlays", () => {
    expect(getOverlayVisibility({ status: "flying", preflightOpen: false })).toEqual({
      preflight: false,
      result: false
    });
  });
});
