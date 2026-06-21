import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("campaign map wiring", () => {
  it("renders the compact campaign map from route board progress", () => {
    expect(appSource).toContain("buildCampaignMap({");
    expect(appSource).toContain('className={`campaign-map campaign-map-${campaignMap.summary.tone}`}');
    expect(appSource).toContain("campaignMap.sectors.map");
  });
});
