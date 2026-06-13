import { describe, expect, it } from "vitest";
import { buildReplayReceipt, buildResultHighlight, buildResultStats } from "./resultStats";

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
});
