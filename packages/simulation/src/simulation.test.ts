import { describe, expect, it } from "vitest";
import { createCommandBuffer, checksumReplay } from "@astro-courier/engine";
import type { ContractDifficultyTier, PlayerCommand, Vec2 } from "@astro-courier/shared";
import {
  calculateHazardThreadStyleBonus,
  calculateHazardSkimStyleBonus,
  BOOST_COOLDOWN_SECONDS,
  ECO_DRIFT_FUEL_USED_LIMIT,
  ECO_DRIFT_STYLE_BONUS,
  EXPRESS_FINISH_STYLE_BONUS,
  EMERGENCY_SHIELD_REBOUND_DAMAGE,
  GRAVITY_SLING_STYLE_BONUS,
  CHAIN_FINISH_STYLE_BONUS,
  CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS,
  COMET_FINISH_STYLE_BONUS,
  DAMAGE_CONTROL_STYLE_BONUS,
  LAST_DROP_STYLE_BONUS,
  LANDING_ASSIST_FUEL_COST,
  NO_BRAKE_STYLE_BONUS,
  QUICK_PICKUP_STYLE_BONUS,
  MAZE_GATE_CHAIN_STYLE_BONUS,
  RISK_GATE_SPEED_THRESHOLD,
  RISK_GATE_STYLE_BONUS,
  STYLE_CHAIN_WINDOW_SECONDS,
  createWorldFromSystem,
  createWorldReplay,
  gravityAccelerationAt,
  predictTrajectory,
  retroBrakeImpulse,
  snapshotWorld,
  stepWorld,
  summarizeRun,
  type SimulationWorld,
  type SystemContent
} from "./index";

const starterSystem: SystemContent = {
  id: "test-route",
  name: "Test Route",
  difficulty: 1,
  background: "test-nebula",
  musicIntensity: "stealth",
  ship: {
    startPosition: [120, 0],
    startVelocity: [0, 22],
    rotation: Math.PI / 2,
    fuel: 90,
    thrustPower: 55,
    rotationPower: 3.5
  },
  planets: [
    {
      id: "luma",
      name: "Luma",
      position: [0, 0],
      radius: 64,
      gravityMass: 1400,
      influenceRadius: 360,
      visualTheme: "blue_garden",
      landingPads: [
        {
          id: "north-pad",
          position: [0, -74],
          normalAngle: -Math.PI / 2,
          radius: 18,
          allowedApproachSpeed: 42,
          requiredAngleTolerance: 0.75
        }
      ]
    }
  ],
  stations: [
    {
      id: "tea-station",
      name: "Tea Station",
      position: [260, -80],
      landingPads: [
        {
          id: "dock-a",
          position: [260, -80],
          normalAngle: 0,
          radius: 22,
          allowedApproachSpeed: 38,
          requiredAngleTolerance: 0.85
        }
      ]
    }
  ],
  hazards: [],
  contracts: [
    {
      id: "first-light",
      title: "First Light Delivery",
      briefing: "Run the standard Luma courier line.",
      riskLabel: "Training Route",
      rewardLabel: "Clean delivery bonuses",
      pickupId: "north-pad",
      destinationId: "dock-a",
      cargoId: "bottled-starlight",
      medalTimes: {
        bronze: 90,
        silver: 55,
        gold: 35
      }
    }
  ],
  cargo: [
    {
      id: "bottled-starlight",
      name: "Bottled Starlight",
      kind: "fragile",
      fragility: 0.8
    }
  ]
};

