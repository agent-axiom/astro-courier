import starterRoute from "@astro-courier/content/data/systems/starter-route.json";
import { validateSystemContent } from "@astro-courier/content";
import { checksumReplay, createCommandBuffer } from "@astro-courier/engine";
import { createWorldReplay } from "@astro-courier/simulation";
import type { InputFrame, RunResultSummary } from "@astro-courier/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("AIM"), angle: z.number().finite() }),
  z.object({ type: z.literal("THRUST"), amount: z.number().min(0).max(1) }),
  z.object({ type: z.literal("BRAKE"), amount: z.number().min(0).max(1) }),
  z.object({ type: z.literal("BOOST") }),
  z.object({ type: z.literal("INTERACT") }),
  z.object({ type: z.literal("PAUSE") })
]);

const inputFrameSchema = z.object({
  tick: z.number().int().min(0),
  command: commandSchema
});

const scoreBreakdownSchema = z.object({
  base: z.number().min(0),
  paceBonus: z.number().min(0),
  fuelBonus: z.number().min(0),
  cargoBonus: z.number().min(0),
  landingBonus: z.number().min(0),
  styleBonus: z.number().min(0),
  incidentPenalty: z.number().min(0),
  total: z.number().min(0)
});

const resultSchema = z.object({
  status: z.enum(["flying", "delivered", "crashed", "paused"]),
  elapsedSeconds: z.number().min(0),
  score: z.number().min(0),
  cargoDamage: z.number().min(0).max(1),
  fuelUsed: z.number().min(0),
  medal: z.enum(["none", "bronze", "silver", "gold", "comet"]),
  landingRating: z
    .enum(["Perfect Landing", "Soft Landing", "Spicy Landing", "Cargo Survived Somehow", "Insurance Event"])
    .optional(),
  crashReason: z.enum(["Hard Landing", "Hull Collision"]).optional(),
  scoreBreakdown: scoreBreakdownSchema
});

const replayValidationSchema = z.object({
  systemId: z.string().min(1),
  contractId: z.string().min(1),
  rngSeed: z.string().min(1),
  ticks: z.number().int().min(1).max(60 * 60 * 10),
  inputFrames: z.array(inputFrameSchema).max(20_000),
  result: resultSchema.optional()
});

const knownSystems = new Map([[starterRoute.id, validateSystemContent(starterRoute)]]);

export function registerReplayRoutes(server: FastifyInstance): void {
  server.post("/replays/validate", async (request, reply) => {
    const parsed = replayValidationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        accepted: false,
        reason: "invalid-payload",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    const body = parsed.data;
    const system = knownSystems.get(body.systemId);
    if (!system) {
      return reply.status(404).send({
        accepted: false,
        reason: "unknown-system"
      });
    }

    const contract = system.contracts.find((candidate) => candidate.id === body.contractId);
    if (!contract) {
      return reply.status(404).send({
        accepted: false,
        reason: "unknown-contract"
      });
    }

    const replay = createWorldReplay({
      system,
      seed: body.rngSeed,
      commandBuffer: createCommandBuffer(body.inputFrames as InputFrame[]),
      ticks: body.ticks
    }).replay;

    const checksum = checksumReplay(replay);
    const accepted = body.result ? sameResult(body.result, replay.result) : true;

    return reply.send({
      accepted,
      checksum,
      result: replay.result,
      contentVersion: replay.contentVersion
    });
  });
}

function sameResult(left: RunResultSummary, right: RunResultSummary): boolean {
  return (
    left.status === right.status &&
    left.elapsedSeconds === right.elapsedSeconds &&
    left.score === right.score &&
    left.cargoDamage === right.cargoDamage &&
    left.fuelUsed === right.fuelUsed &&
    left.medal === right.medal &&
    left.landingRating === right.landingRating &&
    left.crashReason === right.crashReason &&
    sameScoreBreakdown(left.scoreBreakdown, right.scoreBreakdown)
  );
}

function sameScoreBreakdown(left: RunResultSummary["scoreBreakdown"], right: RunResultSummary["scoreBreakdown"]): boolean {
  return (
    left.base === right.base &&
    left.paceBonus === right.paceBonus &&
    left.fuelBonus === right.fuelBonus &&
    left.cargoBonus === right.cargoBonus &&
    left.landingBonus === right.landingBonus &&
    left.styleBonus === right.styleBonus &&
    left.incidentPenalty === right.incidentPenalty &&
    left.total === right.total
  );
}
