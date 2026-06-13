import { describe, expect, it } from "vitest";
import { checksumReplay, createCommandBuffer, fixedStepAccumulator } from "./index";
import type { ReplayEnvelope } from "@astro-courier/shared";

describe("engine replay utilities", () => {
  it("returns commands in deterministic tick order", () => {
    const buffer = createCommandBuffer([
      { tick: 10, command: { type: "THRUST", amount: 0.5 } },
      { tick: 4, command: { type: "AIM", angle: 1.2 } },
      { tick: 10, command: { type: "BRAKE", amount: 0.25 } }
    ]);

    expect(buffer.commandsForTick(4)).toEqual([{ type: "AIM", angle: 1.2 }]);
    expect(buffer.commandsForTick(10)).toEqual([
      { type: "THRUST", amount: 0.5 },
      { type: "BRAKE", amount: 0.25 }
    ]);
    expect(buffer.commandsForTick(11)).toEqual([]);
  });

  it("checksums replay envelopes with stable canonical ordering", () => {
    const replay: ReplayEnvelope = {
      gameVersion: "0.1.0",
      contentVersion: "starter@1",
      systemId: "starter-route",
      contractId: "first-light",
      rngSeed: "daily-2026-06-13",
      shipConfig: {
        hull: "starter",
        upgrades: ["trajectory-computer"]
      },
      inputFrames: [
        { tick: 12, command: { type: "AIM", angle: 0.25 } },
        { tick: 13, command: { type: "THRUST", amount: 1 } }
      ],
      result: {
        status: "delivered",
        elapsedSeconds: 18.5,
        score: 1400,
        cargoDamage: 0,
        fuelUsed: 12,
        medal: "gold",
        scoreBreakdown: {
          base: 1000,
          paceBonus: 200,
          fuelBonus: 80,
          cargoBonus: 0,
          landingBonus: 120,
          incidentPenalty: 0,
          total: 1400
        }
      }
    };

    const reordered = {
      result: replay.result,
      inputFrames: replay.inputFrames,
      shipConfig: replay.shipConfig,
      rngSeed: replay.rngSeed,
      contractId: replay.contractId,
      systemId: replay.systemId,
      contentVersion: replay.contentVersion,
      gameVersion: replay.gameVersion
    } satisfies ReplayEnvelope;

    expect(checksumReplay(replay)).toMatch(/^[a-f0-9]{64}$/);
    expect(checksumReplay(reordered)).toBe(checksumReplay(replay));
  });

  it("limits fixed timestep catch-up work", () => {
    const result = fixedStepAccumulator({
      accumulator: 0,
      deltaSeconds: 0.5,
      fixedDt: 1 / 60,
      maxSubSteps: 5
    });

    expect(result.steps).toBe(5);
    expect(result.droppedTime).toBeGreaterThan(0);
    expect(result.alpha).toBeGreaterThanOrEqual(0);
    expect(result.alpha).toBeLessThan(1);
  });
});
