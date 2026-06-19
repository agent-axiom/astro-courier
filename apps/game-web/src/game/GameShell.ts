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
  InputFrame,
  LandingGuidanceStatus,
  ObjectivePhase,
  PlayerCommand,
  PlayerPerkId,
  ReplayEnvelope,
  RunGrade,
  RunMedal,
  RunResultSummary,
  RunStatus,
  ScoreBreakdown,
  Vec2
} from "@astro-courier/shared";
import { KeyboardInput, type InputSource } from "./input";
import { calculateContractPace, type ContractPaceTier } from "./pace";
import { normalizeAngle } from "./bearing";
import { forecastTrajectoryHazardRisk, type TrajectoryRiskForecast, type TrajectoryRiskLevel } from "./trajectoryRisk";
import type { EnemyDirectorClient, EnemyDirectorResult } from "./enemyDirector";

export type HudState = {
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  replaySeed: string;
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
  shipHp: number;
  shipMaxHp: number;
  weaponCooldownSeconds: number;
  interceptorCount: number;
  enemyDirectorMode: "local" | "openai" | "fallback";
  fuelUsed: number;
  boostCooldownSeconds: number;
  cargoDamage: number;
  cargoOnboard: boolean;
  emergencyShieldAvailable: boolean;
  manualBrakeUsed: boolean;
  speed: number;
  targetDistance?: number;
  targetAllowedSpeed?: number;
  targetAngleError?: number;
  targetRequiredAngleTolerance?: number;
  targetRelativeBearing?: number;
  landingStatus?: LandingGuidanceStatus;
  perfectDockReady?: boolean;
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
  launchBurstSecondsRemaining: number;
  hazardDangerLevel?: "near" | "inside";
  hazardDistance?: number;
  hazardSeverity?: number;
  trajectoryRiskLevel?: TrajectoryRiskLevel;
  trajectoryRiskSeconds?: number;
  trajectoryRiskClearance?: number;
  runTrail: Vec2[];
  gravitySlingDistance?: number;
  gravitySlingReady?: boolean;
  gravitySlingSpeedThreshold?: number;
  gravitySlingStyleBonus?: number;
  activePerk: PlayerPerkId;
  perkOptions: PerkOption[];
  riskGateCount: number;
  clearedRiskGateCount: number;
  nextRiskGateDistance?: number;
  nextRiskGateSpeedThreshold?: number;
  nextRiskGateStyleBonus?: number;
  replayFrameCount: number;
  replayChecksum?: string;
};

export type PerkOption = {
  id: PlayerPerkId;
  label: string;
  shortLabel: string;
  summary: string;
  stat: string;
  tone: "boost" | "guard" | "shot" | "dock";
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
  enemyDirector?: EnemyDirectorClient;
  initialPaused?: boolean;
};

export type ContractSelectionOptions = {
  replaySeed?: string;
};

const fixedDt = 1 / 60;
const maxSubSteps = 5;
const milestoneHoldSeconds = 1.2;
const trajectoryPreviewSeconds = 3;
const trajectorySampleEvery = 6;
const trajectorySampleIntervalSeconds = fixedDt * trajectorySampleEvery;
const minRunTrailSampleDistance = 0.5;
const maxRunTrailSamples = 140;
const enemyDirectorPollIntervalSeconds = 2.5;
const gameVersion = "0.1.0";
const localReplaySeed = "local-starter-seed";
const perkOptionList: PerkOption[] = [
  {
    id: "afterburner",
    label: "Afterburner",
    shortLabel: "Boost",
    summary: "Fast boost",
    stat: "+33% burst",
    tone: "boost"
  },
  {
    id: "shield-crate",
    label: "Shield Crate",
    shortLabel: "Shield",
    summary: "Safer hull",
    stat: "125 HP",
    tone: "guard"
  },
  {
    id: "pulse-shot",
    label: "Pulse Shot",
    shortLabel: "Pulse",
    summary: "Charged opener",
    stat: "42 dmg",
    tone: "shot"
  },
  {
    id: "magnet-clamp",
    label: "Magnet Clamp",
    shortLabel: "Magnet",
    summary: "Easy pickup",
    stat: "Wide grab",
    tone: "dock"
  }
];

