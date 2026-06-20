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
      "asteroid-labyrinth",
      "gravity-slingshot",
      "gravity-lockpick",
      "solar-thread",
      "chain-relay",
      "interceptor-swarm",
      "black-forge-capture",
      "antimatter-drift",
      "last-drop-run"
    ]);
    expect(parsed.planets.find((planet) => planet.id === "black-forge")).toMatchObject({
      name: "Forge Prime",
      visualTheme: "black_metal",
      radius: 58
    });
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.briefing ?? "").toContain("asteroid");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.riskLabel).toBe("Asteroid Field");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.rewardLabel).toBe("Skim style bonuses");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.cargoId).toBe("volatile-comet-ice");
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-sprint")?.hazardSeverityMultiplier).toBe(1.45);
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-labyrinth")).toMatchObject({
      title: "Asteroid Labyrinth",
      riskLabel: "Asteroid Maze",
      rewardLabel: "Maze gate bonuses",
      cargoId: "labyrinth-relay-core",
      hazardSeverityMultiplier: 1.55,
      riskGateCount: 5,
      medalTimes: { bronze: 86, silver: 54, gold: 32 }
    });
    expect(parsed.contracts.find((contract) => contract.id === "asteroid-labyrinth")?.hazards).toHaveLength(6);
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
    expect(parsed.contracts.find((contract) => contract.id === "gravity-lockpick")).toMatchObject({
      title: "Gravity Lockpick",
      riskLabel: "Orbit Key",
      rewardLabel: "Clean arc bonuses",
      cargoId: "bottled-starlight",
      hazardSeverityMultiplier: 1.1,
      shipStart: {
        position: [88, -205],
        velocity: [48, -2],
        rotation: 0.18,
        fuel: 68
      },
      medalTimes: { bronze: 58, silver: 36, gold: 22 }
    });
    expect(parsed.contracts.find((contract) => contract.id === "solar-thread")).toMatchObject({
      title: "Solar Thread",
      riskLabel: "Solar Wind",
      rewardLabel: "Gate chain bonuses",
      cargoId: "midnight-medicine",
      hazardSeverityMultiplier: 1.35,
      riskGateCount: 3,
      medalTimes: { bronze: 62, silver: 38, gold: 23 }
    });
    expect(parsed.contracts.find((contract) => contract.id === "solar-thread")?.hazards).toHaveLength(3);
    expect(parsed.contracts.find((contract) => contract.id === "chain-relay")).toMatchObject({
      title: "Chain Relay",
      riskLabel: "Chain Timer",
      rewardLabel: "Chain finish bonuses",
      cargoId: "volatile-comet-ice",
      hazardSeverityMultiplier: 1.3,
      medalTimes: { bronze: 64, silver: 38, gold: 22 }
    });
    expect(parsed.contracts.find((contract) => contract.id === "interceptor-swarm")).toMatchObject({
      title: "Interceptor Swarm",
      riskLabel: "Enemy Wave",
      rewardLabel: "Combat style bonuses",
      cargoId: "midnight-medicine",
      enemyWave: { drones: 4, fighters: 2, brutes: 0 },
      medalTimes: { bronze: 82, silver: 50, gold: 30 }
    });
    expect(parsed.contracts.find((contract) => contract.id === "black-forge-capture")).toMatchObject({
      title: "Black Forge Capture",
      riskLabel: "Raid Objective",
      rewardLabel: "Capture bonuses",
      destinationId: "forge-dock",
      cargoId: "capture-beacon",
      enemyWave: { drones: 2, fighters: 2, brutes: 1 },
      medalTimes: { bronze: 96, silver: 58, gold: 36 }
    });
    expect(parsed.contracts.find((contract) => contract.id === "antimatter-drift")).toMatchObject({
      title: "Antimatter Drift",
      riskLabel: "Unstable Cargo",
      rewardLabel: "Brake discipline",
      cargoId: "unstable-antimatter-vial",
      shipStart: {
        position: [180, 20],
        velocity: [0, 18],
        rotation: 1.5707963267948966,
        fuel: 72
      },
      medalTimes: { bronze: 78, silver: 46, gold: 28 }
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
      kind: "volatile",
      fragility: 1
    });
    expect(parsed.cargo.find((cargo) => cargo.id === "midnight-medicine")).toMatchObject({
      name: "Midnight Medicine",
      kind: "time-sensitive",
      fragility: 0.9
    });
    expect(parsed.cargo.find((cargo) => cargo.id === "unstable-antimatter-vial")).toMatchObject({
      name: "Unstable Antimatter Vial",
      kind: "unstable",
      fragility: 0.95
    });
    expect(parsed.cargo.find((cargo) => cargo.id === "labyrinth-relay-core")).toMatchObject({
      name: "Labyrinth Relay Core",
      kind: "magnetic",
      fragility: 0.85
    });
    expect(parsed.cargo.find((cargo) => cargo.id === "capture-beacon")).toMatchObject({
      name: "Capture Beacon",
      kind: "magnetic",
      fragility: 0.82
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
