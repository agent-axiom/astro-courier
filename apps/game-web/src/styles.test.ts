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
});
