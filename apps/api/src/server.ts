import { pathToFileURL } from "node:url";
import Fastify, { type FastifyServerOptions } from "fastify";
import { registerDailyRoutes } from "./routes/daily";
import { registerHealthRoutes } from "./routes/health";
import { registerReplayRoutes } from "./routes/replays";

export function buildServer(options: FastifyServerOptions = {}) {
  const server = Fastify(options);

  registerHealthRoutes(server);
  registerDailyRoutes(server);
  registerReplayRoutes(server);

  return server;
}

async function start(): Promise<void> {
  const server = buildServer({ logger: true });
  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? "127.0.0.1";

  try {
    await server.listen({ port, host });
  } catch (error) {
    server.log.error(error);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void start();
}
