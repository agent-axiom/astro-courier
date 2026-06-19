import type { PlayerCommand } from "@astro-courier/shared";
import { buildTouchPadGeometry, resolveTouchSteeringOrigin } from "./touchControls";

const turnStep = 0.11;
const pointerDeadZone = 10;
const fullThrustDistance = 100;
const gamepadStickDeadZone = 0.18;
const gamepadTriggerDeadZone = 0.05;
const gamepadBrakeButtonIndex = 6;
const gamepadThrustButtonIndex = 7;
const gamepadBoostButtonIndex = 0;
const gamepadFireButtonIndex = 2;

export type ScreenPoint = {
  x: number;
  y: number;
};

export type PointerCommandInput = {
  active: boolean;
  center: ScreenPoint;
  pointer: ScreenPoint;
};

export type PointerCommandCenterInput = {
  pointerType?: string;
  viewportWidth: number;
  viewportHeight: number;
  targetRect: Pick<DOMRect, "left" | "top" | "width" | "height">;
  touchOrigin?: ScreenPoint;
};

export type GamepadButtonSnapshot = {
  pressed?: boolean;
  value?: number;
};

export type GamepadCommandInput = {
  axes: readonly number[];
  buttons: readonly GamepadButtonSnapshot[];
};

export type InputSource = {
  attach(pointerTarget?: HTMLElement): void;
  detach(): void;
  commands(currentRotation: number): PlayerCommand[];
};

export function commandsFromPointer(input: PointerCommandInput): PlayerCommand[] {
  if (!input.active) {
    return [];
  }

  const dx = input.pointer.x - input.center.x;
  const dy = input.pointer.y - input.center.y;
  const distance = Math.hypot(dx, dy);
  if (distance < pointerDeadZone) {
    return [];
  }

  return [
    { type: "AIM", angle: Math.atan2(dy, dx) },
    { type: "THRUST", amount: round(Math.min(1, distance / fullThrustDistance), 2) }
  ];
}

export function resolvePointerCommandCenter(input: PointerCommandCenterInput): ScreenPoint {
  const shouldUseTouchZone = input.pointerType === "touch" || input.viewportWidth <= 760;
  if (shouldUseTouchZone) {
    const geometry = buildTouchPadGeometry({
      viewportWidth: input.viewportWidth,
      viewportHeight: input.viewportHeight
    });
    return input.touchOrigin ? resolveTouchSteeringOrigin({ geometry, pointer: input.touchOrigin }) : geometry.center;
  }

  return {
    x: input.targetRect.left + input.targetRect.width / 2,
    y: input.targetRect.top + input.targetRect.height / 2
  };
}

export function commandsFromKeyboardState(pressed: ReadonlySet<string>, currentRotation: number): PlayerCommand[] {
  const commands: PlayerCommand[] = [];

  if (isDown(pressed, "ArrowLeft") || isDown(pressed, "KeyA")) {
    commands.push({ type: "AIM", angle: currentRotation - turnStep });
  }
  if (isDown(pressed, "ArrowRight") || isDown(pressed, "KeyD")) {
    commands.push({ type: "AIM", angle: currentRotation + turnStep });
  }
  if (isDown(pressed, "ArrowUp") || isDown(pressed, "KeyW") || isDown(pressed, "Space")) {
    commands.push({ type: "THRUST", amount: 1 });
  }
  if (isDown(pressed, "ArrowDown") || isDown(pressed, "KeyS") || isDown(pressed, "ShiftLeft") || isDown(pressed, "ShiftRight")) {
    commands.push({ type: "BRAKE", amount: 0.65 });
  }
  return commands;
}