export class GameShell {
  private readonly mount: HTMLElement;
  private readonly onHud: (hud: HudState) => void;
  private readonly renderer: AstroPixiRenderer;
  private readonly input: InputSource;
  private readonly enemyDirector?: EnemyDirectorClient;
  private readonly system = validateSystemContent(starterRoute);
  private readonly contractOptionList = this.system.contracts.map((contract) => this.contractOption(contract));
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
  private readonly inputFrames: InputFrame[] = [];
  private runTrail: Vec2[] = [];
  private ghostTrail: Vec2[] = [];
  private selectedContractId?: string;
  private replaySeed = localReplaySeed;
  private enemyDirectorResult?: EnemyDirectorResult;
  private enemyDirectorPollSeconds = 0;
  private enemyDirectorRequestInFlight = false;
  private selectedPerkId: PlayerPerkId = "afterburner";
  private destroyed = false;

  constructor(options: GameShellOptions) {
    this.mount = options.mount;
    this.onHud = options.onHud;
    this.renderer = options.renderer ?? createAstroPixiRenderer();
    this.input = options.input ?? new KeyboardInput(window);
    this.enemyDirector = options.enemyDirector;
    this.paused = Boolean(options.initialPaused);
    this.world = this.createFreshWorld();
    this.resetRunTrail();
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
    this.enemyDirectorResult = undefined;
    this.enemyDirectorPollSeconds = 0;
    this.enemyDirectorRequestInFlight = false;
    this.queuedCommands.length = 0;
    this.inputFrames.length = 0;
    this.lastTime = performance.now();
    this.world = this.createFreshWorld();
    this.resetRunTrail();
    this.publishHud();
  }

  selectContract(contractId: string, options: ContractSelectionOptions = {}): void {
    if (this.destroyed || this.world.status !== "paused") {
      return;
    }
    if (!this.system.contracts.some((contract) => contract.id === contractId)) {
      throw new Error(`Unknown contract "${contractId}"`);
    }

    this.selectedContractId = contractId;
    this.replaySeed = options.replaySeed ?? localReplaySeed;
    this.paused = true;
    this.accumulator = 0;
    this.hudTimer = 0;
    this.retainedMilestone = undefined;
    this.retainedStyleAward = undefined;
    this.retainedMilestoneTimer = 0;
    this.latestTrajectoryRisk = undefined;
    this.enemyDirectorResult = undefined;
    this.enemyDirectorPollSeconds = 0;
    this.enemyDirectorRequestInFlight = false;
    this.queuedCommands.length = 0;
    this.inputFrames.length = 0;
    this.lastTime = performance.now();
    this.world = this.createFreshWorld();
    this.resetRunTrail();
    this.publishHud();
  }

  selectPerk(perkId: PlayerPerkId): void {
    if (this.destroyed || this.world.status !== "paused") {
      return;
    }
    if (!perkOptionList.some((perk) => perk.id === perkId)) {
      throw new Error(`Unknown perk "${perkId}"`);
    }

    this.selectedPerkId = perkId;
    this.paused = true;
    this.accumulator = 0;
    this.hudTimer = 0;
    this.retainedMilestone = undefined;
    this.retainedStyleAward = undefined;
    this.retainedMilestoneTimer = 0;
    this.latestTrajectoryRisk = undefined;
    this.enemyDirectorResult = undefined;
    this.enemyDirectorPollSeconds = 0;
    this.enemyDirectorRequestInFlight = false;
    this.queuedCommands.length = 0;
    this.inputFrames.length = 0;
    this.lastTime = performance.now();
    this.world = this.createFreshWorld();
    this.resetRunTrail();
    this.publishHud();
  }

