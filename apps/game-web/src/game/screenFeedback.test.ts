import { describe, expect, it } from "vitest";
import { buildMilestoneScreenFeedback, buildScreenFeedback } from "./screenFeedback";

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
      label: "Delivery sealed",
      value: "Manifest closed",
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
      label: "Style hit",
      value: "Bonus banked",
      tone: "style",
      intensity: "light",
      durationMs: 360
    });
    expect(buildScreenFeedback(["comet-armed"])).toEqual({
      label: "Comet dock",
      value: "Perfect line armed",
      tone: "style",
      intensity: "medium",
      durationMs: 460
    });
    expect(buildScreenFeedback(["perfect-approach-ready"])).toEqual({
      label: "Perfect setup",
      value: "Soft dock armed",
      tone: "style",
      intensity: "medium",
      durationMs: 420
    });
  });

  it("names high-skill style milestone hits when milestone context is available", () => {
    expect(buildScreenFeedback(["style-hit"], "Clean Hazard Skim")).toEqual({
      label: "Clean skim",
      value: "Danger pay",
      accent: "precision",
      tone: "style",
      intensity: "medium",
      durationMs: 440
    });
    expect(buildScreenFeedback(["style-hit"], "Needle Thread")).toEqual({
      label: "Needle thread",
      value: "Clean gap",
      accent: "precision",
      tone: "style",
      intensity: "medium",
      durationMs: 440
    });
    expect(buildScreenFeedback(["style-hit"], "Gravity Sling")).toEqual({
      label: "Gravity sling",
      value: "Arc held",
      accent: "sling",
      tone: "style",
      intensity: "medium",
      durationMs: 440
    });
    expect(buildScreenFeedback(["style-hit"], "Quick Pickup")).toEqual({
      label: "Quick pickup",
      value: "Rush banked",
      accent: "rush",
      tone: "style",
      intensity: "medium",
      durationMs: 420
    });
    expect(buildScreenFeedback(["style-hit"], "Chain Finish")).toEqual({
      label: "Chain finish",
      value: "Combo delivered",
      accent: "chain",
      tone: "style",
      intensity: "heavy",
      durationMs: 560
    });
  });

  it("maps boost burns to light style feedback", () => {
    expect(buildScreenFeedback(["boost-burn"])).toEqual({
      label: "Impulse burn",
      value: "Vector kick",
      tone: "style",
      intensity: "light",
      durationMs: 300
    });
  });

  it("maps close-range lineup events to quick success feedback", () => {
    expect(buildScreenFeedback(["pickup-lineup"])).toEqual({
      label: "Pickup lined",
      value: "Load window",
      tone: "success",
      intensity: "light",
      durationMs: 320
    });
    expect(buildScreenFeedback(["dock-lineup"])).toEqual({
      label: "Dock lined",
      value: "Commit approach",
      tone: "success",
      intensity: "light",
      durationMs: 340
    });
  });

  it("maps hazard and fuel warnings to warning feedback", () => {
    expect(buildScreenFeedback(["fuel-critical"])).toEqual({
      label: "Fuel critical",
      value: "Coast now",
      tone: "warning",
      intensity: "medium",
      durationMs: 440
    });
    expect(buildScreenFeedback(["hazard-contact"])).toEqual({
      label: "Hazard contact",
      value: "Burn out",
      tone: "danger",
      intensity: "medium",
      durationMs: 440
    });
  });

  it("maps cargo damage to a medium warning flash", () => {
    expect(buildScreenFeedback(["cargo-damage"])).toEqual({
      label: "Cargo hit",
      value: "Keep control",
      tone: "warning",
      intensity: "medium",
      durationMs: 400
    });
    expect(buildScreenFeedback(["cargo-damage", "hazard-contact"])).toEqual({
      label: "Hazard contact",
      value: "Burn out",
      tone: "danger",
      intensity: "medium",
      durationMs: 440
    });
  });

  it("maps trajectory warnings to medium warning feedback", () => {
    expect(buildScreenFeedback(["trajectory-warning"])).toEqual({
      label: "Vector warning",
      value: "Change line",
      tone: "warning",
      intensity: "medium",
      durationMs: 380
    });
  });

  it("maps trajectory cautions to light warning feedback", () => {
    expect(buildScreenFeedback(["trajectory-caution"])).toEqual({
      label: "Vector caution",
      value: "Thread line",
      tone: "warning",
      intensity: "light",
      durationMs: 300
    });
  });

  it("maps trajectory clears to quick success feedback", () => {
    expect(buildScreenFeedback(["trajectory-clear"])).toEqual({
      label: "Vector clear",
      value: "Line recovered",
      tone: "success",
      intensity: "light",
      durationMs: 300
    });
  });

  it("strengthens feedback when cargo damage and trajectory warnings stack", () => {
    expect(buildScreenFeedback(["cargo-damage", "trajectory-warning"])).toEqual({
      label: "Cargo vector",
      value: "Clear hazard",
      tone: "warning",
      intensity: "heavy",
      durationMs: 460
    });
  });

  it("maps critical style chains to light warning feedback", () => {
    expect(buildScreenFeedback(["chain-critical"])).toEqual({
      label: "Chain critical",
      value: "Save it",
      tone: "warning",
      intensity: "light",
      durationMs: 320
    });
  });

  it("maps saved style chains to a visible combo restore pulse", () => {
    expect(buildScreenFeedback(["chain-save"])).toEqual({
      label: "Chain saved",
      value: "Combo restored",
      accent: "chain",
      tone: "style",
      intensity: "medium",
      durationMs: 440
    });
  });

  it("maps medal window drops to medium warning feedback", () => {
    expect(buildScreenFeedback(["medal-drop"])).toEqual({
      label: "Pace slipping",
      value: "Recover medal",
      tone: "warning",
      intensity: "medium",
      durationMs: 360
    });
  });

  it("maps tight comet reserve to an immediate coast warning", () => {
    expect(buildScreenFeedback(["comet-reserve-tight"])).toEqual({
      label: "Comet reserve",
      value: "Coast now",
      tone: "warning",
      intensity: "medium",
      durationMs: 380
    });
  });

  it("maps launch bursts to medium style feedback", () => {
    expect(buildScreenFeedback(["launch-burst"])).toEqual({
      label: "Launch burst",
      value: "+120 style",
      tone: "style",
      intensity: "medium",
      durationMs: 420
    });
  });

  it("can fall back from visible boost and launch milestones when event timing is missed", () => {
    expect(buildMilestoneScreenFeedback("Boost Burn")).toEqual({
      label: "Impulse burn",
      value: "Vector kick",
      tone: "style",
      intensity: "light",
      durationMs: 300
    });
    expect(buildMilestoneScreenFeedback("Launch Burst")).toEqual({
      label: "Launch burst",
      value: "+120 style",
      tone: "style",
      intensity: "medium",
      durationMs: 420
    });
    expect(buildMilestoneScreenFeedback("Needle Thread")).toEqual({
      label: "Needle thread",
      value: "Clean gap",
      accent: "precision",
      tone: "style",
      intensity: "medium",
      durationMs: 440
    });
    expect(buildMilestoneScreenFeedback("Chain Finish")).toEqual({
      label: "Chain finish",
      value: "Combo delivered",
      accent: "chain",
      tone: "style",
      intensity: "heavy",
      durationMs: 560
    });
    expect(buildMilestoneScreenFeedback("Pickup Required")).toBeUndefined();
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
      label: "Ghost passed",
      value: "Keep it clean",
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
      label: "Ghost passed",
      value: "Keep it clean",
      tone: "success",
      intensity: "heavy",
      durationMs: 520
    });
  });

  it("stays hidden when no gameplay event needs screen feedback", () => {
    expect(buildScreenFeedback([])).toBeUndefined();
  });
});