describe("deterministic Astro Courier simulation", () => {
  it("calculates hazard skim style payout from hazard severity", () => {
    expect(calculateHazardSkimStyleBonus(0.75)).toBe(230);
  });

  it("applies contract-specific fuel starts for low-fuel challenge routes", () => {
    const world = createWorldFromSystem(
      {
        ...starterSystem,
        contracts: [
          ...starterSystem.contracts,
          {
            id: "last-drop",
            title: "Last Drop",
            briefing: "Low fuel courier challenge.",
            riskLabel: "Low Fuel",
            rewardLabel: "Last Drop bonuses",
            shipStart: {
              position: [140, 12],
              velocity: [4, 20],
              rotation: Math.PI / 2,
              fuel: 22
            },
            pickupId: "north-pad",
            destinationId: "dock-a",
            cargoId: "bottled-starlight",
            medalTimes: { bronze: 72, silver: 44, gold: 27 }
          }
        ]
      },
      "seed",
      { contractId: "last-drop" }
    );

    expect(world.ship.fuel).toBe(22);
    expect(world.ship.maxFuel).toBe(22);
    expect(snapshotWorld(world).ship.fuel).toBe(22);
  });

  it("exposes and resolves longhaul refuel stops without completing the delivery", () => {
    const systemWithFuelStop: SystemContent = {
      ...starterSystem,
      stations: [
        ...starterSystem.stations,
        {
          id: "relay-fuel",
          name: "Relay Fuel",
          role: "fuel",
          position: [440, -160],
          landingPads: [
            {
              id: "relay-fuel-pad",
              position: [440, -160],
              normalAngle: 0,
              radius: 24,
              allowedApproachSpeed: 35,
              requiredAngleTolerance: 0.8
            }
          ]
        }
      ],
      contracts: [
        ...starterSystem.contracts,
        {
          id: "longhaul-test",
          title: "Longhaul Test",
          briefing: "Cross the wide lane and refuel once.",
          riskLabel: "Longhaul",
          rewardLabel: "Fuel-stop routing",
          missionType: "longhaul",
          shipStart: {
            position: [120, 0],
            velocity: [8, 0],
            rotation: 0,
            fuel: 60
          },
          pickupId: "north-pad",
          destinationId: "dock-a",
          refuelStationIds: ["relay-fuel-pad"],
          cargoId: "bottled-starlight",
          medalTimes: { bronze: 140, silver: 96, gold: 62 }
        }
      ]
    };
    const world = createWorldFromSystem(systemWithFuelStop, "refuel-seed", { contractId: "longhaul-test" });

    expect(snapshotWorld(world).refuelStop).toMatchObject({
      id: "relay-fuel-pad",
      distance: expect.any(Number),
      ready: false,
      fuelGain: 0
    });

    world.ship.position = { x: 440, y: -160 };
    world.ship.velocity = { x: 3, y: 0 };
    world.ship.rotation = 0;
    world.ship.fuel = 9;

    stepWorld(world, 1 / 60, [], { combat: false });

    expect(world.status).toBe("flying");
    expect(world.objectivePhase).toBe("pickup");
    expect(world.ship.fuel).toBeGreaterThan(54);
    expect(world.refueledPadIds).toContain("relay-fuel-pad");
    expect(world.lastMilestone).toBe("Refueled");
    expect(snapshotWorld(world).refuelStop).toBeUndefined();

    world.ship.fuel = 12;
    world.ship.position = { x: 440, y: -160 };
    world.ship.velocity = { x: 2, y: 0 };
    stepWorld(world, 1 / 60, [], { combat: false });

    expect(world.ship.fuel).toBeLessThan(13);
  });

  it("produces the same summary and checksum for the same seed and command frames", () => {
    const commands = createCommandBuffer([
      { tick: 0, command: { type: "THRUST", amount: 1 } },
      { tick: 12, command: { type: "AIM", angle: 0.2 } },
      { tick: 24, command: { type: "THRUST", amount: 0.4 } },
      { tick: 40, command: { type: "BRAKE", amount: 0.2 } }
    ]);

    const first = createWorldReplay({
      system: starterSystem,
      seed: "same-seed",
      commandBuffer: commands,
      ticks: 90
    });
    const second = createWorldReplay({
      system: starterSystem,
      seed: "same-seed",
      commandBuffer: commands,
      ticks: 90
    });

    expect(summarizeRun(first.world)).toEqual(summarizeRun(second.world));
    expect(checksumReplay(first.replay)).toEqual(checksumReplay(second.replay));
  });

  it("accelerates the ship toward gravity sources without producing NaN values", () => {
    const world = createWorldFromSystem(starterSystem, "gravity-seed");
    const initialDistance = Math.hypot(world.ship.position.x, world.ship.position.y);

    for (let i = 0; i < 60; i += 1) {
      stepWorld(world, 1 / 60, []);
    }

    const nextDistance = Math.hypot(world.ship.position.x, world.ship.position.y);

    expect(nextDistance).toBeLessThan(initialDistance);
    expect(Number.isFinite(world.ship.position.x)).toBe(true);
    expect(Number.isFinite(world.ship.position.y)).toBe(true);
    expect(Number.isFinite(world.ship.velocity.x)).toBe(true);
    expect(Number.isFinite(world.ship.velocity.y)).toBe(true);
  });

  it("calculates gravity as a bounded inverse-square acceleration toward the source", () => {
    const source = {
      id: "luma",
      name: "Luma",
      visualTheme: "blue_garden",
      position: { x: 0, y: 0 },
      radius: 64,
      gravityMass: 1400,
      influenceRadius: 360
    };
    const near = gravityAccelerationAt({ x: 120, y: 0 }, source);
    const far = gravityAccelerationAt({ x: 240, y: 0 }, source);
    const outside = gravityAccelerationAt({ x: 420, y: 0 }, source);

    expect(near.x).toBeLessThan(0);
    expect(Math.abs(near.x)).toBeGreaterThan(Math.abs(far.x));
    expect(far.y).toBeCloseTo(0, 6);
    expect(outside).toEqual({ x: 0, y: 0 });
  });

  it("turns manual braking into a capped retro impulse against current velocity", () => {
    expect(retroBrakeImpulse({ x: 12, y: 0 }, 5)).toEqual({ x: -5, y: 0 });
    expect(retroBrakeImpulse({ x: 3, y: 4 }, 12)).toEqual({ x: -3, y: -4 });
    expect(retroBrakeImpulse({ x: 0, y: 0 }, 12)).toEqual({ x: 0, y: 0 });
  });

  it("awards one gravity sling style hit for a clean high-speed gravity pocket pass", () => {
    const world = createWorldFromSystem(starterSystem, "gravity-sling-seed");
    world.ship.position = { x: 0, y: -160 };
    world.ship.velocity = { x: 58, y: 0 };
    world.ship.rotation = 0;
    world.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, [], {
      enemyDirectorDirective: {
        formation: "screen",
        missileDoctrine: "single",
        tempo: "push",
        pressure: 0.6
      }
    });
    const firstBreakdown = summarizeRun(world).scoreBreakdown;

    expect(world.lastMilestone).toBe("Gravity Sling");
    expect(world.lastStyleAward).toBe(GRAVITY_SLING_STYLE_BONUS);
    expect(firstBreakdown.styleBonus).toBe(GRAVITY_SLING_STYLE_BONUS);

    stepWorld(world, 1 / 60, [], {
      enemyDirectorDirective: {
        formation: "screen",
        missileDoctrine: "single",
        tempo: "push",
        pressure: 0.6
      }
    });

    expect(world.lastStyleAward).toBeUndefined();
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(firstBreakdown.styleBonus);
  });

  it("reports a gravity sling opportunity while the ship is clean inside a gravity pocket", () => {
    const world = createWorldFromSystem(starterSystem, "gravity-sling-window-seed");
    world.ship.position = { x: 0, y: -160 };
    world.ship.velocity = { x: 48, y: 0 };

    expect(snapshotWorld(world).gravitySlingOpportunity).toEqual({
      id: "luma",
      name: "Luma",
      distance: 160,
      ready: false,
      speedThreshold: 54,
      styleBonus: 240
    });
  });

  it("preserves gravity source visual themes in snapshots", () => {
    const world = createWorldFromSystem(starterSystem, "gravity-theme-seed");

    expect(snapshotWorld(world).gravitySources[0]).toMatchObject({
      id: "luma",
      visualTheme: "blue_garden"
    });
  });

  it("does not award gravity sling style for a rough near-surface pickup", () => {
    const world = createWorldFromSystem(starterSystem, "gravity-sling-crash-seed");
    world.ship.position = { x: 0, y: -74 };
    world.ship.velocity = { x: 58, y: 0 };
    world.ship.rotation = 0;
    world.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("flying");
    expect(world.objectivePhase).toBe("delivery");
    expect(world.cargoOnboard).toBe(true);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(0);
  });

  it("requires pickup before destination delivery", () => {
    const world = createWorldFromSystem(starterSystem, "dock-seed");
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;
    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("flying");
    expect(world.objectivePhase).toBe("pickup");
    expect(world.cargoOnboard).toBe(false);
    expect(world.lastMilestone).toBe("Pickup Required");
  });

  it("gates boost burns behind a short cooldown", () => {
    const world = createWorldFromSystem(starterSystem, "boost-seed");

    stepWorld(world, 1 / 60, [{ type: "BOOST" }]);
    const fuelAfterFirstBoost = world.ship.fuel;

    expect(world.lastMilestone).toBe("Boost Burn");
    expect(world.ship.boostCooldownSeconds).toBeCloseTo(BOOST_COOLDOWN_SECONDS, 3);
    expect(snapshotWorld(world).ship.boostCooldownSeconds).toBeCloseTo(BOOST_COOLDOWN_SECONDS, 3);

    stepWorld(world, 1 / 60, [{ type: "BOOST" }]);

    expect(world.lastMilestone).toBeUndefined();
    expect(world.ship.fuel).toBe(fuelAfterFirstBoost);

    for (let tick = 0; tick < Math.ceil(BOOST_COOLDOWN_SECONDS / (1 / 60)) + 2; tick += 1) {
      stepWorld(world, 1 / 60, []);
    }

    expect(world.ship.boostCooldownSeconds).toBe(0);
    stepWorld(world, 1 / 60, [{ type: "BOOST" }]);
    expect(world.lastMilestone).toBeDefined();
    expect(world.ship.fuel).toBeLessThan(fuelAfterFirstBoost);
  });

  it("ends a dry-fuel drift with a black-hole crash after eighteen seconds", () => {
    const world = createWorldFromSystem(starterSystem, "dry-fuel-seed");
    world.ship.fuel = 0;

    for (let tick = 0; tick < 17 * 60; tick += 1) {
      stepWorld(world, 1 / 60, []);
    }

    expect(world.status).toBe("flying");
    expect(snapshotWorld(world).fuelDepletedCountdownSeconds).toBe(1);

    for (let tick = 0; tick < 60 - 1; tick += 1) {
      stepWorld(world, 1 / 60, []);
    }

    expect(world.status).toBe("flying");
    expect(snapshotWorld(world).fuelDepletedCountdownSeconds).toBe(0);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("crashed");
    expect(world.crashReason).toBe("Fuel Depleted");
    expect(world.ship.hp).toBe(0);
    expect(world.ship.cargoDamage).toBe(1);
    expect(snapshotWorld(world)).toMatchObject({
      crashReason: "Fuel Depleted",
      blackHole: {
        position: world.ship.position,
        radius: 66,
        pullRadius: 170,
        intensity: 1
      }
    });
  });

  it("starts non-combat runs with ship HP and no hidden interceptor patrol", () => {
    const world = createWorldFromSystem(starterSystem, "combat-seed");
    const snapshot = combatSnapshot(world);

    expect(snapshot.ship.hp).toBe(100);
    expect(snapshot.ship.maxHp).toBe(100);
    expect(snapshot.enemies).toEqual([]);
    expect(snapshot.playerProjectiles).toEqual([]);
    expect(snapshot.enemyProjectiles).toEqual([]);
  });

  it("spawns mixed enemy archetypes with distinct combat stats", () => {
    const combatSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "role-test",
          title: "Role Test",
          briefing: "Verify explicit enemy roles.",
          riskLabel: "Enemy Roles",
          rewardLabel: "Combat check",
          pickupId: "north-pad",
          destinationId: "dock-a",
          cargoId: "bottled-starlight",
          enemyWave: { drones: 1, fighters: 1, brutes: 0, sentinels: 0 },
          medalTimes: { bronze: 82, silver: 50, gold: 30 }
        }
      ]
    };
    const world = createWorldFromSystem(combatSystem, "combat-role-seed", { contractId: "role-test" });
    const snapshot = combatSnapshot(world);

    expect(snapshot.enemies.map((enemy) => enemy.archetype)).toEqual(["fighter", "drone"]);
    expect(snapshot.enemies[0]).toMatchObject({
      archetype: "fighter",
      hp: 36,
      maxHp: 36,
      radius: 14
    });
    expect(snapshot.enemies[1]).toMatchObject({
      archetype: "drone",
      hp: 20,
      maxHp: 20,
      radius: 10
    });
    expect(combatWorld(world).enemies[1].maxSpeed).toBeGreaterThan(combatWorld(world).enemies[0].maxSpeed);
  });

  it("keeps hard contracts below missile pressure until raid tiers", () => {
    const hardSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "hard-no-missile-test",
          title: "Hard No Missile Test",
          briefing: "Hard should add combat without missile shock.",
          riskLabel: "Hard",
          rewardLabel: "Pressure check",
          pickupId: "north-pad",
          destinationId: "dock-a",
          cargoId: "bottled-starlight",
          difficultyTier: "hard",
          enemyWave: { drones: 0, fighters: 1, brutes: 1, sentinels: 0 },
          medalTimes: { bronze: 82, silver: 50, gold: 30 }
        },
        {
          id: "raid-missile-test",
          title: "Raid Missile Test",
          briefing: "Raid can introduce missile pressure.",
          riskLabel: "Raid",
          rewardLabel: "Missile check",
          pickupId: "north-pad",
          destinationId: "dock-a",
          cargoId: "bottled-starlight",
          difficultyTier: "raid",
          enemyWave: { drones: 0, fighters: 1, brutes: 1, sentinels: 0 },
          medalTimes: { bronze: 82, silver: 50, gold: 30 }
        }
      ]
    };

    const hard = combatWorld(createWorldFromSystem(hardSystem, "hard-no-missiles", { contractId: "hard-no-missile-test" }));
    const raid = combatWorld(createWorldFromSystem(hardSystem, "raid-has-missiles", { contractId: "raid-missile-test" }));

    expect(hard.enemies.every((enemy) => enemy.missileAmmo === 0)).toBe(true);
    expect(raid.enemies.some((enemy) => enemy.missileAmmo > 0)).toBe(true);
  });

  it("uses contract enemy waves to create larger combat missions", () => {
    const waveSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "swarm-test",
          title: "Swarm Test",
          briefing: "Survive a larger enemy wave.",
          riskLabel: "Enemy Wave",
          rewardLabel: "Combat style bonuses",
          pickupId: "north-pad",
          destinationId: "dock-a",
          cargoId: "bottled-starlight",
          enemyWave: { drones: 3, fighters: 2, brutes: 1, sentinels: 1 },
          medalTimes: { bronze: 82, silver: 50, gold: 30 }
        }
      ]
    };

    const world = createWorldFromSystem(waveSystem, "combat-wave-seed", { contractId: "swarm-test" });
    const snapshot = combatSnapshot(world);

    expect(snapshot.enemies.map((enemy) => enemy.archetype)).toEqual(["fighter", "fighter", "drone", "drone", "drone", "brute", "sentinel"]);
    expect(new Set(snapshot.enemies.map((enemy) => enemy.id)).size).toBe(7);
    expect(snapshot.enemies.find((enemy) => enemy.archetype === "brute")).toMatchObject({
      hp: 70,
      radius: 20
    });
    expect(snapshot.enemies.find((enemy) => enemy.archetype === "sentinel")).toMatchObject({
      hp: 108,
      radius: 25
    });
  });

  it("spawns guardian and missile boat roles with distinct pressure profiles", () => {
    const roleSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "combat-v2-role-test",
          title: "Combat V2 Role Test",
          briefing: "Verify specialized combat roles.",
          riskLabel: "Enemy Roles",
          rewardLabel: "Role check",
          pickupId: "north-pad",
          destinationId: "dock-a",
          cargoId: "bottled-starlight",
          difficultyTier: "raid",
          enemyWave: { drones: 0, fighters: 0, brutes: 0, sentinels: 0, guardians: 1, missileBoats: 1 },
          medalTimes: { bronze: 90, silver: 60, gold: 40 }
        }
      ]
    };

    const snapshot = combatSnapshot(createWorldFromSystem(roleSystem, "combat-v2-role-seed", { contractId: "combat-v2-role-test" }));

    expect(snapshot.enemies.map((enemy) => enemy.archetype)).toEqual(["guardian", "missileBoat"]);
    expect(snapshot.enemies.find((enemy) => enemy.archetype === "guardian")).toMatchObject({
      shield: 42,
      maxShield: 42,
      armor: 6,
      radius: 18
    });
    expect(snapshot.enemies.find((enemy) => enemy.archetype === "missileBoat")).toMatchObject({
      missileAmmo: 2,
      radius: 17
    });
  });

  it("scales enemy armor and shields by contract difficulty tier", () => {
    const waveSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "armored-raid-test",
          title: "Armored Raid Test",
          briefing: "Raid armor should be visible and durable.",
          riskLabel: "Raid",
          rewardLabel: "Durability check",
          pickupId: "north-pad",
          destinationId: "dock-a",
          cargoId: "bottled-starlight",
          difficultyTier: "raid",
          enemyWave: { drones: 0, fighters: 1, brutes: 1, sentinels: 1 },
          medalTimes: { bronze: 82, silver: 50, gold: 30 }
        }
      ]
    };

    const world = createWorldFromSystem(waveSystem, "combat-armor-seed", { contractId: "armored-raid-test" });
    const snapshot = combatSnapshot(world);
    const fighter = snapshot.enemies.find((enemy) => enemy.archetype === "fighter");
    const sentinel = snapshot.enemies.find((enemy) => enemy.archetype === "sentinel");

    expect(fighter).toMatchObject({
      difficultyTier: "raid",
      armor: 5,
      shield: 12,
      maxShield: 12,
      maxHp: 52
    });
    expect(sentinel).toMatchObject({
      difficultyTier: "raid",
      armor: 15,
      shield: 36,
      maxShield: 36,
      maxHp: 156
    });
  });

  it("allows calm opt-in contracts to disable the default enemy patrol", () => {
    const calmSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "training-flight",
          title: "Training Flight",
          briefing: "Practice launch, pickup, and dock.",
          riskLabel: "No Patrol",
          rewardLabel: "Control practice",
          pickupId: "north-pad",
          destinationId: "dock-a",
          cargoId: "bottled-starlight",
          enemyWave: { drones: 0, fighters: 0, brutes: 0 },
          medalTimes: { bronze: 120, silver: 90, gold: 60 }
        }
      ]
    };

    const world = createWorldFromSystem(calmSystem, "calm-training-seed", { contractId: "training-flight" });

    expect(combatSnapshot(world).enemies).toEqual([]);
  });

  it("starts with a selected run perk and deterministic risk gates", () => {
    const systemWithHazard: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "risk-field",
          type: "asteroid_field",
          position: [165, -76],
          radius: 36,
          severity: 0.55
        }
      ]
    };
    const world = createWorldFromSystem(systemWithHazard, "perk-seed", { perkId: "afterburner" });
    const snapshot = snapshotWorld(world);

    expect(world.activePerk).toBe("afterburner");
    expect(snapshot.activePerk).toBe("afterburner");
    expect(snapshot.riskGates).toHaveLength(1);
    expect(snapshot.riskGates[0]).toMatchObject({
      id: "risk-gate-risk-field",
      cleared: false,
      radius: 28,
      speedThreshold: RISK_GATE_SPEED_THRESHOLD,
      styleBonus: RISK_GATE_STYLE_BONUS
    });
  });

  it("builds the asteroid labyrinth with contract-only maze hazards and five risk gates", () => {
    const systemWithLabyrinth: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "training-asteroids",
          type: "asteroid_field",
          position: [140, -70],
          radius: 40,
          severity: 0.2
        }
      ],
      contracts: [
        ...starterSystem.contracts,
        {
          id: "asteroid-labyrinth",
          title: "Asteroid Labyrinth",
          briefing: "Read the asteroid maze.",
          riskLabel: "Asteroid Maze",
          rewardLabel: "Maze gate bonuses",
          pickupId: "north-pad",
          destinationId: "dock-a",
          cargoId: "labyrinth-relay-core",
          hazardSeverityMultiplier: 1.55,
          riskGateCount: 5,
          hazards: [
            { id: "maze-wall-a", type: "asteroid_field", position: [70, -125], radius: 26, severity: 0.5 },
            { id: "maze-wall-b", type: "asteroid_field", position: [115, -30], radius: 30, severity: 0.48 },
            { id: "maze-wall-c", type: "asteroid_field", position: [165, -145], radius: 28, severity: 0.52 },
            { id: "maze-wall-d", type: "asteroid_field", position: [210, -36], radius: 30, severity: 0.5 },
            { id: "maze-wall-e", type: "asteroid_field", position: [235, -132], radius: 24, severity: 0.46 },
            { id: "maze-wall-f", type: "asteroid_field", position: [250, -54], radius: 22, severity: 0.44 }
          ],
          medalTimes: { bronze: 86, silver: 54, gold: 32 }
        }
      ],
      cargo: [
        ...starterSystem.cargo,
        {
          id: "labyrinth-relay-core",
          name: "Labyrinth Relay Core",
          kind: "magnetic",
          fragility: 0.85
        }
      ]
    };
    const baseline = createWorldFromSystem(systemWithLabyrinth, "labyrinth-baseline-seed");
    const labyrinth = createWorldFromSystem(systemWithLabyrinth, "labyrinth-seed", { contractId: "asteroid-labyrinth" });
    const snapshot = snapshotWorld(labyrinth);

    expect(baseline.hazards).toHaveLength(1);
    expect(labyrinth.activeContract.title).toBe("Asteroid Labyrinth");
    expect(labyrinth.activeCargo.name).toBe("Labyrinth Relay Core");
    expect(labyrinth.hazards).toHaveLength(7);
    expect(labyrinth.hazards.filter((hazard) => hazard.id.startsWith("maze-"))).toHaveLength(6);
    expect(snapshot.riskGates).toHaveLength(5);
    expect(snapshot.riskGates.map((gate) => gate.id)).toEqual([
      "risk-gate-training-asteroids",
      "risk-gate-maze-wall-a",
      "risk-gate-maze-wall-b",
      "risk-gate-maze-wall-c",
      "risk-gate-maze-wall-d"
    ]);
    expect(snapshot.riskGates.every((gate) => gate.speedThreshold === RISK_GATE_SPEED_THRESHOLD)).toBe(true);
  });

  it("awards a maze chain bonus after every asteroid labyrinth gate is cleared", () => {
    const systemWithLabyrinth: SystemContent = {
      ...starterSystem,
      hazards: [
        { id: "field-a", type: "asteroid_field", position: [70, -105], radius: 24, severity: 0.35 },
        { id: "field-b", type: "asteroid_field", position: [112, -42], radius: 24, severity: 0.35 },
        { id: "field-c", type: "asteroid_field", position: [154, -118], radius: 24, severity: 0.35 },
        { id: "field-d", type: "asteroid_field", position: [198, -44], radius: 24, severity: 0.35 },
        { id: "field-e", type: "asteroid_field", position: [230, -105], radius: 24, severity: 0.35 }
      ],
      contracts: [
        ...starterSystem.contracts,
        {
          id: "asteroid-labyrinth",
          title: "Asteroid Labyrinth",
          briefing: "Read the asteroid maze.",
          riskLabel: "Asteroid Maze",
          rewardLabel: "Maze gate bonuses",
          pickupId: "north-pad",
          destinationId: "dock-a",
          cargoId: "bottled-starlight",
          hazardSeverityMultiplier: 1.55,
          riskGateCount: 5,
          medalTimes: { bronze: 86, silver: 54, gold: 32 }
        }
      ]
    };
    const world = createWorldFromSystem(systemWithLabyrinth, "maze-chain-seed", { contractId: "asteroid-labyrinth" });
    world.gravitySources = [];
    world.landingPads = [];

    for (const gate of world.riskGates) {
      world.ship.position = { ...gate.position };
      world.ship.velocity = { x: gate.speedThreshold + 8, y: 0 };
      stepWorld(world, 1 / 60, [], { combat: false });
    }

    expect(world.clearedRiskGateIds).toHaveLength(5);
    expect(world.lastMilestone).toBe("Maze Chain");
    const expectedGateChainBonus =
      RISK_GATE_STYLE_BONUS +
      Math.round(RISK_GATE_STYLE_BONUS * 1.25) +
      Math.round(RISK_GATE_STYLE_BONUS * 1.5) +
      Math.round(RISK_GATE_STYLE_BONUS * 1.75) +
      Math.round(RISK_GATE_STYLE_BONUS * 2);
    const expectedMazeChainBonus = Math.round(MAZE_GATE_CHAIN_STYLE_BONUS * 2);
    expect(world.lastStyleAward).toBe(expectedMazeChainBonus);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(expectedGateChainBonus + expectedMazeChainBonus);

    stepWorld(world, 1 / 60, [], { combat: false });

    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(expectedGateChainBonus + expectedMazeChainBonus);
  });

  it("lets afterburner trade more fuel for a stronger boost", () => {
    const baseline = createWorldFromSystem(starterSystem, "baseline-boost-seed", { perkId: "shield-crate" });
    const afterburner = createWorldFromSystem(starterSystem, "afterburner-boost-seed", { perkId: "afterburner" });
    for (const world of [baseline, afterburner]) {
      world.gravitySources = [];
      world.landingPads = [];
      world.ship.position = { x: 500, y: 500 };
      world.ship.velocity = { x: 0, y: 0 };
      world.ship.rotation = 0;
      world.ship.targetRotation = 0;
    }

    stepWorld(baseline, 1 / 60, [{ type: "BOOST" }], { combat: false });
    stepWorld(afterburner, 1 / 60, [{ type: "BOOST" }], { combat: false });

    expect(afterburner.ship.velocity.x).toBeGreaterThan(baseline.ship.velocity.x + 6);
    expect(afterburner.fuelUsed).toBeGreaterThan(baseline.fuelUsed);
  });

  it("starts shield-crate runs with extra hull capacity and lighter shield cargo damage", () => {
    const world = createWorldFromSystem(starterSystem, "shield-crate-seed", { perkId: "shield-crate" });
    const source = world.gravitySources[0]!;
    world.ship.position = { x: source.position.x + source.radius - 2, y: source.position.y };
    world.ship.velocity = { x: -18, y: 0 };
    world.ship.rotation = Math.PI;
    world.landingPads = [];

    stepWorld(world, 1 / 60, [], { combat: false });

    expect(world.ship.maxHp).toBe(125);
    expect(world.ship.hp).toBe(125);
    expect(world.emergencyShieldUsed).toBe(true);
    expect(world.ship.cargoDamage).toBeCloseTo(0.08, 3);
  });

  it("loads pulse-shot as one charged player projectile", () => {
    const world = createWorldFromSystem(starterSystem, "pulse-shot-seed", { perkId: "pulse-shot" });
    world.gravitySources = [];
    world.landingPads = [];
    world.enemies = [];
    world.ship.position = { x: 500, y: 500 };
    world.ship.velocity = { x: 0, y: 0 };
    world.ship.rotation = 0;
    world.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, [{ type: "FIRE" }], { combat: false });

    expect(world.playerProjectiles).toHaveLength(1);
    expect(world.playerProjectiles[0]).toMatchObject({
      damage: 42,
      radius: 6
    });
    expect(world.pulseShotAvailable).toBe(false);
  });

  it("lets magnet-clamp grab pickup cargo from a wider lane", () => {
    const baseline = createWorldFromSystem(starterSystem, "baseline-magnet-seed", { perkId: "shield-crate" });
    const magnet = createWorldFromSystem(starterSystem, "magnet-clamp-seed", { perkId: "magnet-clamp" });
    for (const world of [baseline, magnet]) {
      world.enemies = [];
      world.ship.position = { x: 74, y: -74 };
      world.ship.velocity = { x: -4, y: 0 };
      world.ship.rotation = -Math.PI / 2;
      world.ship.targetRotation = -Math.PI / 2;
    }

    stepWorld(baseline, 1 / 60, [], { combat: false });
    stepWorld(magnet, 1 / 60, [], { combat: false });

    expect(baseline.objectivePhase).toBe("pickup");
    expect(baseline.cargoOnboard).toBe(false);
    expect(magnet.objectivePhase).toBe("delivery");
    expect(magnet.cargoOnboard).toBe(true);
  });

  it("turns unlocked ship upgrades into mechanical ship systems", () => {
    const baseline = createWorldFromSystem(starterSystem, "baseline-upgrade-seed", { perkId: "shield-crate" });
    const upgraded = createWorldFromSystem(starterSystem, "ship-upgrade-seed", {
      perkId: "shield-crate",
      shipUpgrades: ["boost-tune", "reinforced-hull", "pulse-rail", "forge-core"]
    });
    for (const world of [baseline, upgraded]) {
      world.gravitySources = [];
      world.landingPads = [];
      world.enemies = [];
      world.ship.position = { x: 500, y: 500 };
      world.ship.velocity = { x: 0, y: 0 };
      world.ship.rotation = 0;
      world.ship.targetRotation = 0;
    }

    stepWorld(baseline, 1 / 60, [{ type: "BOOST" }], { combat: false });
    stepWorld(upgraded, 1 / 60, [{ type: "BOOST" }, { type: "FIRE" }], { combat: false });

    expect(upgraded.ship.maxHp).toBe(140);
    expect(upgraded.ship.hp).toBe(140);
    expect(upgraded.ship.missileAmmo).toBe(4);
    expect(upgraded.ship.velocity.x).toBeGreaterThan(baseline.ship.velocity.x);
    expect(upgraded.fuelUsed).toBeLessThan(baseline.fuelUsed);
    expect(upgraded.playerProjectiles[0]).toMatchObject({
      damage: 42,
      radius: 6
    });
    expect(upgraded.pulseShotAvailable).toBe(false);
  });

  it("lets mag-clamp ship upgrades widen pickup capture without selecting the perk", () => {
    const baseline = createWorldFromSystem(starterSystem, "baseline-upgrade-magnet-seed", { perkId: "shield-crate" });
    const upgraded = createWorldFromSystem(starterSystem, "ship-upgrade-magnet-seed", {
      perkId: "shield-crate",
      shipUpgrades: ["mag-clamp"]
    });
    for (const world of [baseline, upgraded]) {
      world.enemies = [];
      world.ship.position = { x: 74, y: -74 };
      world.ship.velocity = { x: -4, y: 0 };
      world.ship.rotation = -Math.PI / 2;
      world.ship.targetRotation = -Math.PI / 2;
    }

    stepWorld(baseline, 1 / 60, [], { combat: false });
    stepWorld(upgraded, 1 / 60, [], { combat: false });

    expect(baseline.cargoOnboard).toBe(false);
    expect(upgraded.objectivePhase).toBe("delivery");
    expect(upgraded.cargoOnboard).toBe(true);
  });

  it("awards risk gate style once for a fast clean pass", () => {
    const systemWithHazard: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "threadable-field",
          type: "asteroid_field",
          position: [165, -76],
          radius: 36,
          severity: 0.55
        }
      ]
    };
    const world = createWorldFromSystem(systemWithHazard, "risk-gate-clear-seed");
    const gate = world.riskGates[0]!;
    world.gravitySources = [];
    world.landingPads = [];
    world.ship.position = { ...gate.position };
    world.ship.velocity = { x: gate.speedThreshold + 8, y: 0 };

    stepWorld(world, 1 / 60, [], { combat: false });
    const firstStyle = summarizeRun(world).scoreBreakdown.styleBonus;

    expect(gate.cleared).toBe(true);
    expect(world.clearedRiskGateIds).toEqual([gate.id]);
    expect(world.lastMilestone).toBe("Risk Gate");
    expect(world.lastStyleAward).toBe(RISK_GATE_STYLE_BONUS);
    expect(firstStyle).toBe(RISK_GATE_STYLE_BONUS);

    stepWorld(world, 1 / 60, [], { combat: false });

    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(firstStyle);
  });

  it("fires one player projectile per weapon cooldown", () => {
    const world = createWorldFromSystem(starterSystem, "fire-cooldown-seed");
    const combat = combatWorld(world);
    combat.enemies = [testEnemy("interceptor-a", { x: 170, y: 0 })];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };
    combat.ship.rotation = 0;
    combat.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, fireCommand());
    stepWorld(world, 1 / 60, fireCommand());

    expect(combat.playerProjectiles).toHaveLength(1);
    expect(combat.ship.weaponCooldownSeconds).toBeGreaterThan(0);
  });

  it("lets player shots damage and destroy interceptors", () => {
    const world = createWorldFromSystem(starterSystem, "projectile-hit-seed");
    const combat = combatWorld(world);
    combat.enemies = [testEnemy("interceptor-a", { x: 154, y: 0 }, { hp: 20 })];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };
    combat.ship.rotation = 0;
    combat.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, fireCommand());
    for (let tick = 0; tick < 24; tick += 1) {
      stepWorld(world, 1 / 60, []);
    }

    expect(combat.enemies).toHaveLength(0);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBeGreaterThan(0);
  });

  it("awards a direct-hit style chip for damaging an interceptor without destroying it", () => {
    const world = createWorldFromSystem(starterSystem, "direct-hit-seed");
    const combat = combatWorld(world);
    combat.enemies = [testEnemy("interceptor-a", { x: 154, y: 0 }, { hp: 40 })];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };
    combat.ship.rotation = 0;
    combat.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, fireCommand());

    expect(combat.enemies).toHaveLength(1);
    expect(combat.enemies[0].hp).toBe(20);
    expect(world.lastMilestone).toBe("Direct Hit");
    expect(world.lastStyleAward).toBe(35);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(35);
    expect(snapshotWorld(world).styleMultiplier).toBe(1.25);
  });

  it("lets armor and shields absorb player shot damage before hull damage", () => {
    const world = createWorldFromSystem(starterSystem, "armored-hit-seed");
    const combat = combatWorld(world);
    combat.enemies = [testEnemy("armored-interceptor-a", { x: 154, y: 0 }, { hp: 40, armor: 6, shield: 10 })];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };
    combat.ship.rotation = 0;
    combat.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, fireCommand());

    expect(combat.enemies).toHaveLength(1);
    expect(combat.enemies[0]).toMatchObject({
      shield: 0,
      hp: 36
    });
    expect(world.lastMilestone).toBe("Direct Hit");
  });

  it("fires limited player homing missiles with a target lock", () => {
    const world = createWorldFromSystem(starterSystem, "player-missile-seed");
    const combat = combatWorld(world);
    combat.enemies = [testEnemy("locked-interceptor-a", { x: 260, y: 0 })];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };
    combat.ship.rotation = 0;
    combat.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, [{ type: "MISSILE" } as PlayerCommand]);

    expect(combat.ship.missileAmmo).toBe(2);
    expect(combat.playerProjectiles).toHaveLength(1);
    expect(combat.playerProjectiles[0]).toMatchObject({
      kind: "missile",
      targetId: "locked-interceptor-a",
      damage: 54
    });
  });

  it("lets enemy ships spend limited homing missiles under combat pressure", () => {
    const world = createWorldFromSystem(starterSystem, "enemy-missile-seed");
    const combat = combatWorld(world);
    combat.enemies = [
      {
        ...testEnemy("missile-fighter-a", { x: 260, y: 0 }),
        missileAmmo: 1,
        missileCooldownSeconds: 0
      }
    ];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };

    stepWorld(world, 1 / 60, [], {
      enemyDirectorDirective: {
        formation: "screen",
        missileDoctrine: "single",
        tempo: "spike",
        pressure: 0.6
      }
    });

    expect(combat.enemies[0].missileAmmo).toBe(0);
    expect(combat.enemyProjectiles.some((projectile) => projectile.kind === "missile" && projectile.targetId === "player")).toBe(true);
  });

  it("lets calm director tempo hold single enemy missiles for fair recovery windows", () => {
    const world = createWorldFromSystem(starterSystem, "enemy-calm-missile-seed");
    const combat = combatWorld(world);
    combat.enemies = [
      {
        ...testEnemy("calm-missile-fighter-a", { x: 260, y: 0 }),
        missileAmmo: 1,
        missileCooldownSeconds: 0
      }
    ];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };

    stepWorld(world, 1 / 60, [], {
      enemyDirectorDirective: {
        formation: "screen",
        missileDoctrine: "single",
        tempo: "calm",
        pressure: 0.9
      }
    });

    expect(combat.enemies[0].missileAmmo).toBe(1);
    expect(combat.enemyProjectiles.some((projectile) => projectile.kind === "missile")).toBe(false);
  });

  it("allows regular shots to intercept homing missiles", () => {
    const world = createWorldFromSystem(starterSystem, "missile-intercept-seed");
    const combat = combatWorld(world);
    combat.enemies = [];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };
    combat.playerProjectiles = [
      {
        id: "player-shot-intercept",
        owner: "player",
        kind: "bolt",
        position: { x: 150, y: 0 },
        velocity: { x: 0, y: 0 },
        radius: 4,
        damage: 20,
        ageSeconds: 0,
        maxAgeSeconds: 1
      }
    ];
    combat.enemyProjectiles = [
      {
        id: "enemy-missile-a",
        owner: "enemy",
        kind: "missile",
        targetId: "player",
        position: { x: 152, y: 0 },
        velocity: { x: 0, y: 0 },
        radius: 6,
        damage: 42,
        ageSeconds: 0,
        maxAgeSeconds: 4
      }
    ];

    stepWorld(world, 1 / 60, []);

    expect(combat.playerProjectiles).toHaveLength(0);
    expect(combat.enemyProjectiles).toHaveLength(0);
    expect(world.lastMilestone).toBe("Missile Down");
  });

  it("multiplies an interceptor finish after a direct-hit chain starter", () => {
    const world = createWorldFromSystem(starterSystem, "direct-hit-chain-seed");
    const combat = combatWorld(world);
    combat.enemies = [testEnemy("interceptor-a", { x: 154, y: 0 }, { hp: 40 })];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };
    combat.ship.rotation = 0;
    combat.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, fireCommand());
    combat.ship.weaponCooldownSeconds = 0;
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };
    combat.ship.rotation = 0;
    combat.ship.targetRotation = 0;
    combat.enemies[0].position = { x: 154, y: 0 };
    combat.enemies[0].velocity = { x: 0, y: 0 };

    stepWorld(world, 1 / 60, fireCommand());

    expect(combat.enemies).toHaveLength(0);
    expect(world.lastMilestone).toBe("Interceptor Down");
    expect(world.lastStyleAward).toBe(113);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(148);
    expect(snapshotWorld(world).styleMultiplier).toBe(1.5);
  });

  it("lets enemy shots damage the player and crash the run at zero HP", () => {
    const world = createWorldFromSystem(starterSystem, "enemy-shot-seed");
    const combat = combatWorld(world);
    combat.enemies = [];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };
    combat.ship.hp = 12;
    combat.enemyProjectiles = [
      {
        id: "enemy-shot-a",
        owner: "enemy",
        kind: "bolt",
        position: { x: 120, y: 0 },
        velocity: { x: 0, y: 0 },
        radius: 5,
        damage: 18,
        ageSeconds: 0,
        maxAgeSeconds: 1
      }
    ];

    stepWorld(world, 1 / 60, []);

    expect(combat.ship.hp).toBe(0);
    expect(world.status).toBe("crashed");
    expect(world.crashReason).toBe("Hull Collision");
  });

  it("keeps the first seconds focused on launch instead of immediate interceptor damage", () => {
    const world = createWorldFromSystem(starterSystem, "gentle-combat-seed");

    for (let tick = 0; tick < 180; tick += 1) {
      stepWorld(world, 1 / 60, []);
    }

    expect(combatWorld(world).ship.hp).toBe(100);
    expect(combatWorld(world).enemyProjectiles).toHaveLength(0);
  });

  it("keeps interceptors from pushing through the courier hull while chasing", () => {
    const world = createWorldFromSystem(starterSystem, "interceptor-avoidance-seed");
    const combat = combatWorld(world);
    combat.gravitySources = [];
    combat.landingPads = [];
    combat.enemies = [testEnemy("interceptor-a", { x: 190, y: 0 })];
    combat.enemies[0].velocity = { x: -26, y: 0 };
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };

    let closestDistance = Number.POSITIVE_INFINITY;
    for (let tick = 0; tick < 180; tick += 1) {
      stepWorld(world, 1 / 60, []);
      closestDistance = Math.min(closestDistance, distanceBetweenTest(combat.enemies[0].position, combat.ship.position));
    }

    expect(closestDistance).toBeGreaterThanOrEqual(combat.enemies[0].radius + 10);
    expect(combat.ship.hp).toBe(100);
  });

  it("damages both ships and separates them on interceptor hull contact", () => {
    const world = createWorldFromSystem(starterSystem, "interceptor-contact-seed");
    const combat = combatWorld(world);
    combat.gravitySources = [];
    combat.landingPads = [];
    combat.enemies = [testEnemy("interceptor-a", { x: 120, y: 0 })];
    combat.ship.position = { x: 120, y: 0 };
    combat.ship.velocity = { x: 0, y: 0 };

    stepWorld(world, 1 / 60, []);

    expect(combat.ship.hp).toBeLessThan(100);
    expect(combat.enemies[0].hp).toBeLessThan(40);
    expect(distanceBetweenTest(combat.enemies[0].position, combat.ship.position)).toBeGreaterThanOrEqual(combat.enemies[0].radius + 10);
  });

  it("can start worlds and replays from a selected contract", () => {
    const systemWithChoice: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "return-leg",
          title: "Return Leg",
          briefing: "Reverse the route under tighter timing.",
          riskLabel: "Tight Timer",
          rewardLabel: "Gold pace pressure",
          shipStart: {
            position: [200, -80],
            velocity: [0, 0],
            rotation: 0
          },
          pickupId: "dock-a",
          destinationId: "north-pad",
          cargoId: "bottled-starlight",
          medalTimes: {
            bronze: 80,
            silver: 48,
            gold: 30
          }
        }
      ]
    };
    const world = createWorldFromSystem(systemWithChoice, "contract-seed", { contractId: "return-leg" });
    const replay = createWorldReplay({
      system: systemWithChoice,
      seed: "contract-seed",
      commandBuffer: createCommandBuffer([]),
      ticks: 1,
      contractId: "return-leg"
    }).replay;

    expect(world.contractId).toBe("return-leg");
    expect(world.activeContract.title).toBe("Return Leg");
    expect(world.ship.position).toEqual({ x: 200, y: -80 });
    expect(world.ship.velocity).toEqual({ x: 0, y: 0 });
    expect(world.ship.rotation).toBe(0);
    expect(snapshotWorld(world).objectiveTarget).toMatchObject({
      id: "dock-a",
      role: "pickup",
      distance: 60
    });
    expect(replay.contractId).toBe("return-leg");
  });

  it("rejects unknown selected contracts", () => {
    expect(() => createWorldFromSystem(starterSystem, "missing-contract-seed", { contractId: "missing-contract" })).toThrow(
      'System "test-route" does not define contract "missing-contract"'
    );
  });

  it("loads cargo on the pickup pad and completes on the destination pad", () => {
    const soft = createWorldFromSystem(starterSystem, "dock-seed");
    soft.ship.position = { x: 0, y: -74 };
    soft.ship.velocity = { x: 1, y: 3 };
    soft.ship.rotation = -Math.PI / 2;
    stepWorld(soft, 1 / 60, []);

    expect(soft.status).toBe("flying");
    expect(soft.objectivePhase).toBe("delivery");
    expect(soft.cargoOnboard).toBe(true);
    expect(soft.lastMilestone).toBe("Quick Pickup");

    soft.ship.position = { x: 260, y: -80 };
    soft.ship.velocity = { x: 4, y: 1 };
    soft.ship.rotation = 0;
    stepWorld(soft, 1 / 60, []);

    const harsh = createWorldFromSystem(starterSystem, "dock-seed");
    harsh.ship.position = { x: 260, y: -80 };
    harsh.ship.velocity = { x: 60, y: 0 };
    harsh.ship.rotation = Math.PI;
    stepWorld(harsh, 1 / 60, []);

    expect(soft.status).toBe("delivered");
    expect(soft.landingRating).toBe("Perfect Landing");
    expect(harsh.status).toBe("crashed");
    expect(harsh.landingRating).toBe("Insurance Event");
  });

  it("counts rough active target arrivals as deliveries instead of false crashes", () => {
    const world = createWorldFromSystem(starterSystem, "rough-target-arrival-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 52, y: 0 };
    world.ship.rotation = 0;

    expect(snapshotWorld(world).objectiveTarget).toMatchObject({
      id: "dock-a",
      landingStatus: "too-fast"
    });

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Spicy Landing");
    expect(world.crashReason).toBeUndefined();
    expect(world.ship.cargoDamage).toBeGreaterThan(0);
  });

  it("captures controlled arrivals across the full visible active dock halo", () => {
    const world = createWorldFromSystem(starterSystem, "wide-visible-target-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 205, y: -80 };
    world.ship.velocity = { x: 8, y: 0 };
    world.ship.rotation = 0;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "dock-a",
      landingStatus: "ready"
    });
    expect(target?.distance).toBeGreaterThan(22 * 1.7);
    expect(target?.distance).toBeLessThan(22 * 3);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Perfect Landing");
    expect(world.crashReason).toBeUndefined();
  });

  it("counts slow settled arrivals inside the visible active dock halo as docking", () => {
    const world = createWorldFromSystem(starterSystem, "settled-target-arrival-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 208, y: -80 };
    world.ship.velocity = { x: 0.25, y: 0 };
    world.ship.rotation = 0;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "dock-a",
      landingStatus: "ready"
    });
    expect(target?.distance).toBeGreaterThan(22 * 1.7);
    expect(target?.distance).toBeLessThan(22 * 2.6);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Perfect Landing");
    expect(world.crashReason).toBeUndefined();
  });

  it("counts rough arrivals inside the visible active dock halo as deliveries", () => {
    const world = createWorldFromSystem(starterSystem, "rough-visible-halo-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 205, y: -80 };
    world.ship.velocity = { x: 46, y: 0 };
    world.ship.rotation = Math.PI;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "dock-a",
      landingStatus: "too-fast"
    });
    expect(target?.distance).toBeGreaterThan(22 * 1.7);
    expect(target?.distance).toBeLessThanOrEqual(22 * 3.5);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.objectivePhase).toBe("complete");
    expect(world.landingRating).toBe("Spicy Landing");
    expect(world.crashReason).toBeUndefined();
    expect(world.ship.cargoDamage).toBeGreaterThan(0);
  });

  it("counts dock-ready lateral arrivals inside the visible active dock halo as deliveries", () => {
    const world = createWorldFromSystem(starterSystem, "ready-lateral-halo-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 205, y: -80 };
    world.ship.velocity = { x: 0, y: 30 };
    world.ship.rotation = 0;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "dock-a",
      landingStatus: "ready"
    });
    expect(target?.distance).toBeGreaterThan(22 * 1.7);
    expect(target?.distance).toBeLessThan(22 * 3);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.objectivePhase).toBe("complete");
    expect(world.landingRating).toBe("Spicy Landing");
    expect(world.crashReason).toBeUndefined();
  });

  it("keeps very hard active target contacts as rough completions instead of hidden failures", () => {
    const world = createWorldFromSystem(starterSystem, "hard-target-contact-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 82, y: 0 };
    world.ship.rotation = Math.PI;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.objectivePhase).toBe("complete");
    expect(world.landingRating).toBe("Cargo Survived Somehow");
    expect(world.crashReason).toBeUndefined();
    expect(world.ship.cargoDamage).toBeLessThan(1);
  });

  it("counts near active planet-pad arrivals as pickups instead of hull collisions", () => {
    const world = createWorldFromSystem(starterSystem, "near-planet-pad-seed");
    world.ship.position = { x: 30, y: -56 };
    world.ship.velocity = { x: 45, y: 0 };
    world.ship.rotation = -Math.PI / 2;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("flying");
    expect(world.objectivePhase).toBe("delivery");
    expect(world.cargoOnboard).toBe(true);
    expect(world.crashReason).toBeUndefined();
    expect(world.ship.cargoDamage).toBeGreaterThan(0);
  });

  it("forgives safe close active planet-pad approaches before reporting hull collisions", () => {
    const world = createWorldFromSystem(starterSystem, "wide-planet-pad-seed");
    world.ship.position = { x: 40, y: -45 };
    world.ship.velocity = { x: 20, y: 11 };
    world.ship.rotation = -Math.PI / 2;

    expect(snapshotWorld(world).objectiveTarget).toMatchObject({
      id: "north-pad",
      landingStatus: "ready"
    });
    expect(snapshotWorld(world).objectiveTarget?.distance).toBeGreaterThan(18 * 2.25);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("flying");
    expect(world.objectivePhase).toBe("delivery");
    expect(world.cargoOnboard).toBe(true);
    expect(world.crashReason).toBeUndefined();
  });

  it("loads controlled pickup approaches across the visible active pad halo", () => {
    const world = createWorldFromSystem(starterSystem, "wide-pickup-halo-seed");
    world.ship.position = { x: 50, y: -74 };
    world.ship.velocity = { x: -20, y: 0 };
    world.ship.rotation = -Math.PI / 2;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "north-pad",
      landingStatus: "ready"
    });
    expect(target?.distance).toBeGreaterThan(18 * 1.7);
    expect(target?.distance).toBeLessThanOrEqual(18 * 3);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("flying");
    expect(world.objectivePhase).toBe("delivery");
    expect(world.cargoOnboard).toBe(true);
    expect(world.crashReason).toBeUndefined();
  });

  it("loads slow side-on planet-pad arrivals inside the visible target halo", () => {
    const world = createWorldFromSystem(starterSystem, "side-on-visible-halo-seed");
    world.ship.position = { x: 50, y: -74 };
    world.ship.velocity = { x: 0, y: 23 };
    world.ship.rotation = 0;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "north-pad",
      landingStatus: "ready"
    });
    expect(target?.distance).toBeGreaterThan(18 * 1.7);
    expect(target?.distance).toBeLessThanOrEqual(18 * 3);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("flying");
    expect(world.objectivePhase).toBe("delivery");
    expect(world.cargoOnboard).toBe(true);
    expect(world.crashReason).toBeUndefined();
  });

  it("delivers controlled planet-pad arrivals at the visible active halo", () => {
    const world = createWorldFromSystem(starterSystem, "planet-pad-visible-halo-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.role = pad.id === "north-pad" ? "destination" : "neutral";
      pad.active = pad.id === "north-pad";
      pad.destination = pad.id === "north-pad";
    }
    world.ship.position = { x: 50, y: -74 };
    world.ship.velocity = { x: -4, y: 0 };
    world.ship.rotation = -Math.PI / 2;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "north-pad",
      landingStatus: "ready"
    });
    expect(target?.distance).toBeGreaterThan(18 * 1.7);
    expect(target?.distance).toBeLessThanOrEqual(18 * 3);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.objectivePhase).toBe("complete");
    expect(world.cargoOnboard).toBe(true);
    expect(world.crashReason).toBeUndefined();
  });

  it("reports objective telemetry for pickup and delivery guidance", () => {
    const world = createWorldFromSystem(starterSystem, "guide-seed");
    let snapshot = snapshotWorld(world);

    expect(snapshot.objectiveTarget).toMatchObject({
      id: "north-pad",
      role: "pickup",
      landingStatus: "approach",
      allowedApproachSpeed: 42
    });
    expect(snapshot.objectiveTarget?.distance).toBeCloseTo(140.96, 1);

    world.ship.position = { x: 0, y: -74 };
    world.ship.velocity = { x: 1, y: 3 };
    world.ship.rotation = -Math.PI / 2;
    stepWorld(world, 1 / 60, []);
    snapshot = snapshotWorld(world);

    expect(snapshot.objectivePhase).toBe("delivery");
    expect(snapshot.objectiveTarget).toMatchObject({
      id: "dock-a",
      role: "destination",
      landingStatus: "approach",
      allowedApproachSpeed: 38
    });
  });

  it("reports nearby hazard pressure without warning across the whole map", () => {
    const systemWithHazard: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "test-asteroids",
          type: "asteroid_field",
          position: [200, -80],
          radius: 30,
          severity: 0.4
        }
      ]
    };
    const world = createWorldFromSystem(systemWithHazard, "hazard-seed");

    world.ship.position = { x: 245, y: -80 };
    expect(snapshotWorld(world).nearestHazard).toMatchObject({
      id: "test-asteroids",
      dangerLevel: "near",
      distance: 45
    });

    world.ship.position = { x: 210, y: -80 };
    expect(snapshotWorld(world).nearestHazard).toMatchObject({
      id: "test-asteroids",
      dangerLevel: "inside",
      distance: 10
    });

    world.ship.position = { x: 320, y: -80 };
    expect(snapshotWorld(world).nearestHazard).toBeUndefined();
  });

  it("awards a one-time style bonus for clean hazard skims", () => {
    const systemWithHazard: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "skim-field",
          type: "asteroid_field",
          position: [180, -180],
          radius: 40,
          severity: 0.5
        }
      ]
    };
    const world = createWorldFromSystem(systemWithHazard, "skim-seed");
    world.ship.position = { x: 233, y: -180 };
    world.ship.velocity = { x: 0, y: 0 };

    stepWorld(world, 1 / 60, []);
    const firstBreakdown = summarizeRun(world).scoreBreakdown;

    expect(world.lastMilestone).toBe("Clean Hazard Skim");
    expect(firstBreakdown.styleBonus).toBeGreaterThan(0);
    expect(world.ship.cargoDamage).toBe(0);

    stepWorld(world, 1 / 60, []);
    const secondBreakdown = summarizeRun(world).scoreBreakdown;

    expect(secondBreakdown.styleBonus).toBe(firstBreakdown.styleBonus);
  });

  it("upgrades clean high-speed hazard skims into needle thread style hits", () => {
    const systemWithHazard: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "thread-field",
          type: "asteroid_field",
          position: [180, -180],
          radius: 40,
          severity: 0.75
        }
      ]
    };
    const world = createWorldFromSystem(systemWithHazard, "needle-thread-seed");
    world.ship.position = { x: 233, y: -180 };
    world.ship.velocity = { x: 46, y: 0 };

    stepWorld(world, 1 / 60, []);

    const threadBonus = calculateHazardThreadStyleBonus(0.75);
    expect(world.lastMilestone).toBe("Needle Thread");
    expect(world.lastStyleAward).toBe(threadBonus);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(threadBonus);
    expect(world.ship.cargoDamage).toBe(0);
  });

  it("chains style rewards into a short multiplier window", () => {
    const systemWithHazard: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "chain-field",
          type: "asteroid_field",
          position: [180, -180],
          radius: 40,
          severity: 0.5
        }
      ]
    };
    const world = createWorldFromSystem(systemWithHazard, "style-chain-seed");
    world.ship.position = { x: 233, y: -180 };
    world.ship.velocity = { x: 0, y: 0 };

    stepWorld(world, 1 / 60, []);

    const skimBonus = calculateHazardSkimStyleBonus(0.5);
    expect(world.lastMilestone).toBe("Clean Hazard Skim");
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(skimBonus);
    expect(snapshotWorld(world)).toMatchObject({
      styleChainCount: 1,
      styleMultiplier: 1.25,
      styleChainSecondsRemaining: STYLE_CHAIN_WINDOW_SECONDS
    });

    world.ship.position = { x: 0, y: -74 };
    world.ship.velocity = { x: 1, y: 3 };
    world.ship.rotation = -Math.PI / 2;
    stepWorld(world, 1 / 60, []);

    expect(world.lastMilestone).toBe("Quick Pickup");
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(skimBonus + Math.round(QUICK_PICKUP_STYLE_BONUS * 1.25));
    expect(snapshotWorld(world)).toMatchObject({
      styleChainCount: 2,
      styleMultiplier: 1.5,
      styleChainSecondsRemaining: STYLE_CHAIN_WINDOW_SECONDS
    });
  });

  it("extends style chain timing for chain relay contracts", () => {
    const systemWithHazard: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "chain-relay-field",
          type: "asteroid_field",
          position: [180, -180],
          radius: 40,
          severity: 0.5
        }
      ],
      contracts: [
        ...starterSystem.contracts,
        {
          ...starterSystem.contracts[0]!,
          id: "chain-relay",
          title: "Chain Relay"
        }
      ]
    };
    const world = createWorldFromSystem(systemWithHazard, "chain-relay-window-seed", { contractId: "chain-relay" });
    world.ship.position = { x: 233, y: -180 };
    world.ship.velocity = { x: 0, y: 0 };

    stepWorld(world, 1 / 60, []);

    expect(world.lastMilestone).toBe("Clean Hazard Skim");
    expect(snapshotWorld(world)).toMatchObject({
      styleChainCount: 1,
      styleMultiplier: 1.25,
      styleChainSecondsRemaining: CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS
    });
  });

  it("awards a one-time launch burst for boosting out of a fresh pickup", () => {
    const world = createWorldFromSystem(starterSystem, "launch-burst-seed");
    world.ship.position = { x: 0, y: -74 };
    world.ship.velocity = { x: 1, y: 3 };
    world.ship.rotation = -Math.PI / 2;

    stepWorld(world, 1 / 60, []);

    expect(world.lastMilestone).toBe("Quick Pickup");
    expect((snapshotWorld(world) as { launchBurstSecondsRemaining?: number }).launchBurstSecondsRemaining).toBe(3);

    stepWorld(world, 1 / 60, [{ type: "BOOST" }]);

    expect(world.lastMilestone).toBe("Launch Burst");
    expect(world.lastStyleAward).toBe(150);
    expect((snapshotWorld(world) as { launchBurstSecondsRemaining?: number }).launchBurstSecondsRemaining).toBe(0);
    expect(snapshotWorld(world)).toMatchObject({
      styleChainCount: 2,
      styleMultiplier: 1.5,
      styleChainSecondsRemaining: STYLE_CHAIN_WINDOW_SECONDS
    });
    expect(-world.ship.velocity.y).toBeGreaterThan(20);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(QUICK_PICKUP_STYLE_BONUS + 150);

    world.ship.position = { x: 500, y: -500 };
    world.ship.velocity = { x: 0, y: 0 };
    world.ship.rotation = 0;

    for (let tick = 0; tick < Math.ceil(BOOST_COOLDOWN_SECONDS / (1 / 60)) + 2; tick += 1) {
      stepWorld(world, 1 / 60, []);
    }
    expect(world.status).toBe("flying");
    expect(world.ship.boostCooldownSeconds).toBe(0);

    stepWorld(world, 1 / 60, [{ type: "BOOST" }]);

    expect(world.lastMilestone).toBe("Boost Burn");
    expect(world.lastStyleAward).toBeUndefined();
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(QUICK_PICKUP_STYLE_BONUS + 150);
  });

  it("expires the style chain when the player stops landing tricks", () => {
    const systemWithHazard: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "chain-field",
          type: "asteroid_field",
          position: [180, -180],
          radius: 40,
          severity: 0.5
        }
      ]
    };
    const world = createWorldFromSystem(systemWithHazard, "style-chain-expire-seed");
    world.ship.position = { x: 233, y: -180 };
    world.ship.velocity = { x: 0, y: 0 };

    stepWorld(world, 1 / 60, []);
    for (let tick = 0; tick < Math.ceil(STYLE_CHAIN_WINDOW_SECONDS / (1 / 60)); tick += 1) {
      stepWorld(world, 1 / 60, []);
    }

    expect(snapshotWorld(world)).toMatchObject({
      styleChainCount: 0,
      styleMultiplier: 1,
      styleChainSecondsRemaining: 0
    });
  });

  it("awards eco drift style for clean low-burn deliveries", () => {
    const world = createWorldFromSystem(starterSystem, "eco-drift-seed");
    world.ship.position = { x: 0, y: -74 };
    world.ship.velocity = { x: 1, y: 3 };
    world.ship.rotation = -Math.PI / 2;
    stepWorld(world, 1 / 60, []);
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;
    world.elapsedSeconds = starterSystem.contracts[0]!.medalTimes.gold + 1;
    world.fuelUsed = ECO_DRIFT_FUEL_USED_LIMIT - 0.5;
    stepWorld(world, 1 / 60, []);

    const result = summarizeRun(world);

    expect(world.lastMilestone).toBe("Eco Drift");
    expect(result.scoreBreakdown.styleBonus).toBe(QUICK_PICKUP_STYLE_BONUS + Math.round(ECO_DRIFT_STYLE_BONUS * 1.25));
  });

  it("awards a chain finish when a clean delivery preserves an active style chain", () => {
    const world = createWorldFromSystem(starterSystem, "chain-finish-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.styleBonus = 320;
    world.styleChainCount = 2;
    world.styleChainSecondsRemaining = 2.4;
    world.fuelUsed = world.ship.maxFuel * 0.4;
    world.bestApproachStreakSeconds = 0;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 8, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.lastMilestone).toBe("Chain Finish");
    expect(world.lastStyleAward).toBe(Math.round(CHAIN_FINISH_STYLE_BONUS * 1.5));
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(320 + Math.round(CHAIN_FINISH_STYLE_BONUS * 1.5));
  });

  it("awards comet finish style when a perfect gold delivery keeps cargo and fuel reserve intact", () => {
    const world = createWorldFromSystem(starterSystem, "comet-finish-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.elapsedSeconds = starterSystem.contracts[0]!.medalTimes.gold - 0.5;
    world.fuelUsed = world.ship.maxFuel * 0.2;
    world.bestApproachStreakSeconds = 0;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(summarizeRun(world).medal).toBe("comet");
    expect(world.lastMilestone).toBe("Comet Finish");
    expect(world.lastStyleAward).toBe(COMET_FINISH_STYLE_BONUS);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(COMET_FINISH_STYLE_BONUS);
  });

  it("prioritizes chain finish over perfect approach when both finish conditions are met", () => {
    const world = createWorldFromSystem(starterSystem, "chain-perfect-finish-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.styleBonus = 320;
    world.styleChainCount = 2;
    world.styleChainSecondsRemaining = 2.4;
    world.fuelUsed = world.ship.maxFuel * 0.4;
    world.bestApproachStreakSeconds = 1.2;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Perfect Landing");
    expect(world.lastMilestone).toBe("Chain Finish");
    expect(world.lastStyleAward).toBe(Math.round(CHAIN_FINISH_STYLE_BONUS * 1.5));
  });

  it("prioritizes express finish over eco drift while the clean delivery is still on gold pace", () => {
    const world = createWorldFromSystem(starterSystem, "express-over-eco-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.elapsedSeconds = starterSystem.contracts[0]!.medalTimes.gold - 0.5;
    world.fuelUsed = ECO_DRIFT_FUEL_USED_LIMIT - 0.5;
    world.bestApproachStreakSeconds = 0;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 20, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.lastMilestone).toBe("Express Finish");
    expect(world.lastStyleAward).toBe(EXPRESS_FINISH_STYLE_BONUS);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(EXPRESS_FINISH_STYLE_BONUS);
  });

  it("awards express finish style for clean deliveries inside the gold window", () => {
    const world = createWorldFromSystem(starterSystem, "express-finish-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.elapsedSeconds = starterSystem.contracts[0]!.medalTimes.gold - 0.5;
    world.styleBonus = QUICK_PICKUP_STYLE_BONUS;
    world.styleChainCount = 1;
    world.styleChainSecondsRemaining = 2.4;
    world.fuelUsed = ECO_DRIFT_FUEL_USED_LIMIT + 4;
    world.bestApproachStreakSeconds = 0;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 20, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.lastMilestone).toBe("Express Finish");
    expect(world.lastStyleAward).toBe(225);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(QUICK_PICKUP_STYLE_BONUS + 225);
  });

  it("awards damage control style for salvaging a damaged cargo delivery", () => {
    const world = createWorldFromSystem(starterSystem, "damage-control-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.ship.cargoDamage = 0.18;
    world.elapsedSeconds = starterSystem.contracts[0]!.medalTimes.gold + 1;
    world.fuelUsed = ECO_DRIFT_FUEL_USED_LIMIT + 4;
    world.bestApproachStreakSeconds = 0;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Spicy Landing");
    expect(world.lastMilestone).toBe("Damage Control");
    expect(world.lastStyleAward).toBe(DAMAGE_CONTROL_STYLE_BONUS);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(DAMAGE_CONTROL_STYLE_BONUS);
  });

  it("awards last drop style for clean deliveries on critical fuel", () => {
    const world = createWorldFromSystem(starterSystem, "last-drop-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.ship.fuel = 4;
    world.fuelUsed = world.ship.maxFuel - world.ship.fuel;
    world.elapsedSeconds = starterSystem.contracts[0]!.medalTimes.gold + 1;
    world.bestApproachStreakSeconds = 0;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.lastMilestone).toBe("Last Drop");
    expect(world.lastStyleAward).toBe(LAST_DROP_STYLE_BONUS);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(LAST_DROP_STYLE_BONUS);
  });

  it("awards no-brake finesse for clean deliveries without manual braking", () => {
    const world = createWorldFromSystem(starterSystem, "no-brake-finesse-seed");
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.elapsedSeconds = starterSystem.contracts[0]!.medalTimes.gold + 1;
    world.fuelUsed = ECO_DRIFT_FUEL_USED_LIMIT + 4;
    world.bestApproachStreakSeconds = 0;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.lastMilestone).toBe("No Brake Finesse");
    expect(world.lastStyleAward).toBe(NO_BRAKE_STYLE_BONUS);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(NO_BRAKE_STYLE_BONUS);
  });

  it("awards antimatter drift style for clean no-brake antimatter deliveries", () => {
    const systemWithAntimatter: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          ...starterSystem.contracts[0]!,
          id: "antimatter-drift",
          title: "Antimatter Drift",
          cargoId: "unstable-antimatter-vial",
          medalTimes: {
            bronze: 78,
            silver: 46,
            gold: 28
          }
        }
      ],
      cargo: [
        ...starterSystem.cargo,
        {
          id: "unstable-antimatter-vial",
          name: "Unstable Antimatter Vial",
          kind: "unstable",
          fragility: 0.95
        }
      ]
    };
    const world = createWorldFromSystem(systemWithAntimatter, "antimatter-drift-style-seed", { contractId: "antimatter-drift" });
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.elapsedSeconds = world.activeContract.medalTimes.gold + 1;
    world.fuelUsed = ECO_DRIFT_FUEL_USED_LIMIT + 4;
    world.bestApproachStreakSeconds = 0;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.lastMilestone).toBe("Antimatter Drift");
    expect(world.lastStyleAward).toBe(210);
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(210);
  });

  it("does not award no-brake finesse after any manual brake command", () => {
    const world = createWorldFromSystem(starterSystem, "manual-brake-finesse-seed");
    stepWorld(world, 1 / 60, [{ type: "BRAKE", amount: 1 }]);
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    world.elapsedSeconds = starterSystem.contracts[0]!.medalTimes.gold + 1;
    world.fuelUsed = ECO_DRIFT_FUEL_USED_LIMIT + 4;
    world.bestApproachStreakSeconds = 0;
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.lastMilestone).toBe("Delivered");
    expect(summarizeRun(world).scoreBreakdown.styleBonus).toBe(0);
  });

  it("exposes manual brake usage for live finesse guidance", () => {
    const world = createWorldFromSystem(starterSystem, "manual-brake-snapshot-seed");

    expect(snapshotWorld(world).manualBrakeUsed).toBe(false);

    stepWorld(world, 1 / 60, [{ type: "BRAKE", amount: 0.4 }]);

    expect(snapshotWorld(world).manualBrakeUsed).toBe(true);
  });

  it("adds handling stress to unstable cargo when braking under load", () => {
    const systemWithBrakeSensitiveCargo: SystemContent = {
      ...starterSystem,
      contracts: [
        {
          ...starterSystem.contracts[0],
          id: "stable-run",
          cargoId: "bottled-starlight"
        },
        {
          ...starterSystem.contracts[0],
          id: "unstable-run",
          cargoId: "volatile-comet-ice"
        },
        {
          ...starterSystem.contracts[0],
          id: "fragile-unstable-run",
          cargoId: "volatile-antimatter-vial"
        }
      ],
      cargo: [
        ...starterSystem.cargo,
        {
          id: "volatile-comet-ice",
          name: "Volatile Comet Ice",
          kind: "unstable",
          fragility: 1
        },
        {
          id: "volatile-antimatter-vial",
          name: "Volatile Antimatter Vial",
          kind: "unstable",
          fragility: 1.5
        }
      ]
    };
    const stable = createWorldFromSystem(systemWithBrakeSensitiveCargo, "brake-sensitive-cargo-seed", { contractId: "stable-run" });
    const unstable = createWorldFromSystem(systemWithBrakeSensitiveCargo, "brake-sensitive-cargo-seed", { contractId: "unstable-run" });
    const fragileUnstable = createWorldFromSystem(systemWithBrakeSensitiveCargo, "brake-sensitive-cargo-seed", {
      contractId: "fragile-unstable-run"
    });
    for (const world of [stable, unstable, fragileUnstable]) {
      world.cargoOnboard = true;
      world.objectivePhase = "delivery";
      world.ship.position = { x: 500, y: 500 };
      world.ship.velocity = { x: 10, y: 0 };
    }

    stepWorld(stable, 1, [{ type: "BRAKE", amount: 1 }]);
    stepWorld(unstable, 1, [{ type: "BRAKE", amount: 1 }]);
    stepWorld(fragileUnstable, 1, [{ type: "BRAKE", amount: 1 }]);

    expect(stable.ship.cargoDamage).toBe(0);
    expect(unstable.ship.cargoDamage).toBeCloseTo(0.012, 3);
    expect(fragileUnstable.ship.cargoDamage).toBeCloseTo(0.018, 3);
  });

  it("scales hazard contact damage by active cargo fragility", () => {
    const systemWithCargoRisk: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "contact-field",
          type: "asteroid_field",
          position: [120, 0],
          radius: 50,
          severity: 0.7
        }
      ],
      contracts: [
        {
          ...starterSystem.contracts[0],
          id: "fragile-run",
          cargoId: "bottled-starlight"
        },
        {
          ...starterSystem.contracts[0],
          id: "volatile-run",
          cargoId: "volatile-comet-ice"
        }
      ],
      cargo: [
        ...starterSystem.cargo,
        {
          id: "volatile-comet-ice",
          name: "Volatile Comet Ice",
          kind: "unstable",
          fragility: 1
        }
      ]
    };
    const fragile = createWorldFromSystem(systemWithCargoRisk, "cargo-risk-seed", { contractId: "fragile-run" });
    const volatile = createWorldFromSystem(systemWithCargoRisk, "cargo-risk-seed", { contractId: "volatile-run" });

    stepWorld(fragile, 1 / 60, []);
    stepWorld(volatile, 1 / 60, []);

    expect(fragile.ship.cargoDamage).toBeGreaterThan(0);
    expect(volatile.ship.cargoDamage).toBeGreaterThan(fragile.ship.cargoDamage);
  });

  it("scales hazard severity by the selected contract risk modifier", () => {
    const systemWithContractRisk: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "contract-field",
          type: "asteroid_field",
          position: [120, 0],
          radius: 50,
          severity: 0.4
        }
      ],
      contracts: [
        {
          ...starterSystem.contracts[0],
          id: "training-run"
        },
        {
          ...starterSystem.contracts[0],
          id: "sprint-run",
          hazardSeverityMultiplier: 1.5
        }
      ]
    };
    const training = createWorldFromSystem(systemWithContractRisk, "contract-risk-seed", { contractId: "training-run" });
    const sprint = createWorldFromSystem(systemWithContractRisk, "contract-risk-seed", { contractId: "sprint-run" });

    stepWorld(training, 1 / 60, []);
    stepWorld(sprint, 1 / 60, []);

    expect(training.hazards[0]?.severity).toBe(0.4);
    expect(sprint.hazards[0]?.severity).toBe(0.6);
    expect(sprint.ship.cargoDamage).toBeGreaterThan(training.ship.cargoDamage);
  });

  it("applies deterministic daily hazard variance without changing ordinary seeds", () => {
    const systemWithDailyHazard: SystemContent = {
      ...starterSystem,
      hazards: [
        {
          id: "daily-field",
          type: "asteroid_field",
          position: [120, 0],
          radius: 50,
          severity: 0.4
        }
      ]
    };

    const ordinary = createWorldFromSystem(systemWithDailyHazard, "contract-risk-seed");
    const daily = createWorldFromSystem(systemWithDailyHazard, "daily-2026-06-13-first-light-delivery");
    const dailyAgain = createWorldFromSystem(systemWithDailyHazard, "daily-2026-06-13-first-light-delivery");
    const nextDaily = createWorldFromSystem(systemWithDailyHazard, "daily-2026-06-14-first-light-delivery");

    expect(ordinary.hazards[0]?.severity).toBe(0.4);
    expect(daily.hazards[0]?.severity).toBe(dailyAgain.hazards[0]?.severity);
    expect(daily.hazards[0]?.severity).not.toBe(ordinary.hazards[0]?.severity);
    expect(nextDaily.hazards[0]?.severity).not.toBe(daily.hazards[0]?.severity);
    expect(daily.hazards[0]?.severity).toBeGreaterThanOrEqual(0.36);
    expect(daily.hazards[0]?.severity).toBeLessThanOrEqual(0.44);
  });

  it("awards a one-time style bonus for quick cargo pickup", () => {
    const quick = createWorldFromSystem(starterSystem, "quick-pickup-seed");
    quick.elapsedSeconds = 8;
    quick.ship.position = { x: 0, y: -74 };
    quick.ship.velocity = { x: 1, y: 3 };
    quick.ship.rotation = -Math.PI / 2;

    stepWorld(quick, 1 / 60, []);
    const quickBreakdown = summarizeRun(quick).scoreBreakdown;

    expect(quick.lastMilestone).toBe("Quick Pickup");
    expect(quick.lastStyleAward).toBe(QUICK_PICKUP_STYLE_BONUS);
    expect(snapshotWorld(quick).lastStyleAward).toBe(QUICK_PICKUP_STYLE_BONUS);
    expect(quickBreakdown.styleBonus).toBe(180);

    stepWorld(quick, 1 / 60, []);
    expect(quick.lastStyleAward).toBeUndefined();
    expect(summarizeRun(quick).scoreBreakdown.styleBonus).toBe(quickBreakdown.styleBonus);

    const late = createWorldFromSystem(starterSystem, "late-pickup-seed");
    late.elapsedSeconds = 18;
    late.ship.position = { x: 0, y: -74 };
    late.ship.velocity = { x: 1, y: 3 };
    late.ship.rotation = -Math.PI / 2;

    stepWorld(late, 1 / 60, []);

    expect(late.lastMilestone).toBe("Cargo Loaded");
    expect(summarizeRun(late).scoreBreakdown.styleBonus).toBe(0);
  });

  it("awards a style bonus for perfect deliveries after a stable approach", () => {
    const cleanApproach = createWorldFromSystem(starterSystem, "perfect-approach-seed");
    cleanApproach.elapsedSeconds = 18;
    cleanApproach.ship.position = { x: 0, y: -74 };
    cleanApproach.ship.velocity = { x: 1, y: 3 };
    cleanApproach.ship.rotation = -Math.PI / 2;
    stepWorld(cleanApproach, 1 / 60, []);

    cleanApproach.elapsedSeconds = 24;
    cleanApproach.bestApproachStreakSeconds = 1.2;
    cleanApproach.fuelUsed = cleanApproach.ship.maxFuel * 0.4;
    cleanApproach.ship.position = { x: 260, y: -80 };
    cleanApproach.ship.velocity = { x: 4, y: 1 };
    cleanApproach.ship.rotation = 0;
    stepWorld(cleanApproach, 1 / 60, []);

    expect(cleanApproach.status).toBe("delivered");
    expect(cleanApproach.landingRating).toBe("Perfect Landing");
    expect(cleanApproach.lastMilestone).toBe("Perfect Approach");
    expect(summarizeRun(cleanApproach).scoreBreakdown.styleBonus).toBe(220);

    const rushedDock = createWorldFromSystem(starterSystem, "rushed-dock-seed");
    rushedDock.elapsedSeconds = 18;
    rushedDock.ship.position = { x: 0, y: -74 };
    rushedDock.ship.velocity = { x: 1, y: 3 };
    rushedDock.ship.rotation = -Math.PI / 2;
    stepWorld(rushedDock, 1 / 60, []);

    rushedDock.elapsedSeconds = starterSystem.contracts[0]!.medalTimes.gold + 1;
    rushedDock.bestApproachStreakSeconds = 0.8;
    rushedDock.ship.position = { x: 260, y: -80 };
    rushedDock.ship.velocity = { x: 4, y: 1 };
    rushedDock.ship.rotation = 0;
    stepWorld(rushedDock, 1 / 60, []);

    expect(rushedDock.lastMilestone).toBe("Eco Drift");
    expect(summarizeRun(rushedDock).scoreBreakdown.styleBonus).toBe(ECO_DRIFT_STYLE_BONUS);
  });

  it("classifies landing guidance as too-fast, misaligned, or ready", () => {
    const world = createWorldFromSystem(starterSystem, "guide-seed");
    world.ship.position = { x: 0, y: -74 };
    world.ship.rotation = -Math.PI / 2;

    world.ship.velocity = { x: 60, y: 0 };
    expect(snapshotWorld(world).objectiveTarget?.landingStatus).toBe("too-fast");
    expect(snapshotWorld(world).objectiveTarget?.assistAvailable).toBe(false);

    world.ship.velocity = { x: 43, y: 0 };
    expect(snapshotWorld(world).objectiveTarget?.landingStatus).toBe("too-fast");
    expect(snapshotWorld(world).objectiveTarget?.assistAvailable).toBe(true);

    world.ship.velocity = { x: 35, y: 0 };
    world.ship.rotation = Math.PI;
    expect(snapshotWorld(world).objectiveTarget?.landingStatus).toBe("misaligned");

    world.ship.velocity = { x: 2, y: 1 };
    expect(snapshotWorld(world).objectiveTarget?.landingStatus).toBe("ready");

    world.ship.rotation = -Math.PI / 2;
    expect(snapshotWorld(world).objectiveTarget?.landingStatus).toBe("ready");
  });

  it("marks controlled planet-pad approaches inside the visible dock halo as ready", () => {
    const world = createWorldFromSystem(starterSystem, "wide-guide-seed");
    world.ship.position = { x: 30, y: -56 };
    world.ship.rotation = -Math.PI / 2;

    world.ship.velocity = { x: 45, y: 0 };
    expect(snapshotWorld(world).objectiveTarget?.landingStatus).toBe("too-fast");

    world.ship.velocity = { x: 30, y: 0 };
    world.ship.rotation = Math.PI;
    expect(snapshotWorld(world).objectiveTarget?.landingStatus).toBe("misaligned");

    world.ship.velocity = { x: 30, y: 0 };
    world.ship.rotation = -Math.PI / 2;
    expect(snapshotWorld(world).objectiveTarget?.landingStatus).toBe("ready");
  });

  it("builds and preserves a stable approach streak near the active pad", () => {
    const world = createWorldFromSystem(starterSystem, "streak-seed");
    world.ship.position = { x: 40, y: -74 };
    world.ship.velocity = { x: 0, y: 0 };
    world.ship.rotation = -Math.PI / 2;
    world.ship.targetRotation = -Math.PI / 2;

    for (let i = 0; i < 30; i += 1) {
      stepWorld(world, 1 / 60, []);
    }

    expect(snapshotWorld(world).approachStreakSeconds).toBeGreaterThan(0.45);
    expect(snapshotWorld(world).bestApproachStreakSeconds).toBeGreaterThan(0.45);

    world.ship.velocity = { x: 80, y: 0 };
    stepWorld(world, 1 / 60, []);

    expect(snapshotWorld(world).approachStreakSeconds).toBe(0);
    expect(snapshotWorld(world).bestApproachStreakSeconds).toBeGreaterThan(0.45);
  });

  it("gently assists near-pad landings while reckless target hits still load rough cargo", () => {
    const assisted = createWorldFromSystem(starterSystem, "assist-seed");
    assisted.ship.position = { x: 0, y: -74 };
    assisted.ship.velocity = { x: 43, y: 0 };
    assisted.ship.rotation = -Math.PI / 2;
    const fuelBeforeAssist = assisted.ship.fuel;
    stepWorld(assisted, 1 / 60, []);

    const reckless = createWorldFromSystem(starterSystem, "assist-seed");
    reckless.ship.position = { x: 0, y: -74 };
    reckless.ship.velocity = { x: 82, y: 0 };
    reckless.ship.rotation = -Math.PI / 2;
    stepWorld(reckless, 1 / 60, []);

    expect(assisted.status).toBe("flying");
    expect(assisted.cargoOnboard).toBe(true);
    expect(assisted.lastMilestone).toBe("Assist Burn");
    expect(assisted.ship.fuel).toBe(fuelBeforeAssist - LANDING_ASSIST_FUEL_COST);
    expect(assisted.fuelUsed).toBe(LANDING_ASSIST_FUEL_COST);
    expect(reckless.status).toBe("flying");
    expect(reckless.objectivePhase).toBe("delivery");
    expect(reckless.cargoOnboard).toBe(true);
    expect(reckless.crashReason).toBeUndefined();
    expect(reckless.ship.cargoDamage).toBeGreaterThan(0.4);
  });

  it("does not spend assist burn when a slightly fast target contact can rough dock", () => {
    const emptyAssist = createWorldFromSystem(starterSystem, "empty-assist-seed");
    emptyAssist.ship.position = { x: 0, y: -74 };
    emptyAssist.ship.velocity = { x: 43, y: 0 };
    emptyAssist.ship.rotation = -Math.PI / 2;
    emptyAssist.ship.fuel = LANDING_ASSIST_FUEL_COST;

    stepWorld(emptyAssist, 1 / 60, []);

    expect(emptyAssist.status).toBe("flying");
    expect(emptyAssist.objectivePhase).toBe("delivery");
    expect(emptyAssist.cargoOnboard).toBe(true);
    expect(emptyAssist.ship.fuel).toBe(LANDING_ASSIST_FUEL_COST);
    expect(emptyAssist.fuelUsed).toBe(0);
    expect(emptyAssist.ship.cargoDamage).toBeGreaterThan(0);
  });

  it("explains crash causes for hard landings, misaligned docks, and direct collisions", () => {
    const hardLanding = createWorldFromSystem(starterSystem, "crash-seed");
    hardLanding.ship.position = { x: 260, y: -80 };
    hardLanding.ship.velocity = { x: 82, y: 0 };
    hardLanding.ship.rotation = 0;
    stepWorld(hardLanding, 1 / 60, []);

    const misalignedDock = createWorldFromSystem(starterSystem, "misaligned-dock-seed");
    misalignedDock.ship.position = { x: 260, y: -80 };
    misalignedDock.ship.velocity = { x: 35, y: 0 };
    misalignedDock.ship.rotation = Math.PI;
    stepWorld(misalignedDock, 1 / 60, []);

    const collision = createWorldFromSystem(starterSystem, "crash-seed");
    collision.ship.position = { x: 0, y: 0 };
    collision.ship.velocity = { x: 0, y: 0 };
    stepWorld(collision, 1 / 60, []);

    expect(summarizeRun(hardLanding).crashReason).toBe("Hard Landing");
    expect(summarizeRun(misalignedDock).crashReason).toBe("Misaligned Dock");
    expect(summarizeRun(collision).crashReason).toBe("Hull Collision");
  });

  it("turns the first survivable gravity surface hit into an emergency shield rebound", () => {
    const world = createWorldFromSystem(starterSystem, "shield-rebound-seed");

    expect(snapshotWorld(world)).toMatchObject({
      emergencyShieldAvailable: true
    });

    world.ship.position = { x: 63, y: 0 };
    world.ship.velocity = { x: -24, y: 0 };
    world.ship.rotation = Math.PI;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("flying");
    expect(world.lastMilestone).toBe("Shield Rebound");
    expect(world.emergencyShieldUsed).toBe(true);
    expect(world.crashReason).toBeUndefined();
    expect(world.ship.cargoDamage).toBeCloseTo(EMERGENCY_SHIELD_REBOUND_DAMAGE, 3);
    expect(Math.hypot(world.ship.position.x, world.ship.position.y)).toBeGreaterThan(64);
    expect(world.ship.velocity.x).toBeGreaterThan(0);
    expect(snapshotWorld(world)).toMatchObject({
      emergencyShieldAvailable: false
    });
  });

  it("keeps direct core impacts and repeated gravity hits dangerous after the shield is spent", () => {
    const directImpact = createWorldFromSystem(starterSystem, "direct-core-impact-seed");
    directImpact.ship.position = { x: 0, y: 0 };
    directImpact.ship.velocity = { x: 0, y: 0 };

    stepWorld(directImpact, 1 / 60, []);

    expect(directImpact.status).toBe("crashed");
    expect(directImpact.emergencyShieldUsed).toBe(false);
    expect(directImpact.crashReason).toBe("Hull Collision");

    const repeatedHit = createWorldFromSystem(starterSystem, "repeated-surface-hit-seed");
    repeatedHit.ship.position = { x: 63, y: 0 };
    repeatedHit.ship.velocity = { x: -24, y: 0 };
    stepWorld(repeatedHit, 1 / 60, []);

    repeatedHit.ship.position = { x: 63, y: 0 };
    repeatedHit.ship.velocity = { x: -24, y: 0 };
    stepWorld(repeatedHit, 1 / 60, []);

    expect(repeatedHit.status).toBe("crashed");
    expect(repeatedHit.crashReason).toBe("Hull Collision");
    expect(repeatedHit.ship.cargoDamage).toBe(1);
  });

  it("counts rough near-target planet-side arrivals as deliveries rather than gravity collisions", () => {
    const returnLegSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "return-leg",
          title: "Return Leg",
          briefing: "Reverse the route under tighter timing.",
          riskLabel: "Tight Timer",
          rewardLabel: "Gold pace pressure",
          shipStart: {
            position: [200, -80],
            velocity: [0, 0],
            rotation: 0
          },
          pickupId: "dock-a",
          destinationId: "north-pad",
          cargoId: "bottled-starlight",
          medalTimes: {
            bronze: 80,
            silver: 48,
            gold: 30
          }
        }
      ]
    };
    const world = createWorldFromSystem(returnLegSystem, "planet-side-dock-miss-seed", { contractId: "return-leg" });
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 0, y: -55 };
    world.ship.velocity = { x: 35, y: 0 };
    world.ship.rotation = 0;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "north-pad",
      landingStatus: "misaligned"
    });
    expect(target?.distance).toBeGreaterThan(18);
    expect(target?.distance).toBeLessThan(18 * 1.35);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Spicy Landing");
    expect(summarizeRun(world).crashReason).toBeUndefined();
    expect(world.ship.cargoDamage).toBeGreaterThan(0);
  });

  it("lets slow near-target planet-side arrivals dock instead of crashing", () => {
    const returnLegSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "return-leg",
          title: "Return Leg",
          briefing: "Reverse the route under tighter timing.",
          riskLabel: "Tight Timer",
          rewardLabel: "Gold pace pressure",
          shipStart: {
            position: [200, -80],
            velocity: [0, 0],
            rotation: 0
          },
          pickupId: "dock-a",
          destinationId: "north-pad",
          cargoId: "bottled-starlight",
          medalTimes: {
            bronze: 80,
            silver: 48,
            gold: 30
          }
        }
      ]
    };
    const world = createWorldFromSystem(returnLegSystem, "planet-side-soft-arrival-seed", { contractId: "return-leg" });
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 0, y: -55 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;

    expect(snapshotWorld(world).objectiveTarget).toMatchObject({
      id: "north-pad",
      landingStatus: "ready"
    });

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Soft Landing");
    expect(world.crashReason).toBeUndefined();
  });

  it("delivers reported close planet-pad arrivals with safe speed instead of gravity crashes", () => {
    const returnLegSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "return-leg",
          title: "Return Leg",
          briefing: "Reverse the route under tighter timing.",
          riskLabel: "Tight Timer",
          rewardLabel: "Gold pace pressure",
          shipStart: {
            position: [200, -80],
            velocity: [0, 0],
            rotation: 0
          },
          pickupId: "dock-a",
          destinationId: "north-pad",
          cargoId: "bottled-starlight",
          medalTimes: {
            bronze: 80,
            silver: 48,
            gold: 30
          }
        }
      ]
    };
    const world = createWorldFromSystem(returnLegSystem, "reported-close-target-seed", { contractId: "return-leg" });
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 0, y: -53 };
    world.ship.velocity = { x: 23, y: 0 };
    world.ship.rotation = 0;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "north-pad",
      distance: 21,
      speed: 23,
      allowedApproachSpeed: 42,
      landingStatus: "ready"
    });

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.crashReason).toBeUndefined();
  });

  it("captures controlled planet-side arrivals across the live dock ring", () => {
    const returnLegSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "return-leg",
          title: "Return Leg",
          briefing: "Reverse the route under tighter timing.",
          riskLabel: "Tight Timer",
          rewardLabel: "Gold pace pressure",
          shipStart: {
            position: [200, -80],
            velocity: [0, 0],
            rotation: 0
          },
          pickupId: "dock-a",
          destinationId: "north-pad",
          cargoId: "bottled-starlight",
          medalTimes: {
            bronze: 80,
            silver: 48,
            gold: 30
          }
        }
      ]
    };
    const world = createWorldFromSystem(returnLegSystem, "planet-side-capture-ring-seed", { contractId: "return-leg" });
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 0, y: -44 };
    world.ship.velocity = { x: 8, y: 0 };
    world.ship.rotation = 0;

    expect(snapshotWorld(world).objectiveTarget).toMatchObject({
      id: "north-pad",
      distance: 30,
      landingStatus: "ready"
    });

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Soft Landing");
    expect(world.crashReason).toBeUndefined();
  });

  it("forgives controlled planet contact just beyond the active planet dock ring", () => {
    const returnLegSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "return-leg",
          title: "Return Leg",
          briefing: "Reverse the route under tighter timing.",
          riskLabel: "Tight Timer",
          rewardLabel: "Gold pace pressure",
          shipStart: {
            position: [200, -80],
            velocity: [0, 0],
            rotation: 0
          },
          pickupId: "dock-a",
          destinationId: "north-pad",
          cargoId: "bottled-starlight",
          medalTimes: {
            bronze: 80,
            silver: 48,
            gold: 30
          }
        }
      ]
    };
    const world = createWorldFromSystem(returnLegSystem, "planet-dock-grace-seed", { contractId: "return-leg" });
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 0, y: -16 };
    world.ship.velocity = { x: 8, y: 0 };
    world.ship.rotation = 0;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "north-pad",
      distance: 58,
      landingStatus: "ready"
    });
    expect(target?.distance).toBeGreaterThan(18 * 3);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Soft Landing");
    expect(world.crashReason).toBeUndefined();
  });

  it("counts controlled close-target planet contacts as deliveries instead of gravity collisions", () => {
    const returnLegSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "return-leg",
          title: "Return Leg",
          briefing: "Reverse the route under tighter timing.",
          riskLabel: "Tight Timer",
          rewardLabel: "Gold pace pressure",
          shipStart: {
            position: [200, -80],
            velocity: [0, 0],
            rotation: 0
          },
          pickupId: "dock-a",
          destinationId: "north-pad",
          cargoId: "bottled-starlight",
          medalTimes: {
            bronze: 80,
            silver: 48,
            gold: 30
          }
        }
      ]
    };
    const world = createWorldFromSystem(returnLegSystem, "planet-target-grace-seed", { contractId: "return-leg" });
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 24, y: -12 };
    world.ship.velocity = { x: 8, y: 0 };
    world.ship.rotation = 0;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "north-pad",
      landingStatus: "approach"
    });
    expect(target?.distance).toBeGreaterThan(18 * 3.5);
    expect(target?.distance).toBeLessThan(18 * 4);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Soft Landing");
    expect(summarizeRun(world).crashReason).toBeUndefined();
  });

  it("forgives controlled target-side planet contacts just outside the old dock grace", () => {
    const returnLegSystem: SystemContent = {
      ...starterSystem,
      contracts: [
        ...starterSystem.contracts,
        {
          id: "return-leg",
          title: "Return Leg",
          briefing: "Reverse the route under tighter timing.",
          riskLabel: "Tight Timer",
          rewardLabel: "Gold pace pressure",
          shipStart: {
            position: [200, -80],
            velocity: [0, 0],
            rotation: 0
          },
          pickupId: "dock-a",
          destinationId: "north-pad",
          cargoId: "bottled-starlight",
          medalTimes: {
            bronze: 80,
            silver: 48,
            gold: 30
          }
        }
      ]
    };
    const world = createWorldFromSystem(returnLegSystem, "target-side-planet-graze-seed", { contractId: "return-leg" });
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    world.ship.position = { x: 38, y: -12 };
    world.ship.velocity = { x: 8, y: 0 };
    world.ship.rotation = 0;

    const target = snapshotWorld(world).objectiveTarget;
    expect(target).toMatchObject({
      id: "north-pad",
      landingStatus: "approach"
    });
    expect(target?.distance).toBeGreaterThan(18 * 4);
    expect(target?.distance).toBeLessThan(18 * 4.5);

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("delivered");
    expect(world.landingRating).toBe("Soft Landing");
    expect(summarizeRun(world).crashReason).toBeUndefined();
  });

  it("reports boost burns as momentary courier feedback", () => {
    const world = createWorldFromSystem(starterSystem, "boost-seed");
    const fuelBefore = world.ship.fuel;

    stepWorld(world, 1 / 60, [{ type: "BOOST" }]);

    expect(world.ship.fuel).toBeLessThan(fuelBefore);
    expect(world.lastMilestone).toBe("Boost Burn");
  });

  it("awards deterministic medals from delivery quality", () => {
    const comet = createWorldFromSystem(starterSystem, "medal-seed");
    comet.ship.position = { x: 0, y: -74 };
    comet.ship.velocity = { x: 1, y: 3 };
    comet.ship.rotation = -Math.PI / 2;
    stepWorld(comet, 1 / 60, []);
    comet.ship.position = { x: 260, y: -80 };
    comet.ship.velocity = { x: 4, y: 1 };
    comet.ship.rotation = 0;
    stepWorld(comet, 1 / 60, []);

    const silver = createWorldFromSystem(starterSystem, "medal-seed");
    silver.status = "delivered";
    silver.elapsedSeconds = 44;
    silver.landingRating = "Soft Landing";
    silver.ship.cargoDamage = 0;
    silver.fuelUsed = 48;

    const failed = createWorldFromSystem(starterSystem, "medal-seed");
    failed.status = "crashed";

    expect(summarizeRun(comet).medal).toBe("comet");
    expect(summarizeRun(silver).medal).toBe("silver");
    expect(summarizeRun(failed).medal).toBe("none");
  });

  it("grades run results for instant retry feedback", () => {
    const comet = createWorldFromSystem(starterSystem, "grade-seed");
    comet.ship.position = { x: 0, y: -74 };
    comet.ship.velocity = { x: 1, y: 3 };
    comet.ship.rotation = -Math.PI / 2;
    stepWorld(comet, 1 / 60, []);
    comet.ship.position = { x: 260, y: -80 };
    comet.ship.velocity = { x: 4, y: 1 };
    comet.ship.rotation = 0;
    stepWorld(comet, 1 / 60, []);

    const silver = createWorldFromSystem(starterSystem, "grade-seed");
    silver.status = "delivered";
    silver.elapsedSeconds = 44;
    silver.landingRating = "Soft Landing";
    silver.ship.cargoDamage = 0;
    silver.fuelUsed = 48;

    const failed = createWorldFromSystem(starterSystem, "grade-seed");
    failed.status = "crashed";

    expect(summarizeRun(comet).grade).toBe("S");
    expect(summarizeRun(silver).grade).toBe("B");
    expect(summarizeRun(failed).grade).toBe("F");
  });

  it("explains delivered score totals with a stable score breakdown", () => {
    const world = createWorldFromSystem(starterSystem, "score-seed");
    world.ship.position = { x: 0, y: -74 };
    world.ship.velocity = { x: 1, y: 3 };
    world.ship.rotation = -Math.PI / 2;
    stepWorld(world, 1 / 60, []);
    world.fuelUsed = world.ship.maxFuel * 0.4;
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;
    stepWorld(world, 1 / 60, []);

    const result = summarizeRun(world);

    expect(result.scoreBreakdown).toMatchObject({
      base: 1000,
      fuelBonus: 450,
      cargoBonus: 500,
      landingBonus: 300,
      styleBonus: QUICK_PICKUP_STYLE_BONUS + Math.round(EXPRESS_FINISH_STYLE_BONUS * 1.25),
      dangerBonus: 0,
      incidentPenalty: 0,
      total: result.score
    });
    expect(result.scoreBreakdown.paceBonus).toBeGreaterThan(690);
    expect(
      Math.round(
        result.scoreBreakdown.base +
          result.scoreBreakdown.paceBonus +
          result.scoreBreakdown.fuelBonus +
          result.scoreBreakdown.cargoBonus +
          result.scoreBreakdown.landingBonus +
          result.scoreBreakdown.styleBonus +
          result.scoreBreakdown.dangerBonus -
          result.scoreBreakdown.incidentPenalty
      )
    ).toBe(result.score);
  });

  it("awards danger pay for delivered contracts with elevated hazard load", () => {
    const systemWithDangerPay: SystemContent = {
      ...starterSystem,
      contracts: [
        {
          ...starterSystem.contracts[0],
          hazardSeverityMultiplier: 1.5
        }
      ]
    };
    const world = createWorldFromSystem(systemWithDangerPay, "danger-pay-seed");
    world.ship.position = { x: 0, y: -74 };
    world.ship.velocity = { x: 1, y: 3 };
    world.ship.rotation = -Math.PI / 2;
    stepWorld(world, 1 / 60, []);
    world.ship.position = { x: 260, y: -80 };
    world.ship.velocity = { x: 4, y: 1 };
    world.ship.rotation = 0;
    stepWorld(world, 1 / 60, []);

    const result = summarizeRun(world);

    expect(result.status).toBe("delivered");
    expect(result.scoreBreakdown.dangerBonus).toBe(200);
    expect(
      Math.round(
        result.scoreBreakdown.base +
          result.scoreBreakdown.paceBonus +
          result.scoreBreakdown.fuelBonus +
          result.scoreBreakdown.cargoBonus +
          result.scoreBreakdown.landingBonus +
          result.scoreBreakdown.styleBonus +
          result.scoreBreakdown.dangerBonus -
          result.scoreBreakdown.incidentPenalty
      )
    ).toBe(result.score);
  });

  it("predicts a finite trajectory without mutating the live world", () => {
    const world = createWorldFromSystem(starterSystem, "preview-seed");
    const before = {
      x: world.ship.position.x,
      y: world.ship.position.y,
      fuel: world.ship.fuel
    };

    const points = predictTrajectory(world, {
      seconds: 2,
      fixedDt: 1 / 60,
      sampleEvery: 10
    });

    expect(points.length).toBeGreaterThan(5);
    expect(points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
    expect(world.ship.position.x).toBe(before.x);
    expect(world.ship.position.y).toBe(before.y);
    expect(world.ship.fuel).toBe(before.fuel);
  });
});

