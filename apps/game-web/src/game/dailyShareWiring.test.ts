import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("daily share wiring", () => {
  it("renders a daily share chip and uses concise daily copy when available", () => {
    expect(appSource).toContain("buildDailyShare({");
    expect(appSource).toContain("const shareableDeliveryReport = dailyShare?.text ?? deliveryReport;");
    expect(appSource).toContain("className={`daily-share daily-share-${dailyShare.tone}`}");
  });
});
