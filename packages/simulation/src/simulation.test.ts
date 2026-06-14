import { describe, expect, it } from "vitest";
import { createCommandBuffer, checksumReplay } from "@astro-courier/engine";
import {
  calculateHazardThreadStyleBonus,
  calculateHazardSkimStyleBonus,
  BOOST_COOLDOWN_SECONDS,
  ECO_DRIFT_FUEL_USED_LIMIT,
  ECO_DRIFT_STYLE_BONUS,
  EXPRESS_FINISH_STYLE_BONUS,
  GRAVITY_SLING_STYLE_BONUS,
  CHAIN_FINISH_STYLE_BONUS,
  CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS,
  COMET_FINISH_STYLE_BONUS,
  DAMAGE_CONTROL_STYLE_BONUS,
  LAST_DROP_STYLE_BONUS,
  LANDING_ASSIST_FUEL_COST,
  NO_BRAKE_STYLE_BONUS,
  QUICK_PICKUP_STYLE_BONUS,
  STYLE_CHAIN_WINDOW_SECONDS,
  createWorldFromSystem,
  createWorldReplay,
  predictTrajectory,
  snapshotWorld,
  stepWorld,
  summarizeRun,
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

  it("awards one gravity sling style hit for a clean high-speed gravity pocket pass", () => {
    const world = createWorldFromSystem(starterSystem, "gravity-sling-seed");
    world.ship.position = { x: 0, y: -160 };
    world.ship.velocity = { x: 58, y: 0 };
    world.ship.rotation = 0;
    world.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, []);
    const firstBreakdown = summarizeRun(world).scoreBreakdown;

    expect(world.lastMilestone).toBe("Gravity Sling");
    expect(world.lastStyleAward).toBe(GRAVITY_SLING_STYLE_BONUS);
    expect(firstBreakdown.styleBonus).toBe(GRAVITY_SLING_STYLE_BONUS);

    stepWorld(world, 1 / 60, []);

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

  it("does not award gravity sling style for a near-surface hard landing", () => {
    const world = createWorldFromSystem(starterSystem, "gravity-sling-crash-seed");
    world.ship.position = { x: 0, y: -74 };
    world.ship.velocity = { x: 58, y: 0 };
    world.ship.rotation = 0;
    world.ship.targetRotation = 0;

    stepWorld(world, 1 / 60, []);

    expect(world.status).toBe("crashed");
    expect(world.lastMilestone).toBeUndefined();
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

    world.ship.velocity = { x: 2, y: 1 };
    world.ship.rotation = Math.PI;
    expect(snapshotWorld(world).objectiveTarget?.landingStatus).toBe("misaligned");

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

  it("gently assists near-pad landings without saving reckless impacts", () => {
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
    expect(reckless.status).toBe("crashed");
    expect(reckless.landingRating).toBe("Insurance Event");
  });

  it("does not spend assist burn or save a fast pad contact without enough fuel", () => {
    const emptyAssist = createWorldFromSystem(starterSystem, "empty-assist-seed");
    emptyAssist.ship.position = { x: 0, y: -74 };
    emptyAssist.ship.velocity = { x: 43, y: 0 };
    emptyAssist.ship.rotation = -Math.PI / 2;
    emptyAssist.ship.fuel = LANDING_ASSIST_FUEL_COST;

    stepWorld(emptyAssist, 1 / 60, []);

    expect(emptyAssist.status).toBe("crashed");
    expect(emptyAssist.ship.fuel).toBe(LANDING_ASSIST_FUEL_COST);
    expect(emptyAssist.fuelUsed).toBe(0);
  });

  it("explains crash causes for hard landings and direct collisions", () => {
    const hardLanding = createWorldFromSystem(starterSystem, "crash-seed");
    hardLanding.ship.position = { x: 0, y: -74 };
    hardLanding.ship.velocity = { x: 82, y: 0 };
    hardLanding.ship.rotation = -Math.PI / 2;
    stepWorld(hardLanding, 1 / 60, []);

    const collision = createWorldFromSystem(starterSystem, "crash-seed");
    collision.ship.position = { x: 0, y: 0 };
    collision.ship.velocity = { x: 0, y: 0 };
    stepWorld(collision, 1 / 60, []);

    expect(summarizeRun(hardLanding).crashReason).toBe("Hard Landing");
    expect(summarizeRun(collision).crashReason).toBe("Hull Collision");
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
