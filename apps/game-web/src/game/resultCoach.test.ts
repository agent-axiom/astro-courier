import { describe, expect, it } from "vitest";
import {
  buildResultActionsLayout,
  buildResultBoardAction,
  buildResultBoardMasteryPrompt,
  buildResultBoardPrompt,
  buildResultCoach
} from "./resultCoach";

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

  it("calls out hard landing near-misses at the delivery pad", () => {
    expect(
      buildResultCoach({
        status: "crashed",
        objectivePhase: "delivery",
        targetDistance: 42,
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
      value: "Near miss: feather final brake",
      tone: "danger"
    });
  });

  it("does not treat pickup crashes as delivery near-misses", () => {
    expect(
      buildResultCoach({
        status: "crashed",
        objectivePhase: "pickup",
        targetDistance: 42,
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

  it("coaches asteroid sprint hull collisions toward wider field clearance", () => {
    expect(
      buildResultCoach({
        status: "crashed",
        contractId: "asteroid-sprint",
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
      value: "Give asteroid fields wider clearance",
      tone: "danger"
    });
  });

  it("coaches chain relay hull collisions toward wider relay clearance", () => {
    expect(
      buildResultCoach({
        status: "crashed",
        contractId: "chain-relay",
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
      value: "Give relay lanes wider clearance",
      tone: "danger"
    });
  });

  it("coaches return-leg hull collisions toward a wider reverse arc", () => {
    expect(
      buildResultCoach({
        status: "crashed",
        contractId: "return-leg",
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
      value: "Widen the reverse arc",
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

  it("nudges return leg clears without style toward carrying a chain home", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        contractId: "return-leg",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 48,
        maxFuel: 100,
        scoreBreakdown: baseBreakdown
      })
    ).toEqual({
      label: "Next run",
      value: "Carry a chain into dock",
      tone: "opportunity"
    });
  });

  it("nudges chain relay clears without style toward carrying a chain home", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        contractId: "chain-relay",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 48,
        maxFuel: 100,
        scoreBreakdown: baseBreakdown
      })
    ).toEqual({
      label: "Next run",
      value: "Carry a chain into dock",
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

  it("coaches express finish runs toward repeating the fast line", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        lastMilestone: "Express Finish",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 36,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 405 }
      })
    ).toEqual({
      label: "Next run",
      value: "Repeat the express line",
      tone: "success"
    });
  });

  it("coaches comet finish runs toward defending the full elite line", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        lastMilestone: "Comet Finish",
        medal: "comet",
        grade: "S",
        cargoDamage: 0,
        fuel: 78,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 320, landingBonus: 300 }
      })
    ).toEqual({
      label: "Next run",
      value: "Defend the comet finish",
      tone: "success"
    });
  });

  it("coaches gold comet near-misses toward the missing reserve", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        lastMilestone: "Express Finish",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 72,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 180, landingBonus: 300 }
      })
    ).toEqual({
      label: "Next run",
      value: "Bank 75% fuel for comet",
      tone: "opportunity"
    });
  });

  it("coaches gold comet near-misses toward the missing perfect dock", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        lastMilestone: "Express Finish",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 82,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 180, landingBonus: 120 }
      })
    ).toEqual({
      label: "Next run",
      value: "Perfect dock for comet",
      tone: "opportunity"
    });
  });

  it("coaches perfect approach runs toward repeating the soft dock", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        lastMilestone: "Perfect Approach",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 46,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 220, landingBonus: 300 }
      })
    ).toEqual({
      label: "Next run",
      value: "Repeat the soft dock",
      tone: "success"
    });
  });

  it("coaches chain finish runs toward carrying the chain home again", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        lastMilestone: "Chain Finish",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 40,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 650 }
      })
    ).toEqual({
      label: "Next run",
      value: "Carry the chain home",
      tone: "success"
    });
  });

  it("coaches launch burst runs toward repeating the pickup burst chain", () => {
    expect(
      buildResultCoach({
        status: "delivered",
        lastMilestone: "Launch Burst",
        medal: "gold",
        grade: "A",
        cargoDamage: 0,
        fuel: 46,
        maxFuel: 100,
        scoreBreakdown: { ...baseBreakdown, styleBonus: 330 }
      })
    ).toEqual({
      label: "Next run",
      value: "Repeat the pickup-burst chain",
      tone: "success"
    });
  });

  it("coaches eco drift runs toward repeating the low-burn line", () => {
    expect(
      buildResultCoach({
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
      label: "Next run",
      value: "Repeat the low-burn line",
      tone: "success"
    });
  });

  it("coaches damage control runs toward repeating the salvage dock", () => {
    expect(
      buildResultCoach({
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
      label: "Next run",
      value: "Repeat the salvage dock",
      tone: "success"
    });
  });

  it("coaches last drop runs toward repeating the clutch coast", () => {
    expect(
      buildResultCoach({
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
      label: "Next run",
      value: "Repeat the last-drop coast",
      tone: "success"
    });
  });

  it("coaches no-brake finesse runs toward repeating the finesse line", () => {
    expect(
      buildResultCoach({
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
      label: "Next run",
      value: "Repeat the no-brake line",
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

  it("surfaces ghost chases after mastered-board deliveries", () => {
    expect(buildResultBoardPrompt({ status: "delivered", routeBoardTarget: { value: "Race Return Leg", tone: "ghost" } })).toEqual({
      label: "Board target",
      value: "Race Return Leg",
      tone: "ghost"
    });
  });
});

describe("result board mastery prompt", () => {
  it("surfaces board mastery progress after successful deliveries", () => {
    expect(
      buildResultBoardMasteryPrompt({
        status: "delivered",
        routeBoardMastery: { label: "Board mastery", value: "3 routes to clear", tone: "progress" }
      })
    ).toEqual({
      label: "Board mastery",
      value: "3 routes to clear",
      tone: "progress"
    });
    expect(
      buildResultBoardMasteryPrompt({
        status: "delivered",
        routeBoardMastery: { label: "Board mastery", value: "Full comet sweep", tone: "complete" }
      })
    ).toEqual({
      label: "Board mastery",
      value: "Full comet sweep",
      tone: "complete"
    });
  });

  it("stays hidden after crashes so retry guidance owns the result", () => {
    expect(
      buildResultBoardMasteryPrompt({
        status: "crashed",
        routeBoardMastery: { label: "Board mastery", value: "3 routes to clear", tone: "progress" }
      })
    ).toBeUndefined();
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

  it("opens ghost replay targets once the board is mastered", () => {
    expect(
      buildResultBoardAction({
        status: "delivered",
        currentContractId: "gravity-slingshot",
        routeBoardTarget: {
          value: "Race Return Leg",
          tone: "ghost",
          contractId: "return-leg"
        }
      })
    ).toEqual({
      label: "Race Ghost",
      targetContractId: "return-leg",
      tone: "ghost"
    });
  });
});

describe("result action layout", () => {
  it("centers a single retry action after failed runs or missing board actions", () => {
    expect(buildResultActionsLayout({ status: "crashed", hasBoardAction: true })).toBe("solo");
    expect(buildResultActionsLayout({ status: "delivered", hasBoardAction: false })).toBe("solo");
  });

  it("uses a paired action row only when delivery can open a board target", () => {
    expect(buildResultActionsLayout({ status: "delivered", hasBoardAction: true })).toBe("pair");
  });
});
