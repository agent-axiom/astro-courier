import { describe, expect, it } from "vitest";
import { buildResultStats } from "./resultStats";

describe("result stat formatting", () => {
  it("labels score, time, and cargo integrity for the result overlay", () => {
    expect(buildResultStats({ score: 2400, elapsedSeconds: 31.26, cargoIntegrity: 0.874 })).toEqual([
      { label: "Score", value: "2400" },
      { label: "Time", value: "31.3s" },
      { label: "Cargo", value: "87%" }
    ]);
  });
});
