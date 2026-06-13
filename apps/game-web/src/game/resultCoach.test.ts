import { describe, expect, it } from "vitest";
import { buildResultBoardPrompt, buildResultCoach } from "./resultCoach";

const baseBreakdown = {
  base: 1000,
  paceBonus: 0,
  fuelBonus: 0,
  cargoBonus: 500,
  landingBonus: 120,
  styleBonus: 0,
  dangerBonus: 0,
  incidentPenalty: 0,
  total: 1620
};

describe("result coach", () => {
  it("coaches hard landing failures first", () => {
    expect(
      buildResultCoach({
        status: "crashed",
        crashReason: "Hard Landing",
        medal: "none",
        grade: "F",
        cargoDamage: 1,
        fuel: 40,
        maxFuel: 100,
        scoreBreakdown: baseBreakdown
      })
    ).toEqual({
      label: "Next run",
      value: "Brake earlier before pad contact",
      tone: "danger"
    });
  });

  it("coaches damaged deliveries toward safer hazard lines", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        medal: "silver",
        grade: "B",
        cargoDamage: 0.24,
        fuel: 40,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 180 }
      })
    ).toEqual({
      label: "Next run",
      value: "Take wider hazard lines",
      tone: "warning"
    });
  });

  it("nudges clean deliveries without style toward bonus play", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 48,
        maxFuel: 100,
        scoreBreakdown: baseBreakdown
      })
    ).toEqual({
      label: "Next run",
      value: "Add a skim or quick pickup",
      tone: "opportunity"
    });
  });

  it("celebrates comet-grade runs with a mastery target", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        medal: "comet",
        grade: "S",
        cargoDamage: 0,
        fuel: 52,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 420 }
      })
    ).toEqual({
      label: "Next run",
      value: "Defend the comet line",
      tone: "success"
    });
  });
});

describe("result board prompt", () => {
  it("keeps failed runs focused on retrying the current route", () => {
    expect(buildResultBoardPrompt({ status: "crashed", routeBoardTarget: { value: "Clear Return Leg", tone: "clear" } })).toEqual({
      label: "Board target",
      value: "Retry current route",
      tone: "retry"
    });
  });

  it("surfaces the next board target after successful deliveries", () => {
    expect(buildResultBoardPrompt({ status: "delivered", routeBoardTarget: { value: "Comet Asteroid Sprint", tone: "comet" } })).toEqual({
      label: "Board target",
      value: "Comet Asteroid Sprint",
      tone: "comet"
    });
  });
});
