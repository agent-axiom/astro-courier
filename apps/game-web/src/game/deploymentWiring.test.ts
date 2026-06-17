import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const gameMusicSource = readFileSync(new URL("./gameMusic.ts", import.meta.url), "utf8");
const viteConfig = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");
const readme = readFileSync(new URL("../../../../README.md", import.meta.url), "utf8");
const workflowUrl = new URL("../../../../.github/workflows/deploy-pages.yml", import.meta.url);

describe("deployment wiring", () => {
  it("configures Vite with a deploy base for GitHub project pages", () => {
    expect(viteConfig).toContain("process.env.DEPLOY_BASE");
    expect(viteConfig).toContain('base: deployBase');
    expect(viteConfig).toContain("normalizeDeployBase");
  });

  it("uses base-aware public asset URLs for cover art and music", () => {
    expect(appSource).toContain('resolvePublicAssetPath("images/astro-courier-cover.png")');
    expect(appSource).toContain("src={coverArtSrc}");
    expect(gameMusicSource).toContain('resolvePublicAssetPath("audio/manifest.json")');
    expect(gameMusicSource).toContain("resolvePublicAssetPath(track)");
  });

  it("ships a GitHub Pages workflow for the game web build", () => {
    expect(existsSync(workflowUrl)).toBe(true);
    const workflow = readFileSync(workflowUrl, "utf8");

    expect(workflow).toContain("name: Deploy Astro Courier to GitHub Pages");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("pnpm/action-setup");
    expect(workflow).toContain("DEPLOY_BASE: /astro-courier/");
    expect(workflow).toContain("corepack pnpm --filter @astro-courier/game-web build");
    expect(workflow).toContain("actions/configure-pages");
    expect(workflow).toContain("actions/upload-pages-artifact");
    expect(workflow).toContain("path: apps/game-web/dist");
    expect(workflow).toContain("actions/deploy-pages");
  });

  it("documents the production URL and deployment source", () => {
    expect(readme).toContain("https://agent-axiom.github.io/astro-courier/");
    expect(readme).toContain("GitHub Pages");
  });
});
