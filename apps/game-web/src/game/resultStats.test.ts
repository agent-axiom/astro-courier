import { describe, expect, it } from "vitest";
import {
  buildDockGradeReceipt,
  buildGhostTrailReceipt,
  buildReplayReceipt,
  buildResultHighlight,
  buildResultOutcomePresentation,
  buildResultStats,
  buildRunIdentityReceipt
} from "./resultStats";

const baseBreakdown = {
  base: 1000,
  paceBonus: 0,
  fuelBonus: 0,
  cargoBonus: 0,
  landingBonus: 0,
  styleBonus: 0,
  dangerBonus: 0,
  incidentPenalty: 0,
  total: 1000
};

describe("result stat formatting", () => {
  it("presents delivered and failed outcomes with distinct result icon tones", () => {
    expect(buildResultOutcomePresentation("delivered")).toEqual({
      icon: "trophy",
      tone: "success"
    });
    expect(buildResultOutcomePresentation("crashed")).toEqual({
      icon: "alert",
      tone: "danger"
    });
  });

  it("labels score, time, and cargo integrity for the result overlay", () => {
    expect(buildResultStats({ score: 2400, elapsedSeconds: 31.26, cargoIntegrity: 0.874 })).toEqual([
      { label: "Score", value: "2400" },
      { label: "Time", value: "31.3s" },
      { label: "Cargo", value: "87%" }
    ]);
  });

  it("highlights the largest bonus source on the result overlay", () => {
    expect(buildResultHighlight({ ...baseBreakdown, landingBonus: 300, styleBonus: 760, dangerBonus: 180 })).toEqual({
      label: "Run highlight",
      value: "Style +760",
      tone: "style"
    });
  });

  it("names fresh style milestones on the result highlight", () => {
    expect(buildResultHighlight({ ...baseBreakdown, styleBonus: 405 }, "Express Finish")).toEqual({
      label: "Run highlight",
      value: "Express Finish +405",
      tone: "style"
    });
    expect(buildResultHighlight({ ...baseBreakdown, styleBonus: 320 }, "Comet Finish")).toEqual({
      label: "Run highlight",
      value: "Comet Finish +320",
      tone: "style"
    });
  });

  it("names damage control recoveries on the result highlight", () => {
    expect(buildResultHighlight({ ...baseBreakdown, styleBonus: 140 }, "Damage Control")).toEqual({
      label: "Run highlight",
      value: "Damage Control +140",
      tone: "style"
    });
  });

  it("names last-drop finishes on the result highlight", () => {
    expect(buildResultHighlight({ ...baseBreakdown, styleBonus: 170 }, "Last Drop")).toEqual({
      label: "Run highlight",
      value: "Last Drop +170",
      tone: "style"
    });
  });

  it("keeps generic style highlights for non-style milestones", () => {
    expect(buildResultHighlight({ ...baseBreakdown, styleBonus: 405 }, "Delivered")).toEqual({
      label: "Run highlight",
      value: "Style +405",
      tone: "style"
    });
  });

  it("surfaces danger pay when it beats other bonus sources", () => {
    expect(buildResultHighlight({ ...baseBreakdown, fuelBonus: 180, styleBonus: 260, dangerBonus: 480 })).toEqual({
      label: "Run highlight",
      value: "Danger +480",
      tone: "danger"
    });
  });

  it("stays hidden when a run has no earned bonus source", () => {
    expect(buildResultHighlight(baseBreakdown)).toBeUndefined();
  });

  it("formats replay fingerprints for the result overlay", () => {
    expect(buildReplayReceipt("rc-a1b2c3d4e5f6")).toEqual({
      label: "Replay ID",
      value: "RC-A1B2C3D4E5F6",
      tone: "verified"
    });
    expect(buildReplayReceipt()).toBeUndefined();
  });

  it("summarizes final dock quality as a result receipt", () => {
    expect(buildDockGradeReceipt({ status: "delivered", landingBonus: 300 })).toEqual({
      label: "Dock grade",
      value: "Perfect dock",
      tone: "perfect"
    });
    expect(buildDockGradeReceipt({ status: "delivered", landingBonus: 120 })).toEqual({
      label: "Dock grade",
      value: "Soft dock +120",
      tone: "soft"
    });
    expect(buildDockGradeReceipt({ status: "delivered", landingBonus: 0 })).toEqual({
      label: "Dock grade",
      value: "Rough dock",
      tone: "rough"
    });
    expect(buildDockGradeReceipt({ status: "crashed", landingBonus: 0 })).toEqual({
      label: "Dock grade",
      value: "Dock failed",
      tone: "failed"
    });
  });

  it("marks new delivered personal bests as saved ghost trails", () => {
    expect(buildGhostTrailReceipt({ status: "delivered", isNewBest: true, runTrailSampleCount: 24 })).toEqual({
      label: "Ghost trail",
      value: "Saved to route board",
      tone: "saved"
    });
    expect(buildGhostTrailReceipt({ status: "delivered", isNewBest: true, runTrailSampleCount: 1 })).toBeUndefined();
    expect(buildGhostTrailReceipt({ status: "delivered", isNewBest: false, runTrailSampleCount: 24 })).toBeUndefined();
    expect(buildGhostTrailReceipt({ status: "crashed", isNewBest: true, runTrailSampleCount: 24 })).toBeUndefined();
  });

  it("summarizes the run identity for modern result scanning", () => {
    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        medal: "comet",
        grade: "S",
        cargoDamage: 0,
        fuel: 82,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 320, landingBonus: 300 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Elite courier line",
      tone: "elite"
    });

    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "Last Drop",
        medal: "silver",
        grade: "B",
        cargoDamage: 0,
        fuel: 4,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 170 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Fuel clutch finish",
      tone: "clutch"
    });

    expect(
      buildRunIdentityReceipt({
        status: "crashed",
        crashReason: "Hull Collision",
        medal: "none",
        grade: "F",
        cargoDamage: 1,
        fuel: 40,
        maxFuel: 100,
        scoreBreakdown: baseBreakdown
      })
    ).toEqual({
      label: "Run identity",
      value: "Route failed / hull contact",
      tone: "failure"
    });
  });

  it("calls out gold express comet near-misses as elite result identities", () => {
    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "Express Finish",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 72,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 405, landingBonus: 300 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Comet near-miss / reserve",
      tone: "elite"
    });

    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "Express Finish",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 82,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 405, landingBonus: 120 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Comet near-miss / dock",
      tone: "elite"
    });
  });

  it("summarizes signature skill milestones as distinct run identities", () => {
    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "Needle Thread",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 44,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 240, dangerBonus: 180 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Needle-thread route",
      tone: "danger"
    });

    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "Gravity Sling",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 44,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 240 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Gravity sling route",
      tone: "style"
    });

    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "Quick Pickup",
        medal: "silver",
        grade: "B",
        cargoDamage: 0,
        fuel: 44,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 180 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Fast-load courier line",
      tone: "style"
    });
  });

  it("summarizes finish mastery milestones as distinct run identities", () => {
    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "Launch Burst",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 48,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 330 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Burst-launch route",
      tone: "style"
    });

    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "Eco Drift",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 72,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 160, fuelBonus: 280 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Eco-drift route",
      tone: "clean"
    });

    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "Damage Control",
        medal: "silver",
        grade: "B",
        cargoDamage: 0.18,
        fuel: 44,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 140 }
      })
    ).toEqual({
      label: "Run identity",
      value: "Damage-control save",
      tone: "clutch"
    });

    expect(
      buildRunIdentityReceipt({
        status: "delivered",
        lastMilestone: "No Brake Finesse",
        medal: "silver",
        grade: "B",
        cargoDamage: 0,
        fuel: 36,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 150 }
      })
    ).toEqual({
      label: "Run identity",
      value: "No-brake finesse line",
      tone: "style"
    });
  });
});
