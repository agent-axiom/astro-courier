import { describe, expect, it } from "vitest";
import starterRoute from "@astro-courier/content/data/systems/starter-route.json";
import { validateSystemContent } from "@astro-courier/content";
import { checksumReplay, createCommandBuffer } from "@astro-courier/engine";
import { createWorldReplay } from "@astro-courier/simulation";
import { buildServer } from "./server";

describe("Astro Courier API", () => {
  it("returns health metadata", async () => {
    const server = buildServer({ logger: false });

    const response = await server.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      service: "astro-courier-api",
      version: "0.1.0"
    });
  });

  it("validates deterministic replay submissions against server simulation", async () => {
    const server = buildServer({ logger: false });

    const response = await server.inject({
      method: "POST",
      url: "/replays/validate",
      payload: {
        systemId: "starter-route",
        contractId: "first-light-delivery",
        rngSeed: "daily-2026-06-13",
        ticks: 24,
        inputFrames: [
          { tick: 0, command: { type: "THRUST", amount: 1 } },
          { tick: 10, command: { type: "AIM", angle: 0.1 } }
        ]
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.accepted).toBe(true);
    expect(body.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(body.result.status).toBe("flying");
  });

  it("validates replay submissions against the selected contract", async () => {
    const server = buildServer({ logger: false });
    const system = validateSystemContent(starterRoute);
    const expectedReplay = createWorldReplay({
      system,
      seed: "daily-return-leg",
      commandBuffer: createCommandBuffer([]),
      ticks: 1,
      contractId: "return-leg"
    }).replay;

    const response = await server.inject({
      method: "POST",
      url: "/replays/validate",
      payload: {
        systemId: "starter-route",
        contractId: "return-leg",
        rngSeed: "daily-return-leg",
        ticks: 1,
        inputFrames: []
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      accepted: true,
      checksum: checksumReplay(expectedReplay)
    });
  });

  it("serves the deterministic daily dispatch for a route board date", async () => {
    const server = buildServer({ logger: false });

    const response = await server.inject({
      method: "GET",
      url: "/daily/dispatch?systemId=starter-route&date=2026-06-13"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      label: "Daily dispatch",
      value: "Asteroid Sprint",
      systemId: "starter-route",
      date: "2026-06-13",
      contractId: "asteroid-sprint",
      seed: "daily-2026-06-13-asteroid-sprint",
      resetsAt: "2026-06-14T00:00:00.000Z"
    });
  });

  it("rejects unknown systems before replay simulation", async () => {
    const server = buildServer({ logger: false });

    const response = await server.inject({
      method: "POST",
      url: "/replays/validate",
      payload: {
        systemId: "missing-system",
        contractId: "first-light-delivery",
        rngSeed: "daily-2026-06-13",
        ticks: 1,
        inputFrames: []
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      accepted: false,
      reason: "unknown-system"
    });
  });
});