type CombatEnemyForTest = {
  id: string;
  archetype: "drone" | "fighter" | "brute" | "sentinel";
  position: Vec2;
  velocity: Vec2;
  rotation: number;
  hp: number;
  maxHp: number;
  armor: number;
  shield: number;
  maxShield: number;
  difficultyTier: ContractDifficultyTier;
  radius: number;
  maxSpeed: number;
  acceleration: number;
  projectileDamage: number;
  fireCooldownBaseSeconds: number;
  fireCooldownSeconds: number;
  contactCooldownSeconds: number;
  missileAmmo: number;
  missileCooldownSeconds: number;
  policy: "patrol" | "chase" | "evade";
};

type CombatProjectileForTest = {
  id: string;
  owner: "player" | "enemy";
  position: Vec2;
  velocity: Vec2;
  radius: number;
  damage: number;
  kind: "bolt" | "missile";
  targetId?: string;
  ageSeconds: number;
  maxAgeSeconds: number;
};

type CombatWorldForTest = SimulationWorld & {
  ship: SimulationWorld["ship"] & {
    hp: number;
    maxHp: number;
    weaponCooldownSeconds: number;
    missileAmmo: number;
  };
  enemies: CombatEnemyForTest[];
  playerProjectiles: CombatProjectileForTest[];
  enemyProjectiles: CombatProjectileForTest[];
};

