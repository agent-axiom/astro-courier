import { describe, expect, it } from "vitest";
import { buildPreflightBonusObjectives, buildPreflightMasteryTargets } from "./mastery";

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
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Clean skim", value: "from +140" },
      { label: "Perfect dock", value: "+220" },
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
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Needle thread", value: "42+ speed" },
      { label: "Danger pay", value: "+180" },
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
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Gravity sling", value: "+240 / 54+ speed" },
      { label: "Perfect dock", value: "+220" },
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
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Chain finish", value: "carry chain home" },
      { label: "Perfect dock", value: "+220" },
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
      { label: "Express finish", value: "+180 / gold pace" },
      { label: "Chain finish", value: "carry chain home" },
      { label: "Needle thread", value: "42+ speed" },
      { label: "Last Drop", value: "+170 / <=5% fuel" }
    ]);
  });
});