  setReplaySeed(replaySeed: string): void {
    if (this.destroyed || this.world.status !== "paused") {
      return;
    }

    this.replaySeed = replaySeed;
    this.restart(true);
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

  setGhostTrail(trail: readonly Vec2[]): void {
    this.ghostTrail = trail.map((point) => ({ x: point.x, y: point.y }));
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
        const commands = [...this.input.commands(this.world.ship.rotation), ...this.consumeQueuedCommands()];
        this.recordReplayCommands(commands);
        stepWorld(this.world, fixedDt, commands, this.enemyDirectorStepOptions());
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
    this.renderer.render(snapshot, trajectory, this.ghostTrail);
    this.pollEnemyDirector(rawDelta);

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

  private recordReplayCommands(commands: PlayerCommand[]): void {
    for (const command of commands) {
      this.inputFrames.push({
        tick: this.world.tick,
        command
      });
    }
  }

  private enemyDirectorStepOptions():
    | {
        enemyDirectorPolicy: NonNullable<EnemyDirectorResult>["policy"];
        enemyDirectorMode: NonNullable<EnemyDirectorResult>["mode"];
      }
    | undefined {
    if (!this.enemyDirectorResult) {
      return undefined;
    }
    return {
      enemyDirectorPolicy: this.enemyDirectorResult.policy,
      enemyDirectorMode: this.enemyDirectorResult.mode
    };
  }

  private pollEnemyDirector(deltaSeconds: number): void {
    if (!this.enemyDirector || this.destroyed || this.world.status !== "flying") {
      return;
    }
    if (this.enemyDirectorRequestInFlight) {
      return;
    }
    this.enemyDirectorPollSeconds = Math.max(0, this.enemyDirectorPollSeconds - deltaSeconds);
    if (this.enemyDirectorPollSeconds > 0) {
      return;
    }

    this.enemyDirectorPollSeconds = enemyDirectorPollIntervalSeconds;
    this.enemyDirectorRequestInFlight = true;
    void this.enemyDirector
      .requestPolicy(snapshotWorld(this.world))
      .then((result) => {
        if (!result || this.destroyed) {
          return;
        }
        this.enemyDirectorResult = result;
        this.world.enemyDirectorPolicy = result.policy;
        this.world.enemyDirectorMode = result.mode;
        this.publishHud();
      })
      .finally(() => {
        this.enemyDirectorRequestInFlight = false;
      });
  }

  private resetRunTrail(): void {
    this.runTrail = [{ ...this.world.ship.position }];
  }

  private sampleRunTrail(): void {
    if (this.world.status === "paused") {
      return;
    }

    const current = this.world.ship.position;
    const last = this.runTrail.at(-1);
    if (!last || distanceBetween(last, current) >= minRunTrailSampleDistance || this.world.status !== "flying") {
      this.runTrail.push({ ...current });
      if (this.runTrail.length > maxRunTrailSamples) {
        this.runTrail = this.runTrail.slice(this.runTrail.length - maxRunTrailSamples);
      }
    }
  }

  private createFreshWorld(): SimulationWorld {
    const world = createWorldFromSystem(this.system, this.replaySeed, {
      contractId: this.selectedContractId,
      perkId: this.selectedPerkId
    });
    if (this.paused) {
      world.status = "paused";
    }
    return world;
  }

  private publishHud(): void {
    this.sampleRunTrail();
    const result = summarizeRun(this.world);
    const snapshot = snapshotWorld(this.world);
    const pace = calculateContractPace(result.elapsedSeconds, this.world.activeContract.medalTimes);
    const activeContract = this.contractOption(this.world.activeContract);
    const trajectoryRisk = this.world.status === "flying" ? this.latestTrajectoryRisk : undefined;
    const unclearedRiskGates = snapshot.riskGates.filter((gate) => !gate.cleared);
    const nextRiskGate = unclearedRiskGates
      .map((gate) => ({
        gate,
        distance: distanceBetween(snapshot.ship.position, gate.position)
      }))
      .sort((left, right) => left.distance - right.distance)[0];
    const perfectDockReady =
      snapshot.objectiveTarget === undefined
        ? undefined
        : snapshot.objectiveTarget.landingStatus === "ready" &&
          snapshot.objectiveTarget.speed <= snapshot.objectiveTarget.allowedApproachSpeed * 0.45 &&
          snapshot.objectiveTarget.angleError <= snapshot.objectiveTarget.requiredAngleTolerance * 0.5 &&
          result.cargoDamage <= 0.02;
    const replayChecksum =
      this.world.status === "delivered" || this.world.status === "crashed" ? replayFingerprint(this.createReplayEnvelope(result)) : undefined;
    this.onHud({
      status: this.world.status,
      objectivePhase: this.world.objectivePhase,
      replaySeed: this.world.seed,
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
      shipHp: snapshot.ship.hp,
      shipMaxHp: snapshot.ship.maxHp,
      weaponCooldownSeconds: snapshot.ship.weaponCooldownSeconds,
      interceptorCount: snapshot.enemies.length,
      enemyDirectorMode: snapshot.enemyDirector.mode,
      fuelUsed: result.fuelUsed,
      boostCooldownSeconds: snapshot.ship.boostCooldownSeconds,
      cargoDamage: result.cargoDamage,
      cargoOnboard: this.world.cargoOnboard,
      emergencyShieldAvailable: snapshot.emergencyShieldAvailable,
      manualBrakeUsed: snapshot.manualBrakeUsed,
      speed: Math.hypot(this.world.ship.velocity.x, this.world.ship.velocity.y),
      targetDistance: snapshot.objectiveTarget?.distance,
      targetAllowedSpeed: snapshot.objectiveTarget?.allowedApproachSpeed,
      targetAngleError: snapshot.objectiveTarget?.angleError,
      targetRequiredAngleTolerance: snapshot.objectiveTarget?.requiredAngleTolerance,
      targetRelativeBearing:
        snapshot.objectiveTarget === undefined ? undefined : normalizeAngle(snapshot.objectiveTarget.bearing - this.world.ship.rotation),
      landingStatus: snapshot.objectiveTarget?.landingStatus,
      perfectDockReady,
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
      launchBurstSecondsRemaining: snapshot.launchBurstSecondsRemaining,
      hazardDangerLevel: snapshot.nearestHazard?.dangerLevel,
      hazardDistance: snapshot.nearestHazard?.distance,
      hazardSeverity: snapshot.nearestHazard?.severity,
      gravitySlingDistance: snapshot.gravitySlingOpportunity?.distance,
      gravitySlingReady: snapshot.gravitySlingOpportunity?.ready,
      gravitySlingSpeedThreshold: snapshot.gravitySlingOpportunity?.speedThreshold,
      gravitySlingStyleBonus: snapshot.gravitySlingOpportunity?.styleBonus,
      activePerk: snapshot.activePerk,
      perkOptions: perkOptionList,
      riskGateCount: snapshot.riskGates.length,
      clearedRiskGateCount: snapshot.riskGates.length - unclearedRiskGates.length,
      nextRiskGateDistance: nextRiskGate ? Math.round(nextRiskGate.distance) : undefined,
      nextRiskGateSpeedThreshold: nextRiskGate?.gate.speedThreshold,
      nextRiskGateStyleBonus: nextRiskGate?.gate.styleBonus,
      trajectoryRiskLevel: trajectoryRisk?.level,
      trajectoryRiskSeconds: trajectoryRisk?.seconds,
      trajectoryRiskClearance: trajectoryRisk?.clearance,
      runTrail: this.runTrail.map((point) => ({ ...point })),
      replayFrameCount: this.inputFrames.length,
      replayChecksum
    });
  }

  private createReplayEnvelope(result: RunResultSummary): ReplayEnvelope {
    return {
      gameVersion,
      contentVersion: this.world.contentVersion,
      systemId: this.world.systemId,
      contractId: this.world.contractId,
      rngSeed: this.world.seed,
      shipConfig: {
        hull: "starter",
        upgrades: [this.world.activePerk]
      },
      inputFrames: this.inputFrames.map((frame) => ({
        tick: frame.tick,
        command: { ...frame.command }
      })),
      result
    };
  }

  private contractOptions(): ContractOption[] {
    return this.contractOptionList;
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

function replayFingerprint(replay: ReplayEnvelope): string {
  return `rc-${fnv1a64(canonicalJson(replay)).slice(0, 12)}`;
}

function distanceBetween(left: Vec2, right: Vec2): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)])
    );
  }

  return value;
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}
