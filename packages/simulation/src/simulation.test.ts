import { describe, expect, it } from "vitest";
import { createCommandBuffer, checksumReplay } from "@astro-courier/engine";
import {
  createWorldFromSystem,
  createWorldReplay,
  predictTrajectory,
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

  it("accepts soft aligned docking and rejects fast misaligned docking", () => {
    const soft = createWorldFromSystem(starterSystem, "dock-seed");
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

