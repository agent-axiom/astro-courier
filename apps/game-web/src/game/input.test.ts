import { describe, expect, it } from "vitest";
import { KeyboardInput, commandsFromGamepadState, commandsFromKeyboardState, commandsFromPointer } from "./input";

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
        center: { x: 200, y: 200 },
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

  it("queues fire once per keyboard press", () => {
    const target = new FakeKeyboardTarget();
    const input = new KeyboardInput(target as unknown as Window);
    input.attach();

    target.dispatch("keydown", "KeyJ");

    expect(input.commands(0)).toEqual([{ type: "FIRE" }]);
    expect(input.commands(0)).toEqual([]);

    target.dispatch("keydown", "KeyJ");

    expect(input.commands(0)).toEqual([]);

    target.dispatch("keyup", "KeyJ");
    target.dispatch("keydown", "Enter");

    expect(input.commands(0)).toEqual([{ type: "FIRE" }]);
  });
});

describe("gamepad input mapping", () => {
  it("maps the left stick to aim and proportional thrust", () => {
    expect(
      commandsFromGamepadState(
        {
          axes: [0, -0.5],
          buttons: []
        },
        0
      )
    ).toEqual([
      { type: "AIM", angle: -Math.PI / 2 },
      { type: "THRUST", amount: 0.5 }
    ]);
  });

  it("maps right trigger pressure to analog thrust without requiring stick drift", () => {
    expect(
      commandsFromGamepadState(
        {
          axes: [0, 0],
          buttons: gamepadButtons({ 7: { pressed: true, value: 0.62 } })
        },
        Math.PI / 2
      )
    ).toEqual([{ type: "THRUST", amount: 0.62 }]);
  });

  it("ignores low analog trigger noise from gamepad thrust and brake controls", () => {
    expect(
      commandsFromGamepadState(
        {
          axes: [0, 0],
          buttons: gamepadButtons({
            6: { pressed: false, value: 0.04 },
            7: { pressed: false, value: 0.03 }
          })
        },
        0
      )
    ).toEqual([]);
  });

  it("keeps digital trigger buttons usable when no analog value is reported", () => {
    expect(
      commandsFromGamepadState(
        {
          axes: [0, 0],
          buttons: gamepadButtons({
            6: { pressed: true },
            7: { pressed: true }
          })
        },
        0
      )
    ).toEqual([
      { type: "THRUST", amount: 1 },
      { type: "BRAKE", amount: 1 }
    ]);
  });

  it("keeps stick aim while letting right trigger control stronger thrust", () => {
    expect(
      commandsFromGamepadState(
        {
          axes: [0, -0.32],
          buttons: gamepadButtons({ 7: { pressed: true, value: 0.82 } })
        },
        0
      )
    ).toEqual([
      { type: "AIM", angle: -Math.PI / 2 },
      { type: "THRUST", amount: 0.82 }
    ]);
  });

  it("maps the right stick to aim without adding thrust", () => {
    expect(
      commandsFromGamepadState(
        {
          axes: [0, 0, 1, 0],
          buttons: []
        },
        Math.PI / 2
      )
    ).toEqual([{ type: "AIM", angle: 0 }]);
  });

  it("lets the right stick aim while the left stick controls thrust strength", () => {
    expect(
      commandsFromGamepadState(
        {
          axes: [0, -0.72, 1, 0],
          buttons: []
        },
        0
      )
    ).toEqual([
      { type: "AIM", angle: 0 },
      { type: "THRUST", amount: 0.72 }
    ]);
  });

  it("maps analog trigger pressure to brake strength", () => {
    expect(
      commandsFromGamepadState(
        {
          axes: [0, 0],
          buttons: gamepadButtons({ 6: { pressed: true, value: 0.7 } })
        },
        Math.PI / 2
      )
    ).toEqual([{ type: "BRAKE", amount: 0.7 }]);
  });

  it("queues gamepad boost once per face-button press", () => {
    const target = new FakeGamepadTarget();
    const input = new KeyboardInput(target as unknown as Window);
    input.attach();

    target.setGamepads([{ axes: [0, 0], buttons: [{ pressed: true, value: 1 }] }]);

    expect(input.commands(0)).toEqual([{ type: "BOOST" }]);
    expect(input.commands(0)).toEqual([]);

    target.setGamepads([{ axes: [0, 0], buttons: [{ pressed: false, value: 0 }] }]);
    expect(input.commands(0)).toEqual([]);

    target.setGamepads([{ axes: [0, 0], buttons: [{ pressed: true, value: 1 }] }]);
    expect(input.commands(0)).toEqual([{ type: "BOOST" }]);
  });

  it("queues gamepad fire once per secondary face-button press", () => {
    const target = new FakeGamepadTarget();
    const input = new KeyboardInput(target as unknown as Window);
    input.attach();

    target.setGamepads([{ axes: [0, 0], buttons: gamepadButtons({ 2: { pressed: true, value: 1 } }) }]);

    expect(input.commands(0)).toEqual([{ type: "FIRE" }]);
    expect(input.commands(0)).toEqual([]);

    target.setGamepads([{ axes: [0, 0], buttons: gamepadButtons({ 2: { pressed: false, value: 0 } }) }]);
    expect(input.commands(0)).toEqual([]);

    target.setGamepads([{ axes: [0, 0], buttons: gamepadButtons({ 2: { pressed: true, value: 1 } }) }]);
    expect(input.commands(0)).toEqual([{ type: "FIRE" }]);
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

function gamepadButtons(
  entries: Record<number, { pressed: boolean; value?: number }>
): Array<{ pressed: boolean; value?: number }> {
  const highestIndex = Math.max(...Object.keys(entries).map(Number));
  return Array.from({ length: highestIndex + 1 }, (_, index) => {
    return entries[index] ?? { pressed: false, value: 0 };
  });
}

class FakeGamepadTarget extends FakeKeyboardTarget {
  readonly navigator = {
    getGamepads: () => this.gamepads
  };

  private gamepads: Array<{ axes: number[]; buttons: Array<{ pressed: boolean; value?: number }> } | null> = [];

  setGamepads(gamepads: Array<{ axes: number[]; buttons: Array<{ pressed: boolean; value?: number }> } | null>): void {
    this.gamepads = gamepads;
  }
}
