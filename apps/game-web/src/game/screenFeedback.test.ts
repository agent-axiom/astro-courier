import { describe, expect, it } from "vitest";
import {
  buildCampaignMilestoneScreenFeedback,
  buildDailyDispatchScreenFeedback,
  buildMilestoneScreenFeedback,
  buildPauseResumeScreenFeedback,
  buildProgressReceiptScreenFeedback,
  buildRouteMarkScreenFeedback,
  buildScreenFeedback
} from "./screenFeedback";

describe("screen feedback", () => {
  it("turns banked route marks into high-impact result pulses", () => {
    expect(buildRouteMarkScreenFeedback({ label: "Route mark", value: "Clear mark banked", tone: "clear" })).toEqual({
      label: "Route mark",
      value: "Clear banked",
      tone: "success",
      intensity: "medium",
      durationMs: 500
    });
    expect(buildRouteMarkScreenFeedback({ label: "Route mark", value: "Comet mark banked", tone: "comet" })).toEqual({
      label: "Comet mark",
      value: "Route upgraded",
      tone: "style",
      intensity: "heavy",
      durationMs: 560
    });
    expect(buildRouteMarkScreenFeedback({ label: "Route mark", value: "Ghost mark banked", tone: "ghost" })).toEqual({
      label: "Ghost mark",
      value: "PB trail captured",
      tone: "success",
      intensity: "heavy",
      durationMs: 600
    });
  });

  it("turns daily streak receipts into result screen pulses", () => {
    expect(buildDailyDispatchScreenFeedback({ label: "Daily streak", value: "Daily clear banked", tone: "fresh" })).toEqual({
      label: "Daily streak",
      value: "Daily clear banked",
      tone: "success",
      intensity: "medium",
      durationMs: 500
    });
    expect(buildDailyDispatchScreenFeedback({ label: "Daily streak", value: "4-day streak", tone: "streak" })).toEqual({
      label: "Daily streak",
      value: "4-day streak banked",
      tone: "style",
      intensity: "heavy",
      durationMs: 560
    });
    expect(buildDailyDispatchScreenFeedback(undefined)).toBeUndefined();
  });

  it("turns campaign milestone receipts into high-impact result pulses", () => {
    expect(
      buildCampaignMilestoneScreenFeedback({
        label: "Campaign milestone",
        value: "25% route board",
        tone: "quarter"
      })
    ).toEqual({
      label: "Campaign milestone",
      value: "25% route board",
      tone: "success",
      intensity: "medium",
      durationMs: 540
    });
    expect(
      buildCampaignMilestoneScreenFeedback({
        label: "Campaign milestone",
        value: "75% route board",
        tone: "mastery"
      })
    ).toEqual({
      label: "Campaign milestone",
      value: "75% route board",
      tone: "style",
      intensity: "heavy",
      durationMs: 620
    });
    expect(
      buildCampaignMilestoneScreenFeedback({
        label: "Campaign milestone",
        value: "Campaign mastered",
        tone: "complete"
      })
    ).toEqual({
      label: "Campaign mastered",
      value: "Full route board",
      tone: "success",
      intensity: "heavy",
      durationMs: 700
    });
    expect(buildCampaignMilestoneScreenFeedback(undefined)).toBeUndefined();
  });

  it("prioritizes campaign milestones over other progress receipts", () => {
    expect(
      buildProgressReceiptScreenFeedback({
        campaignMilestoneReceipt: {
          label: "Campaign milestone",
          value: "50% route board",
          tone: "half"
        },
        routeMarkReceipt: { label: "Route mark", value: "Ghost mark banked", tone: "ghost" },
        dailyProgressReceipt: { label: "Daily streak", value: "5-day streak", tone: "streak" }
      })
    ).toEqual({
      label: "Campaign milestone",
      value: "50% route board",
      tone: "success",
      intensity: "medium",
      durationMs: 540
    });
  });

  it("prioritizes crash feedback over lower-impact events", () => {
    expect(buildScreenFeedback(["style-hit", "ship-crash"])).toEqual({
      label: "Insurance event",
      value: "Recover line",
      tone: "danger",
      intensity: "heavy",
      durationMs: 520
    });
  });

  it("adds a light route-live pulse only when resuming a paused live route", () => {
    expect(
      buildPauseResumeScreenFeedback({
        status: "paused",
        wasPaused: true,
        nextPaused: false,
        preflightOpen: false,
        resultOpen: false
      })
    ).toEqual({
      label: "Route live",
      value: "Controls armed",
      tone: "success",
      intensity: "light",
      durationMs: 300
    });

    expect(
      buildPauseResumeScreenFeedback({
        status: "paused",
        wasPaused: false,
        nextPaused: true,
        preflightOpen: false,
        resultOpen: false
      })
    ).toBeUndefined();
    expect(
      buildPauseResumeScreenFeedback({
        status: "paused",
        wasPaused: true,
        nextPaused: false,
        preflightOpen: true,
        resultOpen: false
      })
    ).toBeUndefined();
    expect(
      buildPauseResumeScreenFeedback({
        status: "crashed",
        wasPaused: true,
        nextPaused: false,
        preflightOpen: false,
        resultOpen: true
      })
    ).toBeUndefined();
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
    expect(buildScreenFeedback(["last-drop-armed"])).toEqual({
      label: "Last drop",
      value: "Dock empty",
      accent: "fuel",
      tone: "style",
      intensity: "heavy",
      durationMs: 500
    });
    expect(buildScreenFeedback(["express-close"])).toEqual({
      label: "Express close",
      value: "Dock now",
      tone: "warning",
      intensity: "medium",
      durationMs: 400
    });
    expect(buildScreenFeedback(["antimatter-armed"])).toEqual({
      label: "Drift armed",
      value: "No brake dock",
      accent: "precision",
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
    expect(buildScreenFeedback(["style-hit"], "Antimatter Drift")).toEqual({
      label: "Antimatter drift",
      value: "No brake line",
      accent: "precision",
      tone: "style",
      intensity: "heavy",
      durationMs: 520
    });
    expect(buildScreenFeedback(["antimatter-drift"], "Antimatter Drift")).toEqual({
      label: "Antimatter drift",
      value: "No brake line",
      accent: "precision",
      tone: "style",
      intensity: "heavy",
      durationMs: 520
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
    expect(buildScreenFeedback(["cargo-shock"])).toEqual({
      label: "Brake shock",
      value: "Volatile load",
      tone: "warning",
      intensity: "medium",
      durationMs: 360
    });
    expect(buildScreenFeedback(["cargo-stress"])).toEqual({
      label: "Cargo stress",
      value: "Smooth inputs",
      tone: "warning",
      intensity: "light",
      durationMs: 320
    });
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
    expect(buildScreenFeedback(["thread-window"])).toEqual({
      label: "Thread window",
      value: "Needle gap",
      accent: "precision",
      tone: "style",
      intensity: "medium",
      durationMs: 420
    });
  });

  it("maps trajectory clears to quick success feedback", () => {
    expect(buildScreenFeedback(["clean-escape"])).toEqual({
      label: "Clean escape",
      value: "Hazard dodged",
      accent: "precision",
      tone: "success",
      intensity: "medium",
      durationMs: 420
    });
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

  it("maps critical style chains to an accented urgent combo pulse", () => {
    expect(buildScreenFeedback(["chain-critical"])).toEqual({
      label: "Chain critical",
      value: "Cash out now",
      accent: "chain",
      tone: "warning",
      intensity: "medium",
      durationMs: 380
    });
  });

  it("turns a critical chain thread window into a high-impact risk reward pulse", () => {
    expect(buildScreenFeedback(["thread-window", "chain-critical"])).toEqual({
      label: "Thread chain",
      value: "Cash the gap",
      accent: "chain",
      tone: "style",
      intensity: "heavy",
      durationMs: 500
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

  it("maps lost comet reserve to a heavy danger flash", () => {
    expect(buildScreenFeedback(["comet-reserve-lost"])).toEqual({
      label: "Comet lost",
      value: "Bank more fuel",
      tone: "danger",
      intensity: "heavy",
      durationMs: 460
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
    expect(buildMilestoneScreenFeedback("Assist Burn")).toEqual({
      label: "Assist burn",
      value: "Vector trim",
      tone: "style",
      intensity: "light",
      durationMs: 320
    });
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
      label: "PB pressure",
      value: "Close the gap",
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
      label: "Ghost pressure",
      value: "Close the gap",
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
