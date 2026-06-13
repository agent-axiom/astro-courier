import type { FastifyInstance } from "fastify";

export function registerHealthRoutes(server: FastifyInstance): void {
  server.get("/health", async () => ({
    service: "astro-courier-api",
    version: "0.1.0"
  }));
}

