import type { PlayerCommand } from "@astro-courier/shared";

const turnStep = 0.11;
const pointerDeadZone = 10;
const fullThrustDistance = 100;

export type ScreenPoint = {
  x: number;
  y: number;
};

export type PointerCommandInput = {
  active: boolean;
  center: ScreenPoint;
  pointer: ScreenPoint;
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

export class KeyboardInput {
  private readonly target: Window;
  private readonly pressed = new Set<string>();
  private pointerTarget?: HTMLElement;
  private pointerActive = false;
  private pointer: ScreenPoint = { x: 0, y: 0 };

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
  }

  commands(currentRotation: number): PlayerCommand[] {
    const commands: PlayerCommand[] = [];

    if (this.isDown("ArrowLeft") || this.isDown("KeyA")) {
      commands.push({ type: "AIM", angle: currentRotation - turnStep });
    }
    if (this.isDown("ArrowRight") || this.isDown("KeyD")) {
      commands.push({ type: "AIM", angle: currentRotation + turnStep });
    }
    if (this.isDown("ArrowUp") || this.isDown("KeyW") || this.isDown("Space")) {
      commands.push({ type: "THRUST", amount: 1 });
    }
    if (this.isDown("ArrowDown") || this.isDown("KeyS") || this.isDown("ShiftLeft") || this.isDown("ShiftRight")) {
      commands.push({ type: "BRAKE", amount: 0.65 });
    }

    return [...commands, ...this.pointerCommands()];
  }

  private isDown(code: string): boolean {
    return this.pressed.has(code);
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (isGameKey(event.code)) {
      event.preventDefault();
      this.pressed.add(event.code);
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
  };

  private readonly handlePointerDown = (event: PointerEvent) => {
    this.pointerActive = true;
    this.pointer = { x: event.clientX, y: event.clientY };
    this.pointerTarget?.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent) => {
    if (!this.pointerActive) return;
    this.pointer = { x: event.clientX, y: event.clientY };
  };

  private readonly handlePointerUp = () => {
    this.pointerActive = false;
  };

  private pointerCommands(): PlayerCommand[] {
    if (!this.pointerTarget) {
      return [];
    }

    const rect = this.pointerTarget.getBoundingClientRect();
    return commandsFromPointer({
      active: this.pointerActive,
      center: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      },
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
    code === "ShiftLeft" ||
    code === "ShiftRight"
  );
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
