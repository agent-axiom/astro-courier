import starterRoute from "@astro-courier/content/data/systems/starter-route.json";
import { validateSystemContent } from "@astro-courier/content";
import { createAstroPixiRenderer, type AstroPixiRenderer } from "@astro-courier/renderer-pixi";
import {
  QUICK_PICKUP_STYLE_BONUS,
  QUICK_PICKUP_WINDOW_SECONDS,
  createWorldFromSystem,
  predictTrajectory,
  snapshotWorld,
  stepWorld,
  summarizeRun,
  type CargoContent,
  type ContractContent,
  type SimulationWorld
} from "@astro-courier/simulation";
import type {
  CrashReason,
  LandingGuidanceStatus,
  ObjectivePhase,
  PlayerCommand,
  RunGrade,
  RunMedal,
  RunStatus,
  ScoreBreakdown
} from "@astro-courier/shared";
import { KeyboardInput, type InputSource } from "./input";
import { calculateContractPace, type ContractPaceTier } from "./pace";
import { normalizeAngle } from "./bearing";
import { forecastTrajectoryHazardRisk, type TrajectoryRiskForecast, type TrajectoryRiskLevel } from "./trajectoryRisk";

export type HudState = {
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  contractId: string;
  contractTitle: string;
  contractBriefing: string;
  contractRiskLabel: string;
  contractRewardLabel: string;
  pickupLabel: string;
  destinationLabel: string;
  cargoName: string;
  cargoKind: string;
  cargoFragility: number;
  hazardSeverityMultiplier?: number;
  contractOptions: ContractOption[];
  elapsedSeconds: number;
  score: number;
  fuel: number;
  maxFuel: number;
  boostCooldownSeconds: number;
  cargoDamage: number;
  cargoOnboard: boolean;
  speed: number;
  targetDistance?: number;
  targetAllowedSpeed?: number;
  targetRelativeBearing?: number;
  landingStatus?: LandingGuidanceStatus;
  assistAvailable?: boolean;
  lastMilestone?: string;
  lastStyleAward?: number;
  medal: RunMedal;
  grade: RunGrade;
  landingRating?: string;
  crashReason?: CrashReason;
  scoreBreakdown: ScoreBreakdown;
  paceTier: ContractPaceTier;
  paceSecondsRemaining: number;
  quickPickupSecondsRemaining: number;
  quickPickupBonus: number;
  approachStreakSeconds: number;
  bestApproachStreakSeconds: number;
  styleChainCount: number;
  styleChainSecondsRemaining: number;
  styleMultiplier: number;
  hazardDangerLevel?: "near" | "inside";
  hazardDistance?: number;
  hazardSeverity?: number;
  trajectoryRiskLevel?: TrajectoryRiskLevel;
  trajectoryRiskSeconds?: number;
};

