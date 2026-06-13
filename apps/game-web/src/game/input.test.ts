import { describe, expect, it } from "vitest";
import { commandsFromPointer } from "./input";

describe("pointer input mapping", () => {
  it("maps an active pointer to aim and thrust commands", () => {
    expect(
      commandsFromPointer({
        active: true,
        center: { x: 200, y: 200 },
        pointer: { x: 300, y: 200 }
      })
    ).toEqual([
      { type: "AIM", angle: 0 },
      { type: "THRUST", amount: 1 }
    ]);
  });

  it("returns no commands when the pointer is inactive", () => {
    expect(
      commandsFromPointer({
        active: false,
        center: { x: 200, y: 200 },
        pointer: { x: 300, y: 200 }
      })
    ).toEqual([]);
  });

  it("scales short pointer drags to gentle thrust", () => {
    expect(
      commandsFromPointer({
        active: true,
        center: { x: 200,
          y: 200 },
        pointer: { x: 230, y: 200 }
      })
    ).toEqual([
      { type: "AIM", angle: 0 },
      { type: "THRUST", amount: 0.3 }
    ]);
  });
});
