import { describe, expect, it } from "vitest";

import { buildSpacePhenomenon } from "./spacePhenomena";

describe("space phenomena presentation", () => {
  it("prioritizes wormholes as route puzzles", () => {
    expect(buildSpacePhenomenon([{ type: "ion_storm" }, { type: "wormhole" }])).toEqual({
      label: "Phenomenon",
      value: "Wormhole",
      detail: "Exit fast",
      tone: "portal"
    });
  });

  it("labels storm and magnetic hazards compactly", () => {
    expect(buildSpacePhenomenon([{ type: "ion_storm" }])?.value).toBe("Ion storm");
    expect(buildSpacePhenomenon([{ type: "magnetic_burst" }])?.detail).toBe("Missiles bend");
  });

  it("stays hidden without a known phenomenon", () => {
    expect(buildSpacePhenomenon([{ type: "nebula" }])).toBeUndefined();
  });
});
