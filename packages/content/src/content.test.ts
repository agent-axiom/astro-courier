import { describe, expect, it } from "vitest";
import starterRoute from "../data/systems/starter-route.json";
import { systemSchema, validateSystemContent } from "./index";

describe("content schemas", () => {
  it("validates the starter route content bundle", () => {
    const parsed = validateSystemContent(starterRoute);

    expect(parsed.id).toBe("starter-route");
    expect(parsed.contracts[0]?.id).toBe("first-light-delivery");
    expect(parsed.contracts.map((contract) => contract.id)).toEqual([
      "first-light-delivery",
      "return-leg",
      "asteroid-sprint",
      "gravity-slingshot",
      "chain-relay",
      "last-drop-run"
    ]);
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.briefing ?? "").toContain("asteroid");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.riskLabel).toBe("Asteroid Field");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.rewardLabel).toBe("Skim style bonuses");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.cargoId).toBe("volatile-comet-ice");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.hazardSeverityMultiplier).toBe(1.45);
    expect(parsed.contracts.find((contract) => contract.id === "gravity-slingshot")).toMatchObject({
      title: "Gravity Slingshot",
      riskLabel: "Gravity Entry",
      rewardLabel: "Gravity sling bonuses",
      cargoId: "bottled-starlight",
      hazardSeverityMultiplier: 1.2,
      shipStart: {
        position: [120, -240],
        velocity: [62, 12],
        rotation: 0.2
      },
      medalTimes: { bronze: 76, silver: 44, gold: 26 }
    });
    expect(parsed.contracts.find((contract) => contract.id === "chain-relay")).toMatchObject({
      title: "Chain Relay",
      riskLabel: "Chain Timer",
      rewardLabel: "Chain finish bonuses",
      cargoId: "volatile-comet-ice",
      hazardSeverityMultiplier: 1.3,
      medalTimes: { bronze: 64, silver: 38, gold: 22 }
    });
    expect(parsed.contracts.find((contract) => contract.id === "last-drop-run")).toMatchObject({
      title: "Last Drop Run",
      riskLabel: "Low Fuel",
      rewardLabel: "Last Drop bonuses",
      cargoId: "midnight-medicine",
      shipStart: {
        position: [190, 18],
        velocity: [4, 22],
        rotation: 1.5707963267948966,
        fuel: 22
      },
      medalTimes: { bronze: 72, silver: 44, gold: 27 }
    });
    expect(parsed.cargo.find((cargo) => cargo.id === "volatile-comet-ice")).toMatchObject({
      name: "Volatile Comet Ice",
      kind: "unstable",
      fragility: 1
    });
    expect(parsed.cargo.find((cargo) => cargo.id === "midnight-medicine")).toMatchObject({
      name: "Midnight Medicine",
      kind: "time-sensitive",
      fragility: 0.9
    });
    expect(parsed.contracts.find((contract) => contract.id === "return-leg")?.shipStart?.position).toEqual([360, -140]);
    expect(parsed.planets[0]?.landingPads[0]?.allowedApproachSpeed).toBeGreaterThan(0);
  });

  it("rejects invalid gravity and landing thresholds", () => {
    const result = systemSchema.safeParse({
      ...starterRoute,
      planets: [
        {
          ...starterRoute.planets[0],
          gravityMass: -1,
          landingPads: [
            {
              ...starterRoute.planets[0].landingPads[0],
              allowedApproachSpeed: 0
            }
          ]
        }
      ]
    });

    if (result.success) {
      throw new Error("Expected invalid content to fail validation");
    }

    const issuePaths = result.error.issues.map((issue) => issue.path.join("."));
    expect(issuePaths).toContain("planets.0.gravityMass");
    expect(issuePaths).toContain("planets.0.landingPads.0.allowedApproachSpeed");
  });
});
