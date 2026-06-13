import { describe, expect, it } from "vitest";
import { buildResultBoardAction, buildResultBoardPrompt, buildResultCoach } from "./resultCoach";

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

  it("coaches gravity route hull collisions toward the sling ring", () => {
    expect(
      buildResultCoach({
        status: "crashed",
        contractId: "gravity-slingshot",
        crashReason: "Hull Collision",
        medal: "none",
        grade: "F",
        cargoDamage: 1,
        fuel: 40,
        maxFuel: 100,
        scoreBreakdown: baseBreakdown
      })
    ).toEqual({
      label: "Next run",
      value: "Stay in the outer sling ring",
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

  it("nudges gravity route clears without style toward gravity slings", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        contractId: "gravity-slingshot",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 48,
        maxFuel: 100,
        scoreBreakdown: baseBreakdown
      })
    ).toEqual({
      label: "Next run",
      value: "Catch one gravity sling",
      tone: "opportunity"
    });
  });

  it("nudges asteroid sprint clears without style toward needle threading", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        contractId: "asteroid-sprint",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 48,
        maxFuel: 100,
        scoreBreakdown: baseBreakdown
      })
    ).toEqual({
      label: "Next run",
      value: "Thread one asteroid gap",
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

describe("result board action", () => {
  it("opens the recommended board target after a successful delivery", () => {
    expect(
      buildResultBoardAction({
        status: "delivered",
        currentContractId: "first-light-delivery",
        routeBoardTarget: {
          value: "Clear Return Leg",
          tone: "clear",
          contractId: "return-leg"
        }
      })
    ).toEqual({
      label: "Open Target",
      targetContractId: "return-leg",
      tone: "clear"
    });
  });

  it("keeps comet chases on the current route when that is the board target", () => {
    expect(
      buildResultBoardAction({
        status: "delivered",
        currentContractId: "asteroid-sprint",
        routeBoardTarget: {
          value: "Comet Asteroid Sprint",
          tone: "comet",
          contractId: "asteroid-sprint"
        }
      })
    ).toEqual({
      label: "Chase Comet",
      targetContractId: "asteroid-sprint",
      tone: "comet"
    });
  });

  it("keeps a mastered board in defend mode", () => {
    expect(
      buildResultBoardAction({
        status: "delivered",
        currentContractId: "gravity-slingshot",
        routeBoardTarget: {
          value: "Board mastered",
          tone: "complete"
        }
      })
    ).toEqual({
      label: "Defend Board",
      targetContractId: "gravity-slingshot",
      tone: "complete"
    });
  });
});
