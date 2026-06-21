import { describe, expect, it, vi } from "vitest";
import { buildEnemyDirectorRequest, createEnemyDirectorClient } from "./enemyDirector";
import type { SimulationSnapshot } from "@astro-courier/shared";

describe("enemy director client", () => {
  it("stays disabled when no public director URL is configured", () => {
    expect(createEnemyDirectorClient(undefined)).toBeUndefined();
    expect(createEnemyDirectorClient("")).toBeUndefined();
  });

  it("builds a reduced request from a simulation snapshot", () => {
    expect(buildEnemyDirectorRequest(testSnapshot(), "cinematic")).toEqual({
      quality: "cinematic",
      tick: 240,
      objectivePhase: "delivery",
      ship: {
        hp: 82,
        position: { x: 10, y: 20 },
        velocity: { x: 2, y: 3 }
      },
      enemies: [
        {
          id: "interceptor-a",
          archetype: "fighter",
          hp: 30,
          position: { x: 40, y: 60 },
          distance: 50
        }
      ]
    });
  });

  it("posts to the worker and returns the clamped director response", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      expect(_url).toBe("https://director.example/enemy-director");
      expect(init.method).toBe("POST");
      expect(JSON.parse(String(init.body))).toMatchObject({
        quality: "standard",
        tick: 240,
        objectivePhase: "delivery"
      });
      return new Response(
        JSON.stringify({
          mode: "openai",
          policy: {
            aggression: 0.8,
            flank: -0.5,
            fireBias: 0.7,
            retreatHp: 14,
            focus: "player"
          },
          directive: {
            formation: "pincer",
            missileDoctrine: "salvo",
            pressure: 0.8,
            hint: "pincer"
          }
        })
      );
    });
    const client = createEnemyDirectorClient("https://director.example/enemy-director", fetchImpl);

    await expect(client?.requestPolicy(testSnapshot())).resolves.toEqual({
      mode: "openai",
      policy: {
        aggression: 0.8,
        flank: -0.5,
        fireBias: 0.7,
        retreatHp: 14,
        focus: "player"
      },
      directive: {
        formation: "pincer",
        missileDoctrine: "salvo",
        pressure: 0.8,
        hint: "pincer"
      }
    });
  });

  it("can request a cinematic director budget", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      expect(JSON.parse(String(init.body))).toMatchObject({
        quality: "cinematic"
      });
      return new Response(
        JSON.stringify({
          mode: "fallback",
          policy: {
            aggression: 0.45,
            flank: 0,
            fireBias: 0.4,
            retreatHp: 28,
            focus: "cargo"
          },
          directive: {
            formation: "screen",
            missileDoctrine: "hold",
            pressure: 0.4
          }
        })
      );
    });
    const client = createEnemyDirectorClient("https://director.example/enemy-director", fetchImpl, "cinematic");

    await client?.requestPolicy(testSnapshot());
  });

  it("falls back silently when the worker is unavailable", async () => {
    const client = createEnemyDirectorClient(
      "https://director.example/enemy-director",
      vi.fn(async () => new Response("nope", { status: 503 }))
    );

    await expect(client?.requestPolicy(testSnapshot())).resolves.toBeUndefined();
  });
});

function testSnapshot(): SimulationSnapshot {
  return {
    tick: 240,
    status: "flying",
    objectivePhase: "delivery",
    activePerk: "afterburner",
    cargoOnboard: true,
    manualBrakeUsed: false,
    emergencyShieldAvailable: true,
    approachStreakSeconds: 0,
    bestApproachStreakSeconds: 0,
    styleChainCount: 0,
    styleChainSecondsRemaining: 0,
    styleMultiplier: 1,
    launchBurstSecondsRemaining: 0,
    elapsedSeconds: 4,
    score: 120,
    ship: {
      position: { x: 10, y: 20 },
      velocity: { x: 2, y: 3 },
      rotation: 0,
      fuel: 80,
      maxFuel: 100,
      hp: 82,
      maxHp: 100,
      weaponCooldownSeconds: 0,
      missileAmmo: 3,
      boostCooldownSeconds: 0,
      cargoDamage: 0
    },
    enemies: [
      {
        id: "interceptor-a",
        archetype: "fighter",
        position: { x: 40, y: 60 },
        velocity: { x: 0, y: 0 },
        rotation: 0,
        hp: 30,
        maxHp: 40,
        armor: 4,
        shield: 8,
        maxShield: 8,
        difficultyTier: "standard",
        radius: 14,
        policy: "chase"
      }
    ],
    playerProjectiles: [],
    enemyProjectiles: [],
    enemyDirector: {
      mode: "local",
      policy: {
        aggression: 0.45,
        flank: 0,
        fireBias: 0.4,
        retreatHp: 28,
        focus: "cargo"
      },
      directive: {
        formation: "screen",
        missileDoctrine: "hold",
        pressure: 0.4
      }
    },
    gravitySources: [],
    landingPads: [],
    hazards: [],
    riskGates: []
  };
}
