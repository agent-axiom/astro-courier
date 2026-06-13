import type { PlayerCommand } from "@astro-courier/shared";

const turnStep = 0.11;

export class KeyboardInput {
  private readonly target: Window;
  private readonly pressed = new Set<string>();

  constructor(target: Window) {
    this.target = target;
  }

  attach(): void {
    this.target.addEventListener("keydown", this.handleKeyDown);
    this.target.addEventListener("keyup", this.handleKeyUp);
    this.target.addEventListener("blur", this.handleBlur);
  }

  detach(): void {
    this.target.removeEventListener("keydown", this.handleKeyDown);
    this.target.removeEventListener("keyup", this.handleKeyUp);
    this.target.removeEventListener("blur", this.handleBlur);
    this.pressed.clear();
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

    return commands;
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
  };
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

