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
      "gravity-slingshot"
    ]);
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.briefing ?? "").toContain("asteroid");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.riskLabel).toBe("Asteroid Field");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.rewardLabel).toBe("Skim style bonuses");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.cargoId).toBe("volatile-comet-ice");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.hazardSeverityMultiplier).toBe(1.45);
    expect(parsed.contracts.find((contract) => contract.id === "gravity-slingshot")).toMatchObject({
      title: "Gravity Slingshot",
      riskLabel: "Gravity Entry",
      rewardLabel: "Comet reserve challenge",
      cargoId: "bottled-starlight",
      hazardSeverityMultiplier: 1.2,
      shipStart: {
        position: [120, -240],
        velocity: [62, 12],
        rotation: 0.2
      },
      medalTimes: { bronze: 76, silver: 44, gold: 26 }
    });
    expect(parsed.cargo.find((cargo) => cargo.id === "volatile-comet-ice")).toMatchObject({
      name: "Volatile Comet Ice",
      kind: "unstable",
      fragility: 1
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
