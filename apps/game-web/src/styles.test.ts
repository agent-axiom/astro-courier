import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("responsive game layout CSS", () => {
  it("uses a wider two-column preflight briefing on desktop viewports", () => {
    expect(styles).toContain("@media (min-width: 900px)");
    expect(styles).toContain("width: min(860px, calc(100vw - 48px));");
    expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(styles).toContain("grid-column: 1 / -1;");
  });

  it("frames result coach cards with tone-aware post-run emphasis", () => {
    expect(styles).toMatch(/\.result-coach\s*\{[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.1\);/);
    expect(styles).toMatch(/\.result-coach-danger\s*\{[\s\S]*border-color: rgba\(255, 111, 145, 0\.36\);/);
    expect(styles).toMatch(/\.result-coach-success\s*\{[\s\S]*box-shadow: 0 0 24px rgba\(142, 230, 184, 0\.1\);/);
  });
});
