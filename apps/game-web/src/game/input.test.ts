import { describe, expect, it } from "vitest";
import { KeyboardInput, commandsFromKeyboardState, commandsFromPointer } from "./input";

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

describe("keyboard input mapping", () => {
  it("maps held flight keys to continuous commands", () => {
    expect(commandsFromKeyboardState(new Set(["KeyW", "ShiftLeft"]), Math.PI / 2)).toEqual([
      { type: "THRUST", amount: 1 },
      { type: "BRAKE", amount: 0.65 }
    ]);
  });

  it("queues boost once per key press instead of every frame", () => {
    const target = new FakeKeyboardTarget();
    const input = new KeyboardInput(target as unknown as Window);
    input.attach();

    target.dispatch("keydown", "KeyE");

    expect(input.commands(Math.PI / 2)).toEqual([{ type: "BOOST" }]);
    expect(input.commands(Math.PI / 2)).toEqual([]);

    target.dispatch("keydown", "KeyE");

    expect(input.commands(Math.PI / 2)).toEqual([]);

    target.dispatch("keyup", "KeyE");
    target.dispatch("keydown", "KeyE");

    expect(input.commands(Math.PI / 2)).toEqual([{ type: "BOOST" }]);
  });
});

type KeyboardListener = (event: { code: string; preventDefault: () => void }) => void;

class FakeKeyboardTarget {
  private readonly listeners = new Map<string, Set<KeyboardListener>>();

  addEventListener(type: string, listener: KeyboardListener): void {
    const listeners = this.listeners.get(type) ?? new Set<KeyboardListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: KeyboardListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string, code: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ code, preventDefault: () => undefined });
    }
  }
}
