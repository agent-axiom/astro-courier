import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const deployBase = normalizeDeployBase(process.env.DEPLOY_BASE);

export default defineConfig({
  base: deployBase,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/pixi.js") || id.includes("node_modules/@pixi")) {
            return "pixi";
          }
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/zustand")) {
            return "react-shell";
          }
          return undefined;
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});

function normalizeDeployBase(base: string | undefined): string {
  const trimmed = base?.trim();
  if (!trimmed) {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}