export type ContractOption = Pick<ContractContent, "id" | "title" | "briefing" | "riskLabel" | "rewardLabel" | "medalTimes"> & {
  pickupLabel: string;
  destinationLabel: string;
  cargoName: string;
  cargoKind: string;
  cargoFragility: number;
  hazardSeverityMultiplier?: number;
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
const trajectoryPreviewSeconds = 3;
const trajectorySampleEvery = 6;
const trajectorySampleIntervalSeconds = fixedDt * trajectorySampleEvery;

export class GameShell {
  private readonly mount: HTMLElement;
  private readonly onHud: (hud: HudState) => void;
  private readonly renderer: AstroPixiRenderer;
  private readonly input: InputSource;
  private readonly system = validateSystemContent(starterRoute);
  private world: SimulationWorld;
  private rafId = 0;
  private accumulator = 0;
  private lastTime = 0;
  private hudTimer = 0;
  private paused = false;
  private retainedMilestone?: string;
  private retainedStyleAward?: number;
  private retainedMilestoneTimer = 0;
  private latestTrajectoryRisk?: TrajectoryRiskForecast;
  private readonly queuedCommands: PlayerCommand[] = [];
  private selectedContractId?: string;
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
    this.retainedStyleAward = undefined;
    this.retainedMilestoneTimer = 0;
    this.latestTrajectoryRisk = undefined;
    this.queuedCommands.length = 0;
    this.lastTime = performance.now();
    this.world = this.createFreshWorld();
    this.publishHud();
  }

  selectContract(contractId: string): void {
    if (this.destroyed || this.world.status !== "paused") {
      return;
    }
    if (!this.system.contracts.some((contract) => contract.id === contractId)) {
      throw new Error(`Unknown contract "${contractId}"`);
    }

    this.selectedContractId = contractId;
    this.paused = true;
    this.accumulator = 0;
    this.hudTimer = 0;
    this.retainedMilestone = undefined;
    this.retainedStyleAward = undefined;
    this.retainedMilestoneTimer = 0;
    this.latestTrajectoryRisk = undefined;
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
          this.retainedStyleAward = this.world.lastStyleAward;
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
          this.retainedStyleAward = undefined;
        }
      }
    }

    const trajectory =
      this.world.status === "flying"
        ? predictTrajectory(this.world, { seconds: trajectoryPreviewSeconds, fixedDt, sampleEvery: trajectorySampleEvery })
        : [];
    const snapshot = snapshotWorld(this.world);
    this.latestTrajectoryRisk = forecastTrajectoryHazardRisk({
      status: snapshot.status,
      trajectory,
      hazards: snapshot.hazards,
      sampleIntervalSeconds: trajectorySampleIntervalSeconds
    });
    this.renderer.render(snapshot, trajectory);

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
    const world = createWorldFromSystem(this.system, "local-starter-seed", { contractId: this.selectedContractId });
    if (this.paused) {
      world.status = "paused";
    }
    return world;
  }

  private publishHud(): void {
    const result = summarizeRun(this.world);
    const snapshot = snapshotWorld(this.world);
    const pace = calculateContractPace(result.elapsedSeconds, this.world.activeContract.medalTimes);
    const activeContract = this.contractOption(this.world.activeContract);
    const trajectoryRisk = this.world.status === "flying" ? this.latestTrajectoryRisk : undefined;
    this.onHud({
      status: this.world.status,
      objectivePhase: this.world.objectivePhase,
      contractId: this.world.contractId,
      contractTitle: activeContract.title,
      contractBriefing: activeContract.briefing,
      contractRiskLabel: activeContract.riskLabel,
      contractRewardLabel: activeContract.rewardLabel,
      pickupLabel: activeContract.pickupLabel,
      destinationLabel: activeContract.destinationLabel,
      cargoName: activeContract.cargoName,
      cargoKind: activeContract.cargoKind,
      cargoFragility: activeContract.cargoFragility,
      hazardSeverityMultiplier: activeContract.hazardSeverityMultiplier,
      contractOptions: this.contractOptions(),
      elapsedSeconds: result.elapsedSeconds,
      score: result.score,
      fuel: this.world.ship.fuel,
      maxFuel: this.world.ship.maxFuel,
      boostCooldownSeconds: snapshot.ship.boostCooldownSeconds,
      cargoDamage: result.cargoDamage,
      cargoOnboard: this.world.cargoOnboard,
      speed: Math.hypot(this.world.ship.velocity.x, this.world.ship.velocity.y),
      targetDistance: snapshot.objectiveTarget?.distance,
      targetAllowedSpeed: snapshot.objectiveTarget?.allowedApproachSpeed,
      targetRelativeBearing:
        snapshot.objectiveTarget === undefined ? undefined : normalizeAngle(snapshot.objectiveTarget.bearing - this.world.ship.rotation),
      landingStatus: snapshot.objectiveTarget?.landingStatus,
      assistAvailable: snapshot.objectiveTarget?.assistAvailable,
      lastMilestone: this.world.lastMilestone ?? this.retainedMilestone,
      lastStyleAward: this.world.lastStyleAward ?? this.retainedStyleAward,
      medal: result.medal,
      grade: result.grade,
      landingRating: result.landingRating,
      crashReason: result.crashReason,
      scoreBreakdown: result.scoreBreakdown,
      paceTier: pace.tier,
      paceSecondsRemaining: pace.secondsRemaining,
      quickPickupSecondsRemaining: this.quickPickupSecondsRemaining(result.elapsedSeconds),
      quickPickupBonus: QUICK_PICKUP_STYLE_BONUS,
      approachStreakSeconds: snapshot.approachStreakSeconds,
      bestApproachStreakSeconds: snapshot.bestApproachStreakSeconds,
      styleChainCount: snapshot.styleChainCount,
      styleChainSecondsRemaining: snapshot.styleChainSecondsRemaining,
      styleMultiplier: snapshot.styleMultiplier,
      hazardDangerLevel: snapshot.nearestHazard?.dangerLevel,
      hazardDistance: snapshot.nearestHazard?.distance,
      hazardSeverity: snapshot.nearestHazard?.severity,
      trajectoryRiskLevel: trajectoryRisk?.level,
      trajectoryRiskSeconds: trajectoryRisk?.seconds
    });
  }

  private contractOptions(): ContractOption[] {
    return this.system.contracts.map((contract) => this.contractOption(contract));
  }

  private contractOption(contract: ContractContent): ContractOption {
    const cargo = this.cargoFor(contract.cargoId);
    return {
      id: contract.id,
      title: contract.title,
      briefing: contract.briefing,
      riskLabel: contract.riskLabel,
      rewardLabel: contract.rewardLabel,
      pickupLabel: this.padLabel(contract.pickupId),
      destinationLabel: this.padLabel(contract.destinationId),
      cargoName: cargo?.name ?? titleFromId(contract.cargoId),
      cargoKind: cargo?.kind ?? "unknown",
      cargoFragility: cargo?.fragility ?? 1,
      ...(contract.hazardSeverityMultiplier === undefined ? {} : { hazardSeverityMultiplier: contract.hazardSeverityMultiplier }),
      medalTimes: contract.medalTimes
    };
  }

  private padLabel(padId: string): string {
    for (const planet of this.system.planets) {
      if (planet.landingPads.some((pad) => pad.id === padId)) {
        return `${planet.name} ${titleFromId(padId)}`;
      }
    }
    for (const station of this.system.stations) {
      if (station.landingPads.some((pad) => pad.id === padId)) {
        return `${station.name} ${titleFromId(padId)}`;
      }
    }
    return titleFromId(padId);
  }

  private cargoFor(cargoId: string): CargoContent | undefined {
    return this.system.cargo.find((cargo) => cargo.id === cargoId);
  }

  private quickPickupSecondsRemaining(elapsedSeconds: number): number {
    if (this.world.objectivePhase !== "pickup") {
      return 0;
    }
    return Math.max(0, QUICK_PICKUP_WINDOW_SECONDS - elapsedSeconds);
  }
}

export type CommandProducer = (rotation: number) => PlayerCommand[];

function titleFromId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
