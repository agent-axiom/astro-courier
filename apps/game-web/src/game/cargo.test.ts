import { describe, expect, it } from "vitest";
import { buildCargoManifest } from "./cargo";

describe("cargo manifest HUD copy", () => {
  it("shows the assigned cargo before pickup", () => {
    expect(buildCargoManifest({ cargoName: "Volatile Comet Ice", cargoOnboard: false })).toEqual({
      label: "Cargo",
      value: "Volatile Comet Ice"
    });
  });

  it("keeps the cargo identity visible after pickup", () => {
    expect(buildCargoManifest({ cargoName: "Bottled Starlight", cargoOnboard: true })).toEqual({
      label: "Cargo",
      value: "Bottled Starlight"
    });
  });
});
