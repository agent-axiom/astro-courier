import { describe, expect, it } from "vitest";
import { buildPreflightBonusObjectives, buildPreflightMasteryTargets, buildPreflightPuzzleGoals } from "./mastery";

describe("preflight mastery targets", () => {
  it("summarizes gold time and comet mastery conditions", () => {
    expect(buildPreflightMasteryTargets({ goldSeconds: 35 })).toEqual([
      { label: "Gold", value: "35s" },
      { label: "Comet", value: "Perfect + reserve" }
    ]);
  });

  it("rounds fractional gold windows for compact preflight display", () => {
    expect(buildPreflightMasteryTargets({ goldSeconds: 24.6 })[0]).toEqual({
      label: "Gold",
      value: "25s"
    });
  });
});

describe("preflight bonus objectives", () => {
  it("summarizes active style objectives before launch", () => {
    expect(buildPreflightBonusObjectives({ quickPickupBonus: 180 })).toEqual([
      { label: "Rush pickup", value: "+180" },
      { label: "Launch burst", value: "+120 / boost after pickup" },
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Comet finish", value: "+320 / 75% fuel + perfect dock" },
      { label: "Clean skim", value: "from +140" },
      { label: "Perfect dock", value: "+220" },
      { label: "No brake", value: "+150 / no manual brake" },
      { label: "Last Drop", value: "+170 / <=5% fuel" }
    ]);
  });

  it("surfaces needle threading and danger pay for high-hazard contracts", () => {
    expect(
      buildPreflightBonusObjectives({
        contractId: "asteroid-sprint",
        quickPickupBonus: 180,
        hazardSeverityMultiplier: 1.45
      })
    ).toEqual([
      { label: "Rush pickup", value: "+180" },
      { label: "Launch burst", value: "+120 / boost after pickup" },
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Comet finish", value: "+320 / 75% fuel + perfect dock" },
      { label: "Needle thread", value: "42+ speed" },
      { label: "Danger pay", value: "+180" },
      { label: "No brake", value: "+150 / no manual brake" },
      { label: "Last Drop", value: "+170 / <=5% fuel" }
    ]);
  });

  it("surfaces gravity sling as the gravity route bonus target", () => {
    expect(
      buildPreflightBonusObjectives({
        contractId: "gravity-slingshot",
        quickPickupBonus: 180,
        hazardSeverityMultiplier: 1.2
      })
    ).toEqual([
      { label: "Rush pickup", value: "+180" },
      { label: "Launch burst", value: "+120 / boost after pickup" },
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Comet finish", value: "+320 / 75% fuel + perfect dock" },
      { label: "Gravity sling", value: "+240 / 54+ speed" },
      { label: "Perfect dock", value: "+220" },
      { label: "No brake", value: "+150 / no manual brake" },
      { label: "Last Drop", value: "+170 / <=5% fuel" }
    ]);
  });

  it("surfaces chain finish as the return leg bonus target", () => {
    expect(
      buildPreflightBonusObjectives({
        contractId: "return-leg",
        quickPickupBonus: 180
      })
    ).toEqual([
      { label: "Rush pickup", value: "+180" },
      { label: "Launch burst", value: "+120 / boost after pickup" },
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Comet finish", value: "+320 / 75% fuel + perfect dock" },
      { label: "Chain finish", value: "carry chain home" },
      { label: "Perfect dock", value: "+220" },
      { label: "No brake", value: "+150 / no manual brake" },
      { label: "Last Drop", value: "+170 / <=5% fuel" }
    ]);
  });

  it("surfaces chain finish as the chain relay bonus target before hazard pay", () => {
    expect(
      buildPreflightBonusObjectives({
        contractId: "chain-relay",
        quickPickupBonus: 180,
        hazardSeverityMultiplier: 1.3
      })
    ).toEqual([
      { label: "Rush pickup", value: "+180" },
      { label: "Launch burst", value: "+120 / boost after pickup" },
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Comet finish", value: "+320 / 75% fuel + perfect dock" },
      { label: "Chain finish", value: "5.5s chain window" },
      { label: "Needle thread", value: "42+ speed" },
      { label: "No brake", value: "+150 / no manual brake" },
      { label: "Last Drop", value: "+170 / <=5% fuel" }
    ]);
  });
});

describe("preflight puzzle goals", () => {
  it("keeps the standard route briefing to three compact launch goals", () => {
    expect(
      buildPreflightPuzzleGoals({
        contractId: "first-light-delivery",
        targetDistanceLabel: "216m",
        goldSeconds: 35,
        interceptorCount: 2,
        riskGateCount: 0,
        clearedRiskGateCount: 0
      })
    ).toEqual([
      { label: "Route", value: "216m", tone: "route" },
      { label: "Clock", value: "35s", detail: "Gold", tone: "pace" },
      { label: "Fire", value: "2 ships", detail: "+35 tags", tone: "combat" }
    ]);
  });

  it("turns asteroid routes into a thread puzzle with gate pressure", () => {
    expect(
      buildPreflightPuzzleGoals({
        contractId: "asteroid-sprint",
        targetDistanceLabel: "318m",
        goldSeconds: 24.6,
        hazardSeverityMultiplier: 1.45,
        interceptorCount: 2,
        riskGateCount: 2,
        clearedRiskGateCount: 0,
        nextRiskGateDistance: 140,
        nextRiskGateStyleBonus: 190
      })
    ).toEqual([
      { label: "Route", value: "318m", tone: "route" },
      { label: "Thread", value: "42+ speed", detail: "Asteroid line", tone: "risk" },
      { label: "Gate", value: "0/2", detail: "140m", tone: "risk" }
    ]);
  });

  it("surfaces gravity sling routes as an arc puzzle", () => {
    expect(
      buildPreflightPuzzleGoals({
        contractId: "gravity-slingshot",
        targetDistanceLabel: "280m",
        goldSeconds: 31,
        interceptorCount: 1,
        riskGateCount: 0,
        clearedRiskGateCount: 0
      })
    ).toEqual([
      { label: "Route", value: "280m", tone: "route" },
      { label: "Sling", value: "54+ speed", detail: "+240", tone: "style" },
      { label: "Fire", value: "1 ship", detail: "+35 tags", tone: "combat" }
    ]);
  });

  it("keeps fragile special routes readable as one-rule puzzles", () => {
    expect(
      buildPreflightPuzzleGoals({
        contractId: "antimatter-drift",
        targetDistanceLabel: "242m",
        goldSeconds: 28,
        interceptorCount: 0,
        riskGateCount: 0,
        clearedRiskGateCount: 0
      })[1]
    ).toEqual({ label: "Brake", value: "No brake", detail: "Clean dock", tone: "clutch" });

    expect(
      buildPreflightPuzzleGoals({
        contractId: "last-drop-run",
        targetDistanceLabel: "260m",
        goldSeconds: 33,
        interceptorCount: 0,
        riskGateCount: 0,
        clearedRiskGateCount: 0
      })[1]
    ).toEqual({ label: "Fuel", value: "<=5%", detail: "Soft dock", tone: "clutch" });
  });
});
