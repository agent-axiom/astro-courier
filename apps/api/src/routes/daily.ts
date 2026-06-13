import starterRoute from "@astro-courier/content/data/systems/starter-route.json";
import { validateSystemContent } from "@astro-courier/content";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

const dailyDispatchQuerySchema = z.object({
  systemId: z.string().min(1).default("starter-route"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const knownSystems = new Map([[starterRoute.id, validateSystemContent(starterRoute)]]);

export function registerDailyRoutes(server: FastifyInstance): void {
  server.get("/daily/dispatch", async (request, reply) => {
    const parsed = dailyDispatchQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        accepted: false,
        reason: "invalid-query",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    const system = knownSystems.get(parsed.data.systemId);
    if (!system) {
      return reply.status(404).send({
        accepted: false,
        reason: "unknown-system"
      });
    }

    const dayNumber = Math.floor(Date.parse(`${parsed.data.date}T00:00:00Z`) / 86_400_000);
    const contract = system.contracts[dayNumber % system.contracts.length];

    return reply.send({
      label: "Daily dispatch",
      value: contract.title,
      systemId: system.id,
      date: parsed.data.date,
      contractId: contract.id,
      seed: `daily-${parsed.data.date}-${contract.id}`
    });
  });
}