export function commandsFromGamepadState(gamepad: GamepadCommandInput, _currentRotation: number): PlayerCommand[] {
  const commands: PlayerCommand[] = [];
  const leftStickX = gamepad.axes[0] ?? 0;
  const leftStickY = gamepad.axes[1] ?? 0;
  const rightStickX = gamepad.axes[2] ?? 0;
  const rightStickY = gamepad.axes[3] ?? 0;
  const leftStickDistance = Math.hypot(leftStickX, leftStickY);
  const rightStickDistance = Math.hypot(rightStickX, rightStickY);
  const aimStickX = rightStickDistance >= gamepadStickDeadZone ? rightStickX : leftStickX;
  const aimStickY = rightStickDistance >= gamepadStickDeadZone ? rightStickY : leftStickY;
  const aimStickDistance = rightStickDistance >= gamepadStickDeadZone ? rightStickDistance : leftStickDistance;
  const thrustAmount = Math.max(
    leftStickDistance >= gamepadStickDeadZone ? leftStickDistance : 0,
    gamepadButtonValue(gamepad.buttons[gamepadThrustButtonIndex])
  );

  if (aimStickDistance >= gamepadStickDeadZone) {
    commands.push({ type: "AIM", angle: Math.atan2(aimStickY, aimStickX) });
  }

  if (thrustAmount > 0) {
    commands.push({ type: "THRUST", amount: round(Math.min(1, thrustAmount), 2) });
  }

  const brakeAmount = gamepadButtonValue(gamepad.buttons[gamepadBrakeButtonIndex]);
  if (brakeAmount > 0) {
    commands.push({ type: "BRAKE", amount: round(brakeAmount, 2) });
  }

  return commands;
}

export class KeyboardInput {
  private readonly target: Window;
  private readonly pressed = new Set<string>();
  private pointerTarget?: HTMLElement;
  private pointerActive = false;
  private boostQueued = false;
  private fireQueued = false;
  private gamepadBoostPressed = false;
  private gamepadFirePressed = false;
  private pointer: ScreenPoint = { x: 0, y: 0 };
  private pointerOrigin?: ScreenPoint;
  private pointerType = "";

  constructor(target: Window) {
    this.target = target;
  }

  attach(pointerTarget?: HTMLElement): void {
    this.pointerTarget = pointerTarget;
    this.target.addEventListener("keydown", this.handleKeyDown);
    this.target.addEventListener("keyup", this.handleKeyUp);
    this.target.addEventListener("blur", this.handleBlur);
    this.target.addEventListener("pointerup", this.handlePointerUp);
    this.target.addEventListener("pointercancel", this.handlePointerUp);
    pointerTarget?.addEventListener("pointerdown", this.handlePointerDown);
    pointerTarget?.addEventListener("pointermove", this.handlePointerMove);
  }

  detach(): void {
    this.target.removeEventListener("keydown", this.handleKeyDown);
    this.target.removeEventListener("keyup", this.handleKeyUp);
    this.target.removeEventListener("blur", this.handleBlur);
    this.target.removeEventListener("pointerup", this.handlePointerUp);
    this.target.removeEventListener("pointercancel", this.handlePointerUp);
    this.pointerTarget?.removeEventListener("pointerdown", this.handlePointerDown);
    this.pointerTarget?.removeEventListener("pointermove", this.handlePointerMove);
    this.pressed.clear();
    this.pointerActive = false;
    this.pointerOrigin = undefined;
    this.boostQueued = false;
    this.fireQueued = false;
    this.gamepadBoostPressed = false;
    this.gamepadFirePressed = false;
  }

