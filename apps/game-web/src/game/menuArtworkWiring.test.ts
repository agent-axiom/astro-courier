import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const readmeUrl = new URL("../../../../README.md", import.meta.url);
const coverAssetUrl = new URL("../../public/images/astro-courier-cover.png", import.meta.url);

describe("menu artwork wiring", () => {
  it("ships the Astro Courier cover art as a public game asset", () => {
    expect(existsSync(coverAssetUrl)).toBe(true);
  });

  it("features the Astro Courier cover art in the preflight menu", () => {
    expect(appSource).toContain('className="preflight-cover-art"');
    expect(appSource).toContain('src="/images/astro-courier-cover.png"');
  });

  it("features the same cover art in the project README", () => {
    const readme = existsSync(readmeUrl) ? readFileSync(readmeUrl, "utf8") : "";

    expect(readme).toContain("![Astro Courier cover](apps/game-web/public/images/astro-courier-cover.png)");
  });
});
