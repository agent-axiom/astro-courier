import starterRoute from "@astro-courier/content/data/systems/starter-route.json";
import { validateSystemContent } from "@astro-courier/content";
import { createAstroPixiRenderer, type AstroPixiRenderer } from "@astro-courier/renderer-pixi";
import {
  createWorldFromSystem,
  predictTrajectory,
  snapshotWorld,
  stepWorld,
  summarizeRun,
  type SimulationWorld
} from "@astro-courier/simulation";
import type { PlayerCommand, RunStatus } from "@astro-courier/shared";
import { KeyboardInput } from "./input";

export type HudState = {
  status: RunStatus;
  contractTitle: string;
  elapsedSeconds: number;
  score: number;
  fuel: number;
  maxFuel: number;
  cargoDamage: number;
  speed: number;
  landingRating?: string;
};

export type GameShellOptions = {
  mount: HTMLElement;
  onHud: (hud: HudState) => void;
};

const fixedDt = 1 / 60;
const maxSubSteps = 5;

export class GameShell {
  private readonly mount: HTMLElement;
  private readonly onHud: (hud: HudState) => void;
  private readonly renderer: AstroPixiRenderer;
  private readonly input: KeyboardInput;
  private world: SimulationWorld;
  private rafId = 0;
  private accumulator = 0;
  private lastTime = 0;
  private hudTimer = 0;
  private paused = false;

  constructor(options: GameShellOptions) {
    this.mount = options.mount;
    this.onHud = options.onHud;
    this.renderer = createAstroPixiRenderer();
    this.input = new KeyboardInput(window);
    this.world = this.createFreshWorld();
  }

  async start(): Promise<void> {
    await this.renderer.mount(this.mount);
    this.input.attach();
    this.publishHud();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  restart(): void {
    this.paused = false;
    this.accumulator = 0;
    this.hudTimer = 0;
    this.world = this.createFreshWorld();
    this.publishHud();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (this.world.status === "flying" || this.world.status === "paused") {
      this.world.status = paused ? "paused" : "flying";
    }
    this.publishHud();
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.input.detach();
    this.renderer.destroy();
  }

  private readonly frame = (timestamp: number) => {
    const rawDelta = Math.min(0.1, Math.max(0, (timestamp - this.lastTime) / 1000));
    this.lastTime = timestamp;

    if (!this.paused && this.world.status === "flying") {
      this.accumulator += rawDelta;
      let subSteps = 0;

      while (this.accumulator >= fixedDt && subSteps < maxSubSteps) {
        stepWorld(this.world, fixedDt, this.input.commands(this.world.ship.rotation));
        this.accumulator -= fixedDt;
        subSteps += 1;
      }

      if (subSteps === maxSubSteps && this.accumulator >= fixedDt) {
        this.accumulator = 0;
      }
    }

    const trajectory = this.world.status === "flying" ? predictTrajectory(this.world, { seconds: 3, fixedDt, sampleEvery: 6 }) : [];
    this.renderer.render(snapshotWorld(this.world), trajectory);

    this.hudTimer += rawDelta;
    if (this.hudTimer >= 0.1 || this.world.status !== "flying") {
      this.publishHud();
      this.hudTimer = 0;
    }

    this.rafId = requestAnimationFrame(this.frame);
  };

  private createFreshWorld(): SimulationWorld {
    const system = validateSystemContent(starterRoute);
    return createWorldFromSystem(system, "local-starter-seed");
  }

  private publishHud(): void {
    const result = summarizeRun(this.world);
    this.onHud({
      status: this.world.status,
      contractTitle: this.world.activeContract.title,
      elapsedSeconds: result.elapsedSeconds,
      score: result.score,
      fuel: this.world.ship.fuel,
      maxFuel: this.world.ship.maxFuel,
      cargoDamage: result.cargoDamage,
      speed: Math.hypot(this.world.ship.velocity.x, this.world.ship.velocity.y),
      landingRating: result.landingRating
    });
  }
}

export type CommandProducer = (rotation: number) => PlayerCommand[];

