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
import type { CrashReason, LandingGuidanceStatus, ObjectivePhase, PlayerCommand, RunMedal, RunStatus } from "@astro-courier/shared";
import { KeyboardInput, type InputSource } from "./input";
import { calculateContractPace, type ContractPaceTier } from "./pace";

export type HudState = {
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  contractTitle: string;
  elapsedSeconds: number;
  score: number;
  fuel: number;
  maxFuel: number;
  cargoDamage: number;
  cargoOnboard: boolean;
  speed: number;
  targetDistance?: number;
  landingStatus?: LandingGuidanceStatus;
  assistAvailable?: boolean;
  lastMilestone?: string;
  medal: RunMedal;
  landingRating?: string;
  crashReason?: CrashReason;
  paceTier: ContractPaceTier;
  paceSecondsRemaining: number;
  approachStreakSeconds: number;
  bestApproachStreakSeconds: number;
  hazardDangerLevel?: "near" | "inside";
  hazardDistance?: number;
};

export type GameShellOptions = {
  mount: HTMLElement;
  onHud: (hud: HudState) => void;
  renderer?: AstroPixiRenderer;
  input?: InputSource;
  initialPaused?: boolean;
};

const fixedDt = 1 / 60;
const maxSubSteps = 5;
const milestoneHoldSeconds = 1.2;

export class GameShell {
  private readonly mount: HTMLElement;
  private readonly onHud: (hud: HudState) => void;
  private readonly renderer: AstroPixiRenderer;
  private readonly input: InputSource;
  private world: SimulationWorld;
  private rafId = 0;
  private accumulator = 0;
  private lastTime = 0;
  private hudTimer = 0;
  private paused = false;
  private retainedMilestone?: string;
  private retainedMilestoneTimer = 0;
  private readonly queuedCommands: PlayerCommand[] = [];
  private destroyed = false;

  constructor(options: GameShellOptions) {
    this.mount = options.mount;
    this.onHud = options.onHud;
    this.renderer = options.renderer ?? createAstroPixiRenderer();
    this.input = options.input ?? new KeyboardInput(window);
    this.paused = Boolean(options.initialPaused);
    this.world = this.createFreshWorld();
  }

  async start(): Promise<void> {
    await this.renderer.mount(this.mount);
    if (this.destroyed) {
      return;
    }
    this.input.attach(this.mount);
    this.publishHud();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  restart(paused = false): void {
    if (this.destroyed) {
      return;
    }
    this.paused = paused;
    this.accumulator = 0;
    this.hudTimer = 0;
    this.retainedMilestone = undefined;
    this.retainedMilestoneTimer = 0;
    this.queuedCommands.length = 0;
    this.lastTime = performance.now();
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

  queueCommand(command: PlayerCommand): void {
    if (this.destroyed) {
      return;
    }
    this.queuedCommands.push(command);
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.input.detach();
    this.renderer.destroy();
  }

  private readonly frame = (timestamp: number) => {
    if (this.destroyed) {
      return;
    }
    const rawDelta = Math.min(0.1, Math.max(0, (timestamp - this.lastTime) / 1000));
    this.lastTime = timestamp;

    if (!this.paused && this.world.status === "flying") {
      this.accumulator += rawDelta;
      let subSteps = 0;
      let sawMilestone = false;

      while (this.accumulator >= fixedDt && subSteps < maxSubSteps) {
        stepWorld(this.world, fixedDt, [...this.input.commands(this.world.ship.rotation), ...this.consumeQueuedCommands()]);
        if (this.world.lastMilestone) {
          this.retainedMilestone = this.world.lastMilestone;
          this.retainedMilestoneTimer = milestoneHoldSeconds;
          sawMilestone = true;
        }
        this.accumulator -= fixedDt;
        subSteps += 1;
      }

      if (subSteps === maxSubSteps && this.accumulator >= fixedDt) {
        this.accumulator = 0;
      }

      if (!sawMilestone && this.retainedMilestoneTimer > 0) {
        this.retainedMilestoneTimer = Math.max(0, this.retainedMilestoneTimer - rawDelta);
        if (this.retainedMilestoneTimer === 0) {
          this.retainedMilestone = undefined;
        }
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

  private consumeQueuedCommands(): PlayerCommand[] {
    if (this.queuedCommands.length === 0) {
      return [];
    }
    return this.queuedCommands.splice(0);
  }

  private createFreshWorld(): SimulationWorld {
    const system = validateSystemContent(starterRoute);
    const world = createWorldFromSystem(system, "local-starter-seed");
    if (this.paused) {
      world.status = "paused";
    }
    return world;
  }

  private publishHud(): void {
    const result = summarizeRun(this.world);
    const snapshot = snapshotWorld(this.world);
    const pace = calculateContractPace(result.elapsedSeconds, this.world.activeContract.medalTimes);
    this.onHud({
      status: this.world.status,
      objectivePhase: this.world.objectivePhase,
      contractTitle: this.world.activeContract.title,
      elapsedSeconds: result.elapsedSeconds,
      score: result.score,
      fuel: this.world.ship.fuel,
      maxFuel: this.world.ship.maxFuel,
      cargoDamage: result.cargoDamage,
      cargoOnboard: this.world.cargoOnboard,
      speed: Math.hypot(this.world.ship.velocity.x, this.world.ship.velocity.y),
      targetDistance: snapshot.objectiveTarget?.distance,
      landingStatus: snapshot.objectiveTarget?.landingStatus,
      assistAvailable: snapshot.objectiveTarget?.assistAvailable,
      lastMilestone: this.world.lastMilestone ?? this.retainedMilestone,
      medal: result.medal,
      landingRating: result.landingRating,
      crashReason: result.crashReason,
      paceTier: pace.tier,
      paceSecondsRemaining: pace.secondsRemaining,
      approachStreakSeconds: snapshot.approachStreakSeconds,
      bestApproachStreakSeconds: snapshot.bestApproachStreakSeconds,
      hazardDangerLevel: snapshot.nearestHazard?.dangerLevel,
      hazardDistance: snapshot.nearestHazard?.distance
    });
  }
}

export type CommandProducer = (rotation: number) => PlayerCommand[];