type CombatSnapshotForTest = ReturnType<typeof snapshotWorld> & {
  ship: ReturnType<typeof snapshotWorld>["ship"] & {
    hp: number;
    maxHp: number;
  };
  enemies: CombatEnemyForTest[];
  playerProjectiles: CombatProjectileForTest[];
  enemyProjectiles: CombatProjectileForTest[];
};

function combatWorld(world: SimulationWorld): CombatWorldForTest {
  return world as CombatWorldForTest;
}

function combatSnapshot(world: SimulationWorld): CombatSnapshotForTest {
  return snapshotWorld(world) as CombatSnapshotForTest;
}

function fireCommand(): PlayerCommand[] {
  return [{ type: "FIRE" } as PlayerCommand];
}

function distanceBetweenTest(left: Vec2, right: Vec2): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function testEnemy(id: string, position: Vec2, options: { hp?: number; armor?: number; shield?: number } = {}): CombatEnemyForTest {
  return {
    id,
    archetype: "fighter",
    position,
    velocity: { x: 0, y: 0 },
    rotation: 0,
    hp: options.hp ?? 40,
    maxHp: 40,
    armor: options.armor ?? 0,
    shield: options.shield ?? 0,
    maxShield: options.shield ?? 0,
    difficultyTier: "standard",
    radius: 14,
    maxSpeed: 26,
    acceleration: 17,
    projectileDamage: 8,
    fireCooldownBaseSeconds: 4.4,
    fireCooldownSeconds: 999,
    contactCooldownSeconds: 0,
    missileAmmo: 0,
    missileCooldownSeconds: 999,
    policy: "patrol"
  };
}
