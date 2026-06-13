import { describe, expect, it } from "vitest";
import { buildScreenFeedback } from "./screenFeedback";

describe("screen feedback", () => {
  it("prioritizes crash feedback over lower-impact events", () => {
    expect(buildScreenFeedback(["style-hit", "ship-crash"])).toEqual({
      label: "Insurance event",
      value: "Recover line",
      tone: "danger",
      intensity: "heavy",
      durationMs: 520
    });
  });

  it("maps delivery and style events to positive feedback", () => {
    expect(buildScreenFeedback(["delivery-complete"])).toEqual({
      tone: "success",
      intensity: "heavy",
      durationMs: 620
    });
    expect(buildScreenFeedback(["cargo-loaded"])).toEqual({
      label: "Cargo secured",
      value: "Outbound line",
      tone: "success",
      intensity: "medium",
      durationMs: 360
    });
    expect(buildScreenFeedback(["style-hit"])).toEqual({
      tone: "style",
      intensity: "light",
      durationMs: 360
    });
    expect(buildScreenFeedback(["comet-armed"])).toEqual({
      tone: "style",
      intensity: "medium",
      durationMs: 460
    });
  });

  it("maps boost burns to light style feedback", () => {
    expect(buildScreenFeedback(["boost-burn"])).toEqual({
      tone: "style",
      intensity: "light",
      durationMs: 300
    });
  });

  it("maps hazard and fuel warnings to warning feedback", () => {
    expect(buildScreenFeedback(["fuel-critical"])).toEqual({
      tone: "warning",
      intensity: "medium",
      durationMs: 440
    });
    expect(buildScreenFeedback(["hazard-contact"])).toEqual({
      tone: "danger",
      intensity: "medium",
      durationMs: 440
    });
  });

  it("maps cargo damage to a medium warning flash", () => {
    expect(buildScreenFeedback(["cargo-damage"])).toEqual({
      tone: "warning",
      intensity: "medium",
      durationMs: 400
    });
    expect(buildScreenFeedback(["cargo-damage", "hazard-contact"])).toEqual({
      tone: "danger",
      intensity: "medium",
      durationMs: 440
    });
  });

  it("maps trajectory warnings to medium warning feedback", () => {
    expect(buildScreenFeedback(["trajectory-warning"])).toEqual({
      tone: "warning",
      intensity: "medium",
      durationMs: 380
    });
  });

  it("strengthens feedback when cargo damage and trajectory warnings stack", () => {
    expect(buildScreenFeedback(["cargo-damage", "trajectory-warning"])).toEqual({
      tone: "warning",
      intensity: "heavy",
      durationMs: 460
    });
  });

  it("maps critical style chains to light warning feedback", () => {
    expect(buildScreenFeedback(["chain-critical"])).toEqual({
      tone: "warning",
      intensity: "light",
      durationMs: 320
    });
  });

  it("maps medal window drops to medium warning feedback", () => {
    expect(buildScreenFeedback(["medal-drop"])).toEqual({
      tone: "warning",
      intensity: "medium",
      durationMs: 360
    });
  });

  it("maps launch bursts to medium style feedback", () => {
    expect(buildScreenFeedback(["launch-burst"])).toEqual({
      tone: "style",
      intensity: "medium",
      durationMs: 420
    });
  });

  it("maps personal-best leads to medium success feedback", () => {
    expect(buildScreenFeedback(["pb-lead"])).toEqual({
      label: "PB lead",
      value: "Hold pace",
      tone: "success",
      intensity: "medium",
      durationMs: 420
    });
    expect(buildScreenFeedback(["ghost-pass"])).toEqual({
      tone: "success",
      intensity: "heavy",
      durationMs: 520
    });
  });

  it("maps personal-best pressure to an anticipatory style pulse", () => {
    expect(buildScreenFeedback(["pb-pressure"])).toEqual({
      tone: "style",
      intensity: "medium",
      durationMs: 360
    });
    expect(buildScreenFeedback(["pb-pressure", "pb-lead"])).toEqual({
      label: "PB lead",
      value: "Hold pace",
      tone: "success",
      intensity: "medium",
      durationMs: 420
    });
    expect(buildScreenFeedback(["ghost-pressure"])).toEqual({
      tone: "style",
      intensity: "medium",
      durationMs: 420
    });
    expect(buildScreenFeedback(["ghost-pressure", "ghost-pass"])).toEqual({
      tone: "success",
      intensity: "heavy",
      durationMs: 520
    });
  });

  it("stays hidden when no gameplay event needs screen feedback", () => {
    expect(buildScreenFeedback([])).toBeUndefined();
  });
});