  commands(currentRotation: number): PlayerCommand[] {
    const gamepad = this.activeGamepad();
    const commands = [
      ...commandsFromKeyboardState(this.pressed, currentRotation),
      ...this.gamepadCommands(gamepad, currentRotation)
    ];
    if (this.boostQueued) {
      commands.push({ type: "BOOST" });
      this.boostQueued = false;
    }
    if (this.fireQueued) {
      commands.push({ type: "FIRE" });
      this.fireQueued = false;
    }
    if (this.takeGamepadBoost(gamepad)) {
      commands.push({ type: "BOOST" });
    }
    if (this.takeGamepadFire(gamepad)) {
      commands.push({ type: "FIRE" });
    }
    return [...commands, ...this.pointerCommands()];
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (isGameKey(event.code)) {
      event.preventDefault();
      const wasPressed = this.pressed.has(event.code);
      this.pressed.add(event.code);
      if (event.code === "KeyE" && !wasPressed) {
        this.boostQueued = true;
      }
      if ((event.code === "KeyJ" || event.code === "Enter") && !wasPressed) {
        this.fireQueued = true;
      }
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    if (isGameKey(event.code)) {
      event.preventDefault();
      this.pressed.delete(event.code);
    }
  };

  private readonly handleBlur = () => {
    this.pressed.clear();
    this.pointerActive = false;
    this.pointerOrigin = undefined;
    this.boostQueued = false;
    this.fireQueued = false;
    this.gamepadBoostPressed = false;
    this.gamepadFirePressed = false;
  };

  private readonly handlePointerDown = (event: PointerEvent) => {
    this.pointerActive = true;
    this.pointerType = event.pointerType;
    this.pointer = { x: event.clientX, y: event.clientY };
    this.pointerOrigin = event.pointerType === "touch" ? this.pointer : undefined;
    this.pointerTarget?.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent) => {
    if (!this.pointerActive) return;
    this.pointerType = event.pointerType;
    this.pointer = { x: event.clientX, y: event.clientY };
  };

  private readonly handlePointerUp = () => {
    this.pointerActive = false;
    this.pointerOrigin = undefined;
    this.pointerType = "";
  };

  private activeGamepad(): GamepadCommandInput | undefined {
    return [...(this.target.navigator?.getGamepads?.() ?? [])].find(Boolean) ?? undefined;
  }

  private gamepadCommands(gamepad: GamepadCommandInput | undefined, currentRotation: number): PlayerCommand[] {
    return gamepad ? commandsFromGamepadState(gamepad, currentRotation) : [];
  }

  private takeGamepadBoost(gamepad: GamepadCommandInput | undefined): boolean {
    const boostPressed = gamepad ? gamepadButtonValue(gamepad.buttons[gamepadBoostButtonIndex]) > 0 : false;
    const shouldQueue = boostPressed && !this.gamepadBoostPressed;
    this.gamepadBoostPressed = boostPressed;
    return shouldQueue;
  }

  private takeGamepadFire(gamepad: GamepadCommandInput | undefined): boolean {
    const firePressed = gamepad ? gamepadButtonValue(gamepad.buttons[gamepadFireButtonIndex]) > 0 : false;
    const shouldQueue = firePressed && !this.gamepadFirePressed;
    this.gamepadFirePressed = firePressed;
    return shouldQueue;
  }

  private pointerCommands(): PlayerCommand[] {
    if (!this.pointerTarget) {
      return [];
    }

    const rect = this.pointerTarget.getBoundingClientRect();
    return commandsFromPointer({
      active: this.pointerActive,
      center: resolvePointerCommandCenter({
        pointerType: this.pointerType,
        viewportWidth: this.target.innerWidth,
        viewportHeight: this.target.innerHeight,
        targetRect: rect,
        touchOrigin: this.pointerOrigin
      }),
      pointer: this.pointer
    });
  }
}

function isGameKey(code: string): boolean {
  return (
    code === "ArrowLeft" ||
    code === "ArrowRight" ||
    code === "ArrowUp" ||
    code === "ArrowDown" ||
    code === "KeyA" ||
    code === "KeyD" ||
    code === "KeyW" ||
    code === "KeyS" ||
    code === "Space" ||
    code === "KeyE" ||
    code === "KeyJ" ||
    code === "Enter" ||
    code === "ShiftLeft" ||
    code === "ShiftRight"
  );
}

function isDown(pressed: ReadonlySet<string>, code: string): boolean {
  return pressed.has(code);
}

function gamepadButtonValue(button: GamepadButtonSnapshot | undefined): number {
  if (!button) {
    return 0;
  }
  if (button.value !== undefined) {
    const value = Math.min(1, Math.max(0, button.value));
    return value > gamepadTriggerDeadZone ? value : 0;
  }
  return button.pressed ? 1 : 0;
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
