import { describe, expect, it } from "vitest";
import { buildResultHighlight, buildResultStats } from "./resultStats";

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
});
