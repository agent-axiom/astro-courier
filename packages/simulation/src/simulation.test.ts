import { describe, expect, it } from "vitest";
import { createCommandBuffer, checksumReplay } from "@astro-courier/engine";
import {
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

  it("awards a one-time style bonus for quick cargo pickup", () => {
    const quick = createWorldFromSystem(starterSystem, "quick-pickup-seed");
    quick.elapsedSeconds = 8;
    quick.ship.position = { x: 0, y: -74 };
    quick.ship.velocity = { x: 1, y: 3 };
    quick.ship.rotation = -Math.PI / 2;

    stepWorld(quick, 1 / 60, []);
    const quickBreakdown = summarizeRun(quick).scoreBreakdown;

    expect(quick.lastMilestone).toBe("Quick Pickup");
    expect(quickBreakdown.styleBonus).toBe(180);

    stepWorld(quick, 1 / 60, []);
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

    rushedDock.elapsedSeconds = 24;
    rushedDock.bestApproachStreakSeconds = 0.8;
    rushedDock.ship.position = { x: 260, y: -80 };
    rushedDock.ship.velocity = { x: 4, y: 1 };
    rushedDock.ship.rotation = 0;
    stepWorld(rushedDock, 1 / 60, []);

    expect(rushedDock.lastMilestone).toBe("Delivered");
    expect(summarizeRun(rushedDock).scoreBreakdown.styleBonus).toBe(0);
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
    stepWorld(assisted, 1 / 60, []);

    const reckless = createWorldFromSystem(starterSystem, "assist-seed");
    reckless.ship.position = { x: 0, y: -74 };
    reckless.ship.velocity = { x: 82, y: 0 };
    reckless.ship.rotation = -Math.PI / 2;
    stepWorld(reckless, 1 / 60, []);

    expect(assisted.status).toBe("flying");
    expect(assisted.cargoOnboard).toBe(true);
    expect(assisted.lastMilestone).toBe("Quick Pickup");
    expect(reckless.status).toBe("crashed");
    expect(reckless.landingRating).toBe("Insurance Event");
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
      styleBonus: 180,
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
          result.scoreBreakdown.styleBonus -
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
