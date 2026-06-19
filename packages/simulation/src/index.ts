import type {
  CrashReason,
  EnemyDirectorPolicy,
  InputFrame,
  LandingRating,
  LandingGuidanceStatus,
  ObjectivePhase,
  PlayerCommand,
  PlayerPerkId,
  ReplayEnvelope,
  RunGrade,
  RunMedal,
  RunResultSummary,
  ScoreBreakdown,
  RunStatus,
  SimulationSnapshot,
  Vec2
} from "@astro-courier/shared";
import type { CommandBuffer } from "@astro-courier/engine";

export type LandingPadContent = {
  id: string;
  position: [number, number];
  normalAngle: number;
  radius: number;
  allowedApproachSpeed: number;
  requiredAngleTolerance: number;
};

export type PlanetContent = {
  id: string;
  name: string;
  position: [number, number];
  radius: number;
  gravityMass: number;
  influenceRadius: number;
  visualTheme: string;
  landingPads: LandingPadContent[];
};

export type StationContent = {
  id: string;
  name: string;
  position: [number, number];
  landingPads: LandingPadContent[];
};

export type HazardContent = {
  id: string;
  type: string;
  position: [number, number];
  radius: number;
  severity: number;
};

export type ContractContent = {
  id: string;
  title: string;
  briefing: string;
  riskLabel: string;
  rewardLabel: string;
  shipStart?: {
    position: [number, number];
    velocity: [number, number];
    rotation: number;
    fuel?: number;
  };
  pickupId: string;
  destinationId: string;
  cargoId: string;
  hazardSeverityMultiplier?: number;
  medalTimes: {
    bronze: number;
    silver: number;
    gold: number;
  };
};

export type CargoContent = {
  id: string;
  name: string;
  kind: string;
  fragility: number;
};

export type SystemContent = {
  id: string;
  name: string;
  difficulty: number;
  background: string;
  musicIntensity: "stealth" | "alarm" | "lockdown";
  ship: {
    startPosition: [number, number];
    startVelocity: [number, number];
    rotation: number;
    fuel: number;
    thrustPower: number;
    rotationPower: number;
  };
  planets: PlanetContent[];
  stations: StationContent[];
  hazards: HazardContent[];
  contracts: ContractContent[];
  cargo: CargoContent[];
};

export type GravitySourceState = {
  id: string;
  name: string;
  position: Vec2;
  radius: number;
  gravityMass: number;
  influenceRadius: number;
};

export type LandingPadState = {
  id: string;
  position: Vec2;
  normalAngle: number;
  radius: number;
  allowedApproachSpeed: number;
  requiredAngleTolerance: number;
  role: "pickup" | "destination" | "neutral";
  active: boolean;
  destination: boolean;
};

export type HazardState = {
  id: string;
  type: string;
  position: Vec2;
  radius: number;
  severity: number;
};

export type RiskGateState = {
  id: string;
  position: Vec2;
  radius: number;
  cleared: boolean;
  speedThreshold: number;
  styleBonus: number;
};

export type EnemyPolicyMode = "patrol" | "chase" | "evade";

export type EnemyShipState = {
  id: string;
  position: Vec2;
  velocity: Vec2;
  rotation: number;
  hp: number;
  maxHp: number;
  radius: number;
  fireCooldownSeconds: number;
  contactCooldownSeconds: number;
  policy: EnemyPolicyMode;
};

export type ProjectileState = {
  id: string;
  owner: "player" | "enemy";
  position: Vec2;
  velocity: Vec2;
  radius: number;
  damage: number;
  ageSeconds: number;
  maxAgeSeconds: number;
};

export type ShipState = {
  position: Vec2;
  velocity: Vec2;
  rotation: number;
  targetRotation: number;
  fuel: number;
  maxFuel: number;
  hp: number;
  maxHp: number;
  weaponCooldownSeconds: number;
  boostCooldownSeconds: number;
  thrustPower: number;
  rotationPower: number;
  cargoDamage: number;
};

export type SimulationWorld = {
  systemId: string;
  contractId: string;
  contentVersion: string;
  seed: string;
  tick: number;
  elapsedSeconds: number;
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  activePerk: PlayerPerkId;
  cargoOnboard: boolean;
  lastMilestone?: string;
  lastStyleAward?: number;
  approachStreakSeconds: number;
  bestApproachStreakSeconds: number;
  landingRating?: LandingRating;
  crashReason?: CrashReason;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  styleBonus: number;
  styleChainCount: number;
  styleChainSecondsRemaining: number;
  launchBurstSecondsRemaining: number;
  launchBurstAwarded: boolean;
  skimmedHazardIds: string[];
  slungGravitySourceIds: string[];
  riskGates: RiskGateState[];
  clearedRiskGateIds: string[];
  manualBrakeUsed: boolean;
  fuelUsed: number;
  emergencyShieldUsed: boolean;
  pulseShotAvailable: boolean;
  activeContract: ContractContent;
  activeCargo: CargoContent;
  gravitySources: GravitySourceState[];
  landingPads: LandingPadState[];
  hazards: HazardState[];
  enemies: EnemyShipState[];
  playerProjectiles: ProjectileState[];
  enemyProjectiles: ProjectileState[];
  enemyDirectorMode: "local" | "openai" | "fallback";
  enemyDirectorPolicy: EnemyDirectorPolicy;
  ship: ShipState;
};

export type TrajectoryOptions = {
  seconds: number;
  fixedDt: number;
  sampleEvery: number;
};

export type WorldCreationOptions = {
  contractId?: string;
  perkId?: PlayerPerkId;
};

export type WorldReplayInput = {
  system: SystemContent;
  seed: string;
  commandBuffer: CommandBuffer;
  ticks: number;
  contractId?: string;
};

export type StepWorldOptions = {
  combat?: boolean;
  enemyDirectorPolicy?: EnemyDirectorPolicy;
  enemyDirectorMode?: "local" | "openai" | "fallback";
};

export type WorldReplayOutput = {
  world: SimulationWorld;
  replay: ReplayEnvelope;
};

const GRAVITY_SCALE = 70;
const GRAVITY_SOFTENING = 16;
const FUEL_BURN_PER_SECOND = 8;
const BRAKE_BURN_PER_SECOND = 3;
export const BOOST_COOLDOWN_SECONDS = 1.15;
const BOOST_IMPULSE_SPEED = 24;
const BOOST_FUEL_COST = 2;
const AFTERBURNER_BOOST_IMPULSE_SPEED = 32;
const AFTERBURNER_BOOST_FUEL_COST = 3;
const UNSTABLE_BRAKE_STRESS_PER_SECOND = 0.012;
export const LANDING_ASSIST_FUEL_COST = 1.5;
const HAZARD_SKIM_OUTER_RADIUS = 1.35;
export const HAZARD_SKIM_BASE_BONUS = 140;
export const HAZARD_SKIM_SEVERITY_BONUS = 120;
export const HAZARD_THREAD_SPEED_THRESHOLD = 42;
const HAZARD_THREAD_SPEED_BONUS = 120;
export const GRAVITY_SLING_SPEED_THRESHOLD = 54;
export const GRAVITY_SLING_STYLE_BONUS = 240;
const GRAVITY_SLING_OUTER_RADIUS = 3;
const GRAVITY_SLING_SAFE_SURFACE_RADIUS = 1.3;
export const QUICK_PICKUP_WINDOW_SECONDS = 12;
export const QUICK_PICKUP_STYLE_BONUS = 180;
export const LAUNCH_BURST_WINDOW_SECONDS = 3;
export const LAUNCH_BURST_STYLE_BONUS = 120;
export const PERFECT_APPROACH_STREAK_SECONDS = 1;
export const PERFECT_APPROACH_STYLE_BONUS = 220;
export const ECO_DRIFT_FUEL_USED_LIMIT = 12;
export const ECO_DRIFT_STYLE_BONUS = 160;
export const COMET_FINISH_STYLE_BONUS = 320;
export const CHAIN_FINISH_STYLE_BONUS = 260;
export const EXPRESS_FINISH_STYLE_BONUS = 180;
export const DAMAGE_CONTROL_STYLE_BONUS = 140;
export const LAST_DROP_STYLE_BONUS = 170;
export const LAST_DROP_FUEL_RATIO = 0.05;
export const NO_BRAKE_STYLE_BONUS = 150;
export const ANTIMATTER_DRIFT_STYLE_BONUS = 210;
export const RISK_GATE_RADIUS = 28;
export const RISK_GATE_SPEED_THRESHOLD = 34;
export const RISK_GATE_STYLE_BONUS = 190;
export const CONTROLLED_DOCK_SPEED_RATIO = 0.7;
export const EMERGENCY_SHIELD_REBOUND_DAMAGE = 0.22;
const SHIELD_CRATE_MAX_HP = 125;
const SHIELD_CRATE_REBOUND_DAMAGE = 0.08;
const CATASTROPHIC_DOCK_SPEED_RATIO = 1.85;
const ROUGH_DOCK_SPEED_DAMAGE = 0.18;
const ROUGH_DOCK_ALIGNMENT_DAMAGE = 0.08;
const CATASTROPHIC_ACTIVE_DOCK_DAMAGE = 0.45;
export const STYLE_CHAIN_WINDOW_SECONDS = 4;
export const CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS = 5.5;
const STYLE_CHAIN_MULTIPLIER_STEP = 0.25;
const STYLE_CHAIN_MAX_COUNT = 4;
const ACTIVE_DOCK_HALO_RADIUS_MULTIPLIER = 3.5;
const DOCK_CAPTURE_RADIUS_MULTIPLIER = 1.7;
const DOCK_SETTLED_RADIUS_MULTIPLIER = 2.6;
const DOCK_SETTLED_MAX_SPEED = 0.5;
const DOCK_HALO_APPROACH_MIN_CLOSING_SPEED = 3;
const DOCK_HALO_SIDE_ON_MIN_SPEED = 12;
const GRAVITY_DOCK_CONTACT_GRACE_RADIUS_MULTIPLIER = 4;
const GRAVITY_DOCK_TARGET_SIDE_GRACE_RADIUS_MULTIPLIER = 4.5;
const GRAVITY_DOCK_TARGET_SIDE_MIN_SOURCE_DISTANCE_RATIO = 0.45;
const EMERGENCY_SHIELD_REBOUND_MIN_SPEED = 6;
const EMERGENCY_SHIELD_REBOUND_MAX_SPEED = 58;
const EMERGENCY_SHIELD_REBOUND_PUSH_OUT = 6;
const EMERGENCY_SHIELD_REBOUND_OUTWARD_SPEED = 22;
const SHIP_MAX_HP = 100;
const PLAYER_WEAPON_COOLDOWN_SECONDS = 0.28;
const PLAYER_PROJECTILE_SPEED = 112;
const PLAYER_PROJECTILE_DAMAGE = 20;
const PLAYER_PROJECTILE_RADIUS = 4;
const PULSE_SHOT_DAMAGE = 42;
const PULSE_SHOT_RADIUS = 6;
const PLAYER_PROJECTILE_MAX_AGE_SECONDS = 1.5;
const ENEMY_MAX_HP = 40;
const ENEMY_RADIUS = 14;
const ENEMY_FIRE_COOLDOWN_SECONDS = 4.4;
const ENEMY_PROJECTILE_SPEED = 66;
const ENEMY_PROJECTILE_DAMAGE = 8;
const ENEMY_PROJECTILE_RADIUS = 5;
const ENEMY_PROJECTILE_MAX_AGE_SECONDS = 2.4;
export const ENEMY_HIT_STYLE_BONUS = 35;
const ENEMY_STYLE_BONUS = 90;
const ENEMY_WAKE_DISTANCE = 430;
const ENEMY_FIRE_DISTANCE = 220;
const ENEMY_ACCELERATION = 17;
const ENEMY_MAX_SPEED = 26;
const SHIP_COMBAT_RADIUS = 10;
const ENEMY_STANDOFF_DISTANCE = ENEMY_RADIUS + SHIP_COMBAT_RADIUS + 42;
const ENEMY_STANDOFF_SLOW_RANGE = 46;
const ENEMY_CONTACT_COOLDOWN_SECONDS = 0.55;
const ENEMY_CONTACT_BASE_DAMAGE = 7;
const ENEMY_CONTACT_SPEED_DAMAGE = 0.22;
const ENEMY_CONTACT_MAX_DAMAGE = 18;
const ENEMY_CONTACT_ENEMY_DAMAGE_MULTIPLIER = 1.25;
const ENEMY_CONTACT_PUSH_OUT = 1.5;
const ENEMY_CONTACT_REBOUND_SPEED = 18;
const ENEMY_CONTACT_SHIP_IMPULSE = 5;

export function calculateHazardSkimStyleBonus(severity: number): number {
  return Math.round(HAZARD_SKIM_BASE_BONUS + clamp(severity, 0, 1) * HAZARD_SKIM_SEVERITY_BONUS);
}

export function calculateHazardThreadStyleBonus(severity: number): number {
  return calculateHazardSkimStyleBonus(severity) + HAZARD_THREAD_SPEED_BONUS;
}

export function defaultEnemyDirectorPolicy(): EnemyDirectorPolicy {
  return {
    aggression: 0.45,
    flank: 0,
    fireBias: 0.4,
    retreatHp: 28,
    focus: "cargo"
  };
}

export function clampEnemyDirectorPolicy(policy: EnemyDirectorPolicy): EnemyDirectorPolicy {
  return {
    aggression: round(clamp(policy.aggression, 0, 1), 3),
    flank: round(clamp(policy.flank, -1, 1), 3),
    fireBias: round(clamp(policy.fireBias, 0, 1), 3),
    retreatHp: round(clamp(policy.retreatHp, 0, ENEMY_MAX_HP), 3),
    focus: policy.focus === "player" || policy.focus === "objective" ? policy.focus : "cargo"
  };
}

export function createWorldFromSystem(system: SystemContent, seed: string, options: WorldCreationOptions = {}): SimulationWorld {
  const activeContract = options.contractId
    ? system.contracts.find((contract) => contract.id === options.contractId)
    : system.contracts[0];
  if (!activeContract) {
    if (options.contractId) {
      throw new Error(`System "${system.id}" does not define contract "${options.contractId}"`);
    }
    throw new Error(`System "${system.id}" does not define a contract`);
  }
  const activeCargo = system.cargo.find((cargo) => cargo.id === activeContract.cargoId);
  if (!activeCargo) {
    throw new Error(`System "${system.id}" does not define cargo "${activeContract.cargoId}"`);
  }
  const shipStart = activeContract.shipStart;
  const shipPosition = shipStart?.position ?? system.ship.startPosition;
  const shipVelocity = shipStart?.velocity ?? system.ship.startVelocity;
  const shipRotation = shipStart?.rotation ?? system.ship.rotation;
  const shipFuel = shipStart?.fuel ?? system.ship.fuel;
  const hazardSeverityMultiplier = activeContract.hazardSeverityMultiplier ?? 1;
  const hazardSeedPulse = dailyHazardSeverityPulse(seed);
  const shipStartPosition = toVec2(shipPosition);
  const activePerk = options.perkId ?? "afterburner";
  const shipMaxHp = activePerk === "shield-crate" ? SHIELD_CRATE_MAX_HP : SHIP_MAX_HP;
  const hazards = system.hazards.map((hazard) => ({
    id: hazard.id,
    type: hazard.type,
    position: toVec2(hazard.position),
    radius: hazard.radius,
    severity: round(clamp(hazard.severity * hazardSeverityMultiplier * hazardSeedPulse(hazard.id), 0, 1), 3)
  }));
  const landingPads: LandingPadState[] = [
    ...system.planets.flatMap((planet) => planet.landingPads),
    ...system.stations.flatMap((station) => station.landingPads)
  ].map((pad) => {
    const role: LandingPadState["role"] =
      pad.id === activeContract.pickupId ? "pickup" : pad.id === activeContract.destinationId ? "destination" : "neutral";
    return {
      id: pad.id,
      position: toVec2(pad.position),
      normalAngle: pad.normalAngle,
      radius: pad.radius,
      allowedApproachSpeed: pad.allowedApproachSpeed,
      requiredAngleTolerance: pad.requiredAngleTolerance,
      role,
      active: pad.id === activeContract.pickupId,
      destination: pad.id === activeContract.destinationId
    };
  });

  return {
    systemId: system.id,
    contractId: activeContract.id,
    contentVersion: `${system.id}@1`,
    seed,
    tick: 0,
    elapsedSeconds: 0,
    status: "flying",
    objectivePhase: "pickup",
    activePerk,
    cargoOnboard: false,
    approachStreakSeconds: 0,
    bestApproachStreakSeconds: 0,
    score: 0,
    scoreBreakdown: createEmptyScoreBreakdown(),
    styleBonus: 0,
    styleChainCount: 0,
    styleChainSecondsRemaining: 0,
    launchBurstSecondsRemaining: 0,
    launchBurstAwarded: false,
    skimmedHazardIds: [],
    slungGravitySourceIds: [],
    riskGates: createRiskGates(system, activeContract, hazards),
    clearedRiskGateIds: [],
    manualBrakeUsed: false,
    fuelUsed: 0,
    emergencyShieldUsed: false,
    pulseShotAvailable: activePerk === "pulse-shot",
    activeContract,
    activeCargo,
    gravitySources: system.planets.map((planet) => ({
      id: planet.id,
      name: planet.name,
      position: toVec2(planet.position),
      radius: planet.radius,
      gravityMass: planet.gravityMass,
      influenceRadius: planet.influenceRadius
    })),
    landingPads,
    hazards,
    enemies: createEnemyPatrol(system, activeContract, shipStartPosition),
    playerProjectiles: [],
    enemyProjectiles: [],
    enemyDirectorMode: "local",
    enemyDirectorPolicy: defaultEnemyDirectorPolicy(),
    ship: {
      position: shipStartPosition,
      velocity: toVec2(shipVelocity),
      rotation: shipRotation,
      targetRotation: shipRotation,
      fuel: shipFuel,
      maxFuel: shipFuel,
      hp: shipMaxHp,
      maxHp: shipMaxHp,
      weaponCooldownSeconds: 0,
      boostCooldownSeconds: 0,
      thrustPower: system.ship.thrustPower,
      rotationPower: system.ship.rotationPower,
      cargoDamage: 0
    }
  };
}

function createEnemyPatrol(system: SystemContent, activeContract: ContractContent, shipStartPosition: Vec2): EnemyShipState[] {
  const pickup = findPadPosition(system, activeContract.pickupId) ?? shipStartPosition;
  const destination = findPadPosition(system, activeContract.destinationId) ?? add(shipStartPosition, { x: 220, y: 0 });
  const route = subtract(destination, pickup);
  const routeDistance = Math.max(1, magnitude(route));
  const routeDirection = scale(route, 1 / routeDistance);
  const flank = { x: -routeDirection.y, y: routeDirection.x };
  const midpoint = scale(add(pickup, destination), 0.5);
  const seedShift = deterministicUnit(`${system.id}:${activeContract.id}:interceptors`) - 0.5;

  return [
    createEnemyShip("interceptor-a", add(add(midpoint, scale(flank, 220)), scale(routeDirection, seedShift * 80)), 0.35),
    createEnemyShip("interceptor-b", add(add(midpoint, scale(flank, -190)), scale(routeDirection, 90 + seedShift * 60)), -0.2)
  ];
}

function createRiskGates(system: SystemContent, activeContract: ContractContent, hazards: HazardState[]): RiskGateState[] {
  const pickup = findPadPosition(system, activeContract.pickupId);
  const destination = findPadPosition(system, activeContract.destinationId);
  if (!pickup || !destination || hazards.length === 0) {
    return [];
  }

  const route = subtract(destination, pickup);
  const routeDistance = magnitude(route);
  if (routeDistance <= 1) {
    return [];
  }

  const routeDirection = scale(route, 1 / routeDistance);
  const routeNormal = { x: -routeDirection.y, y: routeDirection.x };

  return hazards.slice(0, 2).map((hazard) => {
    const hazardRouteOffset = subtract(hazard.position, pickup);
    const projection = dot(hazardRouteOffset, routeDirection);
    const progress = clamp(projection / routeDistance, 0.18, 0.82);
    const nearestRoutePoint = add(pickup, scale(routeDirection, progress * routeDistance));
    const outwardCandidate = subtract(nearestRoutePoint, hazard.position);
    const fallbackSign = deterministicUnit(`${system.id}:${activeContract.id}:${hazard.id}:risk-gate`) >= 0.5 ? 1 : -1;
    const outward = magnitude(outwardCandidate) > 1 ? normalizeVector(outwardCandidate) : scale(routeNormal, fallbackSign);

    return {
      id: `risk-gate-${hazard.id}`,
      position: add(hazard.position, scale(outward, hazard.radius * 1.42)),
      radius: RISK_GATE_RADIUS,
      cleared: false,
      speedThreshold: RISK_GATE_SPEED_THRESHOLD,
      styleBonus: RISK_GATE_STYLE_BONUS
    };
  });
}

function createEnemyShip(id: string, position: Vec2, drift: number): EnemyShipState {
  return {
    id,
    position,
    velocity: { x: Math.cos(drift) * 5, y: Math.sin(drift) * 5 },
    rotation: drift,
    hp: ENEMY_MAX_HP,
    maxHp: ENEMY_MAX_HP,
    radius: ENEMY_RADIUS,
    fireCooldownSeconds: ENEMY_FIRE_COOLDOWN_SECONDS,
    contactCooldownSeconds: 0,
    policy: "patrol"
  };
}

function findPadPosition(system: SystemContent, padId: string): Vec2 | undefined {
  const pads = [
    ...system.planets.flatMap((planet) => planet.landingPads),
    ...system.stations.flatMap((station) => station.landingPads)
  ];
  const pad = pads.find((candidate) => candidate.id === padId);
  return pad ? toVec2(pad.position) : undefined;
}

export function stepWorld(
  world: SimulationWorld,
  fixedDt: number,
  commands: PlayerCommand[],
  options: StepWorldOptions = {}
): SimulationWorld {
  if (world.status !== "flying") {
    return world;
  }
  if (options.enemyDirectorPolicy) {
    world.enemyDirectorPolicy = clampEnemyDirectorPolicy(options.enemyDirectorPolicy);
    world.enemyDirectorMode = options.enemyDirectorMode ?? "openai";
  }
  world.lastMilestone = undefined;
  world.lastStyleAward = undefined;
  tickBoostCooldown(world, fixedDt);
  tickWeaponCooldown(world, fixedDt);
  tickStyleChain(world, fixedDt);
  tickLaunchBurstWindow(world, fixedDt);

  let thrust = 0;
  let brake = 0;
  let boostCommandSeen = false;

  for (const command of commands) {
    if (command.type === "AIM") {
      world.ship.targetRotation = normalizeAngle(command.angle);
    } else if (command.type === "THRUST") {
      thrust = Math.max(thrust, clamp(command.amount, 0, 1));
    } else if (command.type === "BRAKE") {
      const brakeAmount = clamp(command.amount, 0, 1);
      brake = Math.max(brake, brakeAmount);
      if (brakeAmount > 0) {
        world.manualBrakeUsed = true;
      }
    } else if (command.type === "BOOST") {
      boostCommandSeen = true;
      if (world.ship.fuel > boostFuelCost(world) && world.ship.boostCooldownSeconds <= 0) {
        const fuelCost = boostFuelCost(world);
        thrust = Math.max(thrust, 1);
        world.ship.velocity = add(world.ship.velocity, {
          x: Math.cos(world.ship.rotation) * boostImpulseSpeed(world),
          y: Math.sin(world.ship.rotation) * boostImpulseSpeed(world)
        });
        world.ship.fuel -= fuelCost;
        world.fuelUsed += fuelCost;
        world.ship.boostCooldownSeconds = BOOST_COOLDOWN_SECONDS;
        world.lastMilestone = "Boost Burn";
        if (canAwardLaunchBurst(world)) {
          world.launchBurstAwarded = true;
          world.launchBurstSecondsRemaining = 0;
          awardStyle(world, LAUNCH_BURST_STYLE_BONUS, "Launch Burst");
        }
      }
    } else if (command.type === "FIRE") {
      firePlayerProjectile(world);
    } else if (command.type === "PAUSE") {
      world.status = "paused";
      return world;
    }
  }

  rotateTowardTarget(world.ship, fixedDt);
  applyGravity(world, fixedDt);
  applyThrust(world, fixedDt, thrust);
  applyBrake(world, fixedDt, brake);
  applyCargoHandlingStress(world, fixedDt, brake);
  integrate(world, fixedDt);
  if (options.combat !== false) {
    updateCombat(world, fixedDt);
  }
  updateGravitySling(world, { suppress: boostCommandSeen });
  applyLandingAssist(world);
  updateApproachStreak(world, fixedDt);
  updateHazards(world, fixedDt);
  updateRiskGates(world);
  resolveLandingOrCrash(world);
  updateScore(world);

  world.tick += 1;
  world.elapsedSeconds = round(world.elapsedSeconds + fixedDt, 6);

  return world;
}

export function createWorldReplay(input: WorldReplayInput): WorldReplayOutput {
  const world = createWorldFromSystem(input.system, input.seed, { contractId: input.contractId });

  for (let tick = 0; tick < input.ticks && world.status === "flying"; tick += 1) {
    stepWorld(world, 1 / 60, input.commandBuffer.commandsForTick(tick));
  }

  return {
    world,
    replay: {
      gameVersion: "0.1.0",
      contentVersion: world.contentVersion,
      systemId: world.systemId,
      contractId: world.contractId,
      rngSeed: input.seed,
      shipConfig: {
        hull: "starter",
        upgrades: []
      },
      inputFrames: input.commandBuffer.frames(),
      result: summarizeRun(world)
    }
  };
}

export function summarizeRun(world: SimulationWorld): RunResultSummary {
  return {
    status: world.status,
    elapsedSeconds: round(world.elapsedSeconds, 3),
    score: world.score,
    cargoDamage: round(world.ship.cargoDamage, 3),
    fuelUsed: round(world.fuelUsed, 3),
    medal: medalFor(world),
    grade: gradeFor(world),
    landingRating: world.landingRating,
    crashReason: world.crashReason,
    scoreBreakdown: { ...world.scoreBreakdown }
  };
}

export function predictTrajectory(world: SimulationWorld, options: TrajectoryOptions): Vec2[] {
  const preview = cloneWorld(world);
  const totalTicks = Math.max(0, Math.floor(options.seconds / options.fixedDt));
  const sampleEvery = Math.max(1, options.sampleEvery);
  const points: Vec2[] = [];

  for (let tick = 0; tick < totalTicks; tick += 1) {
    stepWorld(preview, options.fixedDt, [], { combat: false });
    if (tick % sampleEvery === 0) {
      points.push({ ...preview.ship.position });
    }
  }

  return points;
}

export function snapshotWorld(world: SimulationWorld): SimulationSnapshot {
  return {
    tick: world.tick,
    status: world.status,
    objectivePhase: world.objectivePhase,
    cargoOnboard: world.cargoOnboard,
    manualBrakeUsed: world.manualBrakeUsed,
    emergencyShieldAvailable: !world.emergencyShieldUsed,
    lastMilestone: world.lastMilestone,
    lastStyleAward: world.lastStyleAward,
    approachStreakSeconds: round(world.approachStreakSeconds, 3),
    bestApproachStreakSeconds: round(world.bestApproachStreakSeconds, 3),
    styleChainCount: world.styleChainCount,
    styleChainSecondsRemaining: round(world.styleChainSecondsRemaining, 3),
    styleMultiplier: styleMultiplierForChain(world),
    launchBurstSecondsRemaining: round(world.launchBurstSecondsRemaining, 3),
    elapsedSeconds: world.elapsedSeconds,
    score: world.score,
    activePerk: world.activePerk,
    objectiveTarget: getObjectiveTarget(world),
    gravitySlingOpportunity: getGravitySlingOpportunity(world),
    riskGates: world.riskGates.map((gate) => ({
      id: gate.id,
      position: { ...gate.position },
      radius: gate.radius,
      cleared: gate.cleared,
      speedThreshold: gate.speedThreshold,
      styleBonus: gate.styleBonus
    })),
    ship: {
      position: { ...world.ship.position },
      velocity: { ...world.ship.velocity },
      rotation: world.ship.rotation,
      fuel: world.ship.fuel,
      maxFuel: world.ship.maxFuel,
      hp: round(world.ship.hp, 3),
      maxHp: world.ship.maxHp,
      weaponCooldownSeconds: round(world.ship.weaponCooldownSeconds, 3),
      boostCooldownSeconds: round(world.ship.boostCooldownSeconds, 3),
      cargoDamage: world.ship.cargoDamage
    },
    enemies: world.enemies.map((enemy) => ({
      id: enemy.id,
      position: { ...enemy.position },
      velocity: { ...enemy.velocity },
      rotation: enemy.rotation,
      hp: round(enemy.hp, 3),
      maxHp: enemy.maxHp,
      radius: enemy.radius,
      policy: enemy.policy
    })),
    playerProjectiles: world.playerProjectiles.map((projectile) => ({
      id: projectile.id,
      position: { ...projectile.position },
      velocity: { ...projectile.velocity },
      radius: projectile.radius
    })),
    enemyProjectiles: world.enemyProjectiles.map((projectile) => ({
      id: projectile.id,
      position: { ...projectile.position },
      velocity: { ...projectile.velocity },
      radius: projectile.radius
    })),
    enemyDirector: {
      mode: world.enemyDirectorMode,
      policy: { ...world.enemyDirectorPolicy }
    },
    gravitySources: world.gravitySources.map((source) => ({
      id: source.id,
      name: source.name,
      position: { ...source.position },
      radius: source.radius,
      influenceRadius: source.influenceRadius
    })),
    landingPads: world.landingPads.map((pad) => ({
      id: pad.id,
      position: { ...pad.position },
      normalAngle: pad.normalAngle,
      radius: pad.radius,
      role: pad.role,
      active: pad.active,
      destination: pad.destination
    })),
    hazards: world.hazards.map((hazard) => ({
      id: hazard.id,
      type: hazard.type,
      position: { ...hazard.position },
      radius: hazard.radius,
      severity: hazard.severity
    })),
    nearestHazard: getNearestHazard(world)
  };
}

function getObjectiveTarget(world: SimulationWorld): SimulationSnapshot["objectiveTarget"] {
  const pad = world.landingPads.find((candidate) => candidate.active);
  if (!pad) {
    return undefined;
  }

  const offset = subtract(pad.position, world.ship.position);
  const distance = magnitude(offset);
  const speed = magnitude(world.ship.velocity);
  const angleError = Math.abs(shortestAngleDelta(world.ship.rotation, pad.normalAngle));
  const assistAvailable = world.ship.fuel > LANDING_ASSIST_FUEL_COST && canLandingAssist(distance, speed, angleError, pad, world);

  return {
    id: pad.id,
    role: pad.role,
    position: { ...pad.position },
    distance: round(distance, 3),
    bearing: normalizeAngle(Math.atan2(offset.y, offset.x)),
    speed: round(speed, 3),
    allowedApproachSpeed: pad.allowedApproachSpeed,
    angleError: round(angleError, 3),
    requiredAngleTolerance: pad.requiredAngleTolerance,
    assistAvailable,
    landingStatus: classifyLandingGuidance(distance, speed, angleError, pad)
  };
}

function classifyLandingGuidance(
  distance: number,
  speed: number,
  angleError: number,
  pad: LandingPadState
): LandingGuidanceStatus {
  const withinDockReady = distance <= pad.radius * ACTIVE_DOCK_HALO_RADIUS_MULTIPLIER;
  const withinDockGuidance = distance <= pad.radius * ACTIVE_DOCK_HALO_RADIUS_MULTIPLIER;
  if (!withinDockGuidance) {
    return "approach";
  }
  if (speed > pad.allowedApproachSpeed) {
    return "too-fast";
  }
  if (angleError > pad.requiredAngleTolerance && !isControlledDockSpeed(speed, pad)) {
    return "misaligned";
  }
  return withinDockReady ? "ready" : "approach";
}

function getNearestHazard(world: SimulationWorld): SimulationSnapshot["nearestHazard"] {
  let nearest:
    | {
        hazard: HazardState;
        distance: number;
      }
    | undefined;

  for (const hazard of world.hazards) {
    const distance = distanceBetween(world.ship.position, hazard.position);
    const warningDistance = hazard.radius * 2;
    if (distance > warningDistance) {
      continue;
    }
    if (!nearest || distance < nearest.distance) {
      nearest = { hazard, distance };
    }
  }

  if (!nearest) {
    return undefined;
  }

  return {
    id: nearest.hazard.id,
    type: nearest.hazard.type,
    position: { ...nearest.hazard.position },
    distance: round(nearest.distance, 3),
    radius: nearest.hazard.radius,
    severity: nearest.hazard.severity,
    dangerLevel: nearest.distance <= nearest.hazard.radius ? "inside" : "near"
  };
}

function applyGravity(world: SimulationWorld, fixedDt: number): void {
  for (const source of world.gravitySources) {
    const offset = subtract(source.position, world.ship.position);
    const distance = magnitude(offset);
    if (distance <= 0 || distance > source.influenceRadius) {
      continue;
    }

    const direction = scale(offset, 1 / distance);
    const strength =
      (source.gravityMass / (distance * distance + source.radius * source.radius + GRAVITY_SOFTENING)) * GRAVITY_SCALE;
    world.ship.velocity = add(world.ship.velocity, scale(direction, strength * fixedDt));
  }
}

function boostFuelCost(world: Pick<SimulationWorld, "activePerk">): number {
  return world.activePerk === "afterburner" ? AFTERBURNER_BOOST_FUEL_COST : BOOST_FUEL_COST;
}

function boostImpulseSpeed(world: Pick<SimulationWorld, "activePerk">): number {
  return world.activePerk === "afterburner" ? AFTERBURNER_BOOST_IMPULSE_SPEED : BOOST_IMPULSE_SPEED;
}

function tickBoostCooldown(world: SimulationWorld, fixedDt: number): void {
  if (world.ship.boostCooldownSeconds <= 0) {
    world.ship.boostCooldownSeconds = 0;
    return;
  }

  world.ship.boostCooldownSeconds = round(Math.max(0, world.ship.boostCooldownSeconds - fixedDt), 6);
}

function tickStyleChain(world: SimulationWorld, fixedDt: number): void {
  if (world.styleChainSecondsRemaining <= 0) {
    world.styleChainCount = 0;
    world.styleChainSecondsRemaining = 0;
    return;
  }

  world.styleChainSecondsRemaining = round(Math.max(0, world.styleChainSecondsRemaining - fixedDt), 6);
  if (world.styleChainSecondsRemaining === 0) {
    world.styleChainCount = 0;
  }
}

function tickLaunchBurstWindow(world: SimulationWorld, fixedDt: number): void {
  if (world.launchBurstSecondsRemaining <= 0 || world.launchBurstAwarded) {
    world.launchBurstSecondsRemaining = 0;
    return;
  }

  world.launchBurstSecondsRemaining = round(Math.max(0, world.launchBurstSecondsRemaining - fixedDt), 6);
}

function awardStyle(world: SimulationWorld, baseBonus: number, milestone: string): void {
  const award = Math.round(baseBonus * styleMultiplierForChain(world));
  world.styleBonus += award;
  world.styleChainCount = Math.min(STYLE_CHAIN_MAX_COUNT, world.styleChainCount + 1);
  world.styleChainSecondsRemaining = styleChainWindowSeconds(world);
  world.lastMilestone = milestone;
  world.lastStyleAward = award;
}

function styleChainWindowSeconds(world: Pick<SimulationWorld, "contractId">): number {
  return world.contractId === "chain-relay" ? CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS : STYLE_CHAIN_WINDOW_SECONDS;
}

function styleMultiplierForChain(world: Pick<SimulationWorld, "styleChainCount" | "styleChainSecondsRemaining">): number {
  if (world.styleChainCount <= 0 || world.styleChainSecondsRemaining <= 0) {
    return 1;
  }

  return round(1 + Math.min(STYLE_CHAIN_MAX_COUNT, world.styleChainCount) * STYLE_CHAIN_MULTIPLIER_STEP, 2);
}

function canAwardLaunchBurst(world: SimulationWorld): boolean {
  return (
    world.cargoOnboard &&
    !world.launchBurstAwarded &&
    world.launchBurstSecondsRemaining > 0 &&
    world.ship.cargoDamage <= 0.02
  );
}

function applyThrust(world: SimulationWorld, fixedDt: number, amount: number): void {
  if (amount <= 0 || world.ship.fuel <= 0) {
    return;
  }

  const spend = Math.min(world.ship.fuel, amount * FUEL_BURN_PER_SECOND * fixedDt);
  const effectiveAmount = spend / (FUEL_BURN_PER_SECOND * fixedDt);
  const thrustVector = {
    x: Math.cos(world.ship.rotation) * world.ship.thrustPower * effectiveAmount * fixedDt,
    y: Math.sin(world.ship.rotation) * world.ship.thrustPower * effectiveAmount * fixedDt
  };

  world.ship.velocity = add(world.ship.velocity, thrustVector);
  world.ship.fuel = round(world.ship.fuel - spend, 6);
  world.fuelUsed = round(world.fuelUsed + spend, 6);
}

function applyBrake(world: SimulationWorld, fixedDt: number, amount: number): void {
  if (amount <= 0 || world.ship.fuel <= 0) {
    return;
  }

  const spend = Math.min(world.ship.fuel, amount * BRAKE_BURN_PER_SECOND * fixedDt);
  const damping = Math.max(0, 1 - amount * fixedDt * 1.8);

  world.ship.velocity = scale(world.ship.velocity, damping);
  world.ship.fuel = round(world.ship.fuel - spend, 6);
  world.fuelUsed = round(world.fuelUsed + spend, 6);
}

function applyCargoHandlingStress(world: SimulationWorld, fixedDt: number, brakeAmount: number): void {
  if (!world.cargoOnboard || brakeAmount <= 0 || !isBrakeSensitiveCargo(world.activeCargo.kind)) {
    return;
  }

  const stressMultiplier = Math.max(0.25, world.activeCargo.fragility);
  world.ship.cargoDamage = clamp(
    world.ship.cargoDamage + brakeAmount * Math.max(0, fixedDt) * UNSTABLE_BRAKE_STRESS_PER_SECOND * stressMultiplier,
    0,
    1
  );
}

function isBrakeSensitiveCargo(cargoKind: string): boolean {
  return cargoKind === "unstable" || cargoKind === "volatile";
}

function integrate(world: SimulationWorld, fixedDt: number): void {
  world.ship.position = add(world.ship.position, scale(world.ship.velocity, fixedDt));
}

function tickWeaponCooldown(world: SimulationWorld, fixedDt: number): void {
  world.ship.weaponCooldownSeconds = round(Math.max(0, world.ship.weaponCooldownSeconds - fixedDt), 6);
  for (const enemy of world.enemies) {
    enemy.fireCooldownSeconds = round(Math.max(0, enemy.fireCooldownSeconds - fixedDt), 6);
    enemy.contactCooldownSeconds = round(Math.max(0, (enemy.contactCooldownSeconds ?? 0) - fixedDt), 6);
  }
}

function firePlayerProjectile(world: SimulationWorld): void {
  if (world.ship.weaponCooldownSeconds > 0 || world.ship.hp <= 0) {
    return;
  }

  const forward = { x: Math.cos(world.ship.rotation), y: Math.sin(world.ship.rotation) };
  const muzzle = add(world.ship.position, scale(forward, 18));
  const chargedPulse = world.activePerk === "pulse-shot" && world.pulseShotAvailable;
  world.playerProjectiles.push({
    id: `player-shot-${world.tick}-${world.playerProjectiles.length}`,
    owner: "player",
    position: muzzle,
    velocity: add(world.ship.velocity, scale(forward, PLAYER_PROJECTILE_SPEED)),
    radius: chargedPulse ? PULSE_SHOT_RADIUS : PLAYER_PROJECTILE_RADIUS,
    damage: chargedPulse ? PULSE_SHOT_DAMAGE : PLAYER_PROJECTILE_DAMAGE,
    ageSeconds: 0,
    maxAgeSeconds: PLAYER_PROJECTILE_MAX_AGE_SECONDS
  });
  if (chargedPulse) {
    world.pulseShotAvailable = false;
  }
  world.ship.weaponCooldownSeconds = PLAYER_WEAPON_COOLDOWN_SECONDS;
}

function updateCombat(world: SimulationWorld, fixedDt: number): void {
  updateEnemies(world, fixedDt);
  resolveEnemyHullContacts(world);
  stepProjectiles(world.playerProjectiles, fixedDt);
  stepProjectiles(world.enemyProjectiles, fixedDt);
  resolvePlayerProjectileHits(world);
  resolveEnemyProjectileHits(world);
  cleanupProjectiles(world);
}

function updateEnemies(world: SimulationWorld, fixedDt: number): void {
  const policy = clampEnemyDirectorPolicy(world.enemyDirectorPolicy);
  for (const enemy of world.enemies) {
    const toShip = subtract(world.ship.position, enemy.position);
    const distance = magnitude(toShip);
    const direction = distance > 0 ? scale(toShip, 1 / distance) : { x: 1, y: 0 };
    const lowHp = enemy.hp <= policy.retreatHp;
    const waking = distance <= ENEMY_WAKE_DISTANCE;
    enemy.policy = lowHp ? "evade" : waking ? "chase" : "patrol";
    const standoffSlowDistance = ENEMY_STANDOFF_DISTANCE + ENEMY_STANDOFF_SLOW_RANGE;
    const inboundSpeed = dot(enemy.velocity, direction);
    if (!lowHp && distance < standoffSlowDistance && inboundSpeed > 0) {
      const slowFactor = clamp((standoffSlowDistance - distance) / ENEMY_STANDOFF_SLOW_RANGE, 0, 0.86);
      enemy.velocity = subtract(enemy.velocity, scale(direction, inboundSpeed * slowFactor));
    }

    const flankAxis = {
      x: -direction.y * policy.flank,
      y: direction.x * policy.flank
    };
    const desired =
      enemy.policy === "evade"
        ? scale(direction, -1)
        : enemy.policy === "chase"
          ? normalizeVector(
              add(
                scale(direction, distance < ENEMY_STANDOFF_DISTANCE ? -1.85 : 1 + policy.aggression),
                scale(flankAxis, distance < standoffSlowDistance ? 1.15 : 0.45)
              )
            )
          : normalizeVector({ x: Math.cos(world.tick * 0.01 + enemy.position.x), y: Math.sin(world.tick * 0.01 + enemy.position.y) });
    enemy.velocity = add(enemy.velocity, scale(desired, ENEMY_ACCELERATION * fixedDt));
    enemy.velocity = limitVector(enemy.velocity, ENEMY_MAX_SPEED);
    enemy.position = add(enemy.position, scale(enemy.velocity, fixedDt));
    enemy.rotation = normalizeAngle(Math.atan2(enemy.velocity.y || direction.y, enemy.velocity.x || direction.x));

    if (distance <= ENEMY_FIRE_DISTANCE && enemy.fireCooldownSeconds <= 0) {
      fireEnemyProjectile(world, enemy, direction, policy);
    }
  }
}

function fireEnemyProjectile(
  world: SimulationWorld,
  enemy: EnemyShipState,
  directionToShip: Vec2,
  policy: EnemyDirectorPolicy
): void {
  const fireBiasCooldown = ENEMY_FIRE_COOLDOWN_SECONDS * (1.15 - policy.fireBias * 0.35);
  enemy.fireCooldownSeconds = round(clamp(fireBiasCooldown, 0.9, 2.4), 6);
  world.enemyProjectiles.push({
    id: `${enemy.id}-shot-${world.tick}-${world.enemyProjectiles.length}`,
    owner: "enemy",
    position: add(enemy.position, scale(directionToShip, enemy.radius + 5)),
    velocity: add(enemy.velocity, scale(directionToShip, ENEMY_PROJECTILE_SPEED)),
    radius: ENEMY_PROJECTILE_RADIUS,
    damage: ENEMY_PROJECTILE_DAMAGE,
    ageSeconds: 0,
    maxAgeSeconds: ENEMY_PROJECTILE_MAX_AGE_SECONDS
  });
}

function stepProjectiles(projectiles: ProjectileState[], fixedDt: number): void {
  for (const projectile of projectiles) {
    projectile.position = add(projectile.position, scale(projectile.velocity, fixedDt));
    projectile.ageSeconds = round(projectile.ageSeconds + fixedDt, 6);
  }
}

function resolvePlayerProjectileHits(world: SimulationWorld): void {
  const remainingProjectiles: ProjectileState[] = [];
  const destroyedEnemyIds = new Set<string>();

  for (const projectile of world.playerProjectiles) {
    const target = world.enemies.find(
      (enemy) => !destroyedEnemyIds.has(enemy.id) && distanceBetween(projectile.position, enemy.position) <= projectile.radius + enemy.radius
    );
    if (!target) {
      remainingProjectiles.push(projectile);
      continue;
    }

    target.hp = round(Math.max(0, target.hp - projectile.damage), 3);
    if (target.hp <= 0) {
      destroyedEnemyIds.add(target.id);
    } else {
      awardStyle(world, ENEMY_HIT_STYLE_BONUS, "Direct Hit");
    }
  }

  if (destroyedEnemyIds.size > 0) {
    world.enemies = world.enemies.filter((enemy) => !destroyedEnemyIds.has(enemy.id));
    awardStyle(world, ENEMY_STYLE_BONUS * destroyedEnemyIds.size, "Interceptor Down");
  }
  world.playerProjectiles = remainingProjectiles;
}

function resolveEnemyHullContacts(world: SimulationWorld): void {
  const destroyedEnemyIds = new Set<string>();

  for (const enemy of world.enemies) {
    const fromShip = subtract(enemy.position, world.ship.position);
    const distance = magnitude(fromShip);
    const contactDistance = enemy.radius + SHIP_COMBAT_RADIUS;
    if (distance > contactDistance) {
      continue;
    }

    const fallbackNormal = normalizeVector(enemy.velocity);
    const normal =
      distance > 0
        ? scale(fromShip, 1 / distance)
        : magnitude(fallbackNormal) > 0
          ? fallbackNormal
          : { x: Math.cos(world.ship.rotation), y: Math.sin(world.ship.rotation) };
    const impactSpeed = Math.max(0, dot(subtract(world.ship.velocity, enemy.velocity), normal));
    enemy.position = add(world.ship.position, scale(normal, contactDistance + ENEMY_CONTACT_PUSH_OUT));

    const enemyRadialSpeed = dot(enemy.velocity, normal);
    const enemyTangentVelocity = subtract(enemy.velocity, scale(normal, enemyRadialSpeed));
    enemy.velocity = add(enemyTangentVelocity, scale(normal, Math.max(ENEMY_CONTACT_REBOUND_SPEED, enemyRadialSpeed)));
    world.ship.velocity = subtract(world.ship.velocity, scale(normal, ENEMY_CONTACT_SHIP_IMPULSE));

    if ((enemy.contactCooldownSeconds ?? 0) > 0) {
      continue;
    }

    const damage = round(
      clamp(ENEMY_CONTACT_BASE_DAMAGE + impactSpeed * ENEMY_CONTACT_SPEED_DAMAGE, ENEMY_CONTACT_BASE_DAMAGE, ENEMY_CONTACT_MAX_DAMAGE),
      3
    );
    world.ship.hp = round(Math.max(0, world.ship.hp - damage), 3);
    enemy.hp = round(Math.max(0, enemy.hp - damage * ENEMY_CONTACT_ENEMY_DAMAGE_MULTIPLIER), 3);
    enemy.contactCooldownSeconds = ENEMY_CONTACT_COOLDOWN_SECONDS;
    world.lastMilestone = "Hull Contact";

    if (enemy.hp <= 0) {
      destroyedEnemyIds.add(enemy.id);
    }
    if (world.ship.hp <= 0) {
      world.status = "crashed";
      world.landingRating = "Insurance Event";
      world.crashReason = "Hull Collision";
      world.ship.cargoDamage = 1;
      break;
    }
  }

  if (destroyedEnemyIds.size > 0) {
    world.enemies = world.enemies.filter((enemy) => !destroyedEnemyIds.has(enemy.id));
    awardStyle(world, ENEMY_STYLE_BONUS * destroyedEnemyIds.size, "Interceptor Down");
  }
}

function resolveEnemyProjectileHits(world: SimulationWorld): void {
  const remainingProjectiles: ProjectileState[] = [];
  for (const projectile of world.enemyProjectiles) {
    if (distanceBetween(projectile.position, world.ship.position) > projectile.radius + 10) {
      remainingProjectiles.push(projectile);
      continue;
    }

    world.ship.hp = round(Math.max(0, world.ship.hp - projectile.damage), 3);
    world.lastMilestone = "Hull Hit";
    if (world.ship.hp <= 0) {
      world.status = "crashed";
      world.landingRating = "Insurance Event";
      world.crashReason = "Hull Collision";
      world.ship.cargoDamage = 1;
      break;
    }
  }
  world.enemyProjectiles = remainingProjectiles;
}

function cleanupProjectiles(world: SimulationWorld): void {
  world.playerProjectiles = world.playerProjectiles.filter((projectile) => projectile.ageSeconds <= projectile.maxAgeSeconds);
  world.enemyProjectiles = world.enemyProjectiles.filter((projectile) => projectile.ageSeconds <= projectile.maxAgeSeconds);
}

function updateGravitySling(world: SimulationWorld, options: { suppress?: boolean } = {}): void {
  if (options.suppress || world.lastMilestone === "Boost Burn") {
    return;
  }

  const opportunity = getGravitySlingOpportunity(world);
  if (!opportunity?.ready) {
    return;
  }

  world.slungGravitySourceIds.push(opportunity.id);
  awardStyle(world, GRAVITY_SLING_STYLE_BONUS, "Gravity Sling");
}

function getGravitySlingOpportunity(world: SimulationWorld): SimulationSnapshot["gravitySlingOpportunity"] {
  if (world.ship.cargoDamage > 0.02) {
    return undefined;
  }

  const speed = magnitude(world.ship.velocity);
  for (const source of world.gravitySources) {
    if (world.slungGravitySourceIds.includes(source.id)) {
      continue;
    }

    const distance = distanceBetween(world.ship.position, source.position);
    const outerRadius = Math.min(source.influenceRadius, source.radius * GRAVITY_SLING_OUTER_RADIUS);
    const safelyAboveSurface = distance > source.radius * GRAVITY_SLING_SAFE_SURFACE_RADIUS;
    if (safelyAboveSurface && distance <= outerRadius) {
      return {
        id: source.id,
        name: source.name,
        distance: round(distance, 3),
        ready: speed >= GRAVITY_SLING_SPEED_THRESHOLD,
        speedThreshold: GRAVITY_SLING_SPEED_THRESHOLD,
        styleBonus: GRAVITY_SLING_STYLE_BONUS
      };
    }
  }

  return undefined;
}

function updateHazards(world: SimulationWorld, fixedDt: number): void {
  for (const hazard of world.hazards) {
    const distance = distanceBetween(world.ship.position, hazard.position);
    if (distance <= hazard.radius) {
      const fragilityMultiplier = Math.max(0.25, world.activeCargo.fragility);
      world.ship.cargoDamage = clamp(world.ship.cargoDamage + hazard.severity * fixedDt * 0.08 * fragilityMultiplier, 0, 1);
      continue;
    }

    const cleanSkim = distance <= hazard.radius * HAZARD_SKIM_OUTER_RADIUS && world.ship.cargoDamage <= 0.02;
    if (cleanSkim && !world.skimmedHazardIds.includes(hazard.id)) {
      const fastSkim = magnitude(world.ship.velocity) >= HAZARD_THREAD_SPEED_THRESHOLD;
      world.skimmedHazardIds.push(hazard.id);
      awardStyle(
        world,
        fastSkim ? calculateHazardThreadStyleBonus(hazard.severity) : calculateHazardSkimStyleBonus(hazard.severity),
        fastSkim ? "Needle Thread" : "Clean Hazard Skim"
      );
    }
  }
}

function updateRiskGates(world: SimulationWorld): void {
  if (world.ship.cargoDamage > 0.35) {
    return;
  }

  const speed = magnitude(world.ship.velocity);
  for (const gate of world.riskGates) {
    if (gate.cleared || speed < gate.speedThreshold) {
      continue;
    }

    if (distanceBetween(world.ship.position, gate.position) > gate.radius) {
      continue;
    }

    gate.cleared = true;
    world.clearedRiskGateIds.push(gate.id);
    awardStyle(world, gate.styleBonus, "Risk Gate");
    return;
  }
}

function applyLandingAssist(world: SimulationWorld): void {
  const pad = world.landingPads.find((candidate) => candidate.active);
  if (!pad) {
    return;
  }

  const distance = distanceBetween(world.ship.position, pad.position);
  const speed = magnitude(world.ship.velocity);
  const angleError = Math.abs(shortestAngleDelta(world.ship.rotation, pad.normalAngle));

  if (world.ship.fuel <= LANDING_ASSIST_FUEL_COST || !canLandingAssist(distance, speed, angleError, pad, world)) {
    return;
  }

  const assistedSpeed = pad.allowedApproachSpeed * 0.92;
  world.ship.velocity = scale(world.ship.velocity, assistedSpeed / speed);
  world.ship.fuel = round(world.ship.fuel - LANDING_ASSIST_FUEL_COST, 6);
  world.fuelUsed = round(world.fuelUsed + LANDING_ASSIST_FUEL_COST, 6);
  world.lastMilestone = "Assist Burn";
}

function updateApproachStreak(world: SimulationWorld, fixedDt: number): void {
  const pad = world.landingPads.find((candidate) => candidate.active);
  if (!pad) {
    world.approachStreakSeconds = 0;
    return;
  }

  const distance = distanceBetween(world.ship.position, pad.position);
  const speed = magnitude(world.ship.velocity);
  const angleError = Math.abs(shortestAngleDelta(world.ship.rotation, pad.normalAngle));
  const stableApproach =
    distance <= pad.radius * 3 && speed <= pad.allowedApproachSpeed && angleError <= pad.requiredAngleTolerance;

  if (!stableApproach) {
    world.approachStreakSeconds = 0;
    return;
  }

  world.approachStreakSeconds = round(world.approachStreakSeconds + fixedDt, 6);
  world.bestApproachStreakSeconds = Math.max(world.bestApproachStreakSeconds, world.approachStreakSeconds);
}

function canLandingAssist(
  distance: number,
  speed: number,
  angleError: number,
  pad: LandingPadState,
  world?: Pick<SimulationWorld, "activePerk">
): boolean {
  const closeEnough = isWithinDockCaptureRadius(distance, pad, world);
  const moderatelyFast = speed > pad.allowedApproachSpeed && speed <= pad.allowedApproachSpeed * 1.3;
  const nearlyAligned = angleError <= pad.requiredAngleTolerance * 1.25;
  return closeEnough && moderatelyFast && nearlyAligned;
}

function canFinishStyleChain(world: SimulationWorld): boolean {
  return world.styleChainCount >= 2 && world.styleChainSecondsRemaining > 0 && world.ship.cargoDamage <= 0.02;
}

function canAwardCometFinish(world: SimulationWorld): boolean {
  return (
    world.elapsedSeconds <= world.activeContract.medalTimes.gold &&
    world.ship.cargoDamage <= 0.02 &&
    world.fuelUsed <= world.ship.maxFuel * 0.25 &&
    world.landingRating === "Perfect Landing"
  );
}

function canAwardExpressFinish(world: SimulationWorld): boolean {
  return world.elapsedSeconds <= world.activeContract.medalTimes.gold && world.ship.cargoDamage <= 0.02;
}

function canAwardDamageControl(world: SimulationWorld): boolean {
  return world.ship.cargoDamage > 0.02 && world.ship.cargoDamage <= 0.35;
}

function canAwardLastDrop(world: SimulationWorld): boolean {
  return world.ship.maxFuel > 0 && world.ship.fuel / world.ship.maxFuel <= LAST_DROP_FUEL_RATIO && world.ship.cargoDamage <= 0.02;
}

function canAwardNoBrakeFinesse(world: SimulationWorld): boolean {
  return !world.manualBrakeUsed && world.ship.cargoDamage <= 0.02;
}

function canAwardAntimatterDrift(world: SimulationWorld): boolean {
  return world.activeContract.id === "antimatter-drift" && world.activeCargo.kind === "unstable" && canAwardNoBrakeFinesse(world);
}

function resolveLandingOrCrash(world: SimulationWorld): void {
  const capturedActivePad = findActiveDockCapturePad(world);
  if (capturedActivePad) {
    resolvePadContact(world, capturedActivePad);
    return;
  }

  const touchedPad = world.landingPads.find((pad) => distanceBetween(world.ship.position, pad.position) <= pad.radius);
  if (touchedPad) {
    resolvePadContact(world, touchedPad);
    return;
  }

  const hitGravitySource = world.gravitySources.find((source) => distanceBetween(world.ship.position, source.position) <= source.radius);
  if (hitGravitySource) {
    const activeApproachPad = findActiveGravityDockApproachPad(world, hitGravitySource);
    if (activeApproachPad) {
      resolvePadContact(world, activeApproachPad);
      return;
    }

    if (tryEmergencyShieldRebound(world, hitGravitySource)) {
      return;
    }

    world.status = "crashed";
    world.landingRating = "Insurance Event";
    world.crashReason = "Hull Collision";
    world.ship.cargoDamage = 1;
  }
}

function tryEmergencyShieldRebound(world: SimulationWorld, source: GravitySourceState): boolean {
  if (world.emergencyShieldUsed) {
    return false;
  }

  const fromSource = subtract(world.ship.position, source.position);
  const distance = magnitude(fromSource);
  const speed = magnitude(world.ship.velocity);
  if (distance <= 0 || speed < EMERGENCY_SHIELD_REBOUND_MIN_SPEED || speed > EMERGENCY_SHIELD_REBOUND_MAX_SPEED) {
    return false;
  }

  world.emergencyShieldUsed = true;
  const normal = scale(fromSource, 1 / distance);
  const tangentVelocity = subtract(world.ship.velocity, scale(normal, dot(world.ship.velocity, normal)));
  world.ship.position = add(source.position, scale(normal, source.radius + EMERGENCY_SHIELD_REBOUND_PUSH_OUT));
  world.ship.velocity = add(scale(normal, EMERGENCY_SHIELD_REBOUND_OUTWARD_SPEED), scale(tangentVelocity, 0.35));
  world.ship.cargoDamage = Math.max(world.ship.cargoDamage, emergencyShieldCargoDamage(world));
  world.lastMilestone = "Shield Rebound";
  world.lastStyleAward = undefined;
  return true;
}

function emergencyShieldCargoDamage(world: Pick<SimulationWorld, "activePerk">): number {
  return world.activePerk === "shield-crate" ? SHIELD_CRATE_REBOUND_DAMAGE : EMERGENCY_SHIELD_REBOUND_DAMAGE;
}

function findActiveDockCapturePad(world: SimulationWorld): LandingPadState | undefined {
  return world.landingPads.find((pad) => {
    if (!pad.active) {
      return false;
    }

    const distance = distanceBetween(world.ship.position, pad.position);
    return (
      isWithinDockCaptureRadius(distance, pad, world) ||
      isControlledActiveDockHaloArrival(world, pad, distance) ||
      isVisibleActiveObjectiveHaloContact(world, pad, distance)
    );
  });
}

function isVisibleActiveObjectiveHaloContact(world: SimulationWorld, pad: LandingPadState, distance: number): boolean {
  if (!isActiveObjectiveContact(world, pad) || distance <= 0 || distance > pad.radius * ACTIVE_DOCK_HALO_RADIUS_MULTIPLIER) {
    return false;
  }

  const toPad = subtract(pad.position, world.ship.position);
  const closingSpeed = dot(world.ship.velocity, toPad) / distance;
  return (
    closingSpeed > DOCK_HALO_APPROACH_MIN_CLOSING_SPEED ||
    magnitude(world.ship.velocity) >= pad.allowedApproachSpeed
  );
}

function isControlledActiveDockHaloArrival(world: SimulationWorld, pad: LandingPadState, distance: number): boolean {
  if (distance <= 0 || distance > pad.radius * ACTIVE_DOCK_HALO_RADIUS_MULTIPLIER) {
    return false;
  }

  const speed = magnitude(world.ship.velocity);
  if (speed > pad.allowedApproachSpeed) {
    return false;
  }

  const controlledSpeed = isControlledDockSpeed(speed, pad);
  const angleDiff = Math.abs(shortestAngleDelta(world.ship.rotation, pad.normalAngle));
  const alignedEnough = angleDiff <= pad.requiredAngleTolerance || controlledSpeed;
  if (!alignedEnough) {
    return false;
  }

  if (isActiveObjectiveContact(world, pad) && speed >= DOCK_HALO_SIDE_ON_MIN_SPEED && angleDiff <= pad.requiredAngleTolerance) {
    return true;
  }

  if (speed <= DOCK_SETTLED_MAX_SPEED) {
    return (
      world.cargoOnboard &&
      world.objectivePhase === "delivery" &&
      pad.role === "destination" &&
      distance <= pad.radius * DOCK_SETTLED_RADIUS_MULTIPLIER &&
      angleDiff <= pad.requiredAngleTolerance
    );
  }

  if (controlledSpeed && speed >= DOCK_HALO_SIDE_ON_MIN_SPEED) {
    return true;
  }

  const toPad = subtract(pad.position, world.ship.position);
  const closingSpeed = dot(world.ship.velocity, toPad) / distance;
  return closingSpeed > Math.max(DOCK_HALO_APPROACH_MIN_CLOSING_SPEED, speed * 0.3);
}

function findActiveGravityDockApproachPad(world: SimulationWorld, source: GravitySourceState): LandingPadState | undefined {
  return world.landingPads.find((pad) => {
    const shipPadDistance = distanceBetween(world.ship.position, pad.position);
    return (
      pad.active &&
      isPadOnGravitySource(pad, source) &&
      (shipPadDistance <= pad.radius * GRAVITY_DOCK_CONTACT_GRACE_RADIUS_MULTIPLIER ||
        isControlledTargetSideGravityDockGraze(world, pad, source, shipPadDistance))
    );
  });
}

function isControlledTargetSideGravityDockGraze(
  world: SimulationWorld,
  pad: LandingPadState,
  source: GravitySourceState,
  shipPadDistance: number
): boolean {
  if (shipPadDistance > pad.radius * GRAVITY_DOCK_TARGET_SIDE_GRACE_RADIUS_MULTIPLIER) {
    return false;
  }

  if (magnitude(world.ship.velocity) > pad.allowedApproachSpeed) {
    return false;
  }

  const shipSourceOffset = subtract(world.ship.position, source.position);
  if (magnitude(shipSourceOffset) < source.radius * GRAVITY_DOCK_TARGET_SIDE_MIN_SOURCE_DISTANCE_RATIO) {
    return false;
  }

  const padNormal = {
    x: Math.cos(pad.normalAngle),
    y: Math.sin(pad.normalAngle)
  };
  return dot(shipSourceOffset, padNormal) > 0;
}

function isPadOnGravitySource(pad: LandingPadState, source: GravitySourceState): boolean {
  return distanceBetween(pad.position, source.position) <= source.radius + pad.radius;
}

function isWithinDockCaptureRadius(
  distance: number,
  pad: LandingPadState,
  world?: Pick<SimulationWorld, "activePerk">
): boolean {
  const pickupBoost = world?.activePerk === "magnet-clamp" && pad.role === "pickup" ? 2.45 : 0;
  return distance <= pad.radius * (DOCK_CAPTURE_RADIUS_MULTIPLIER + pickupBoost);
}

function resolvePadContact(world: SimulationWorld, touchedPad: LandingPadState): void {
  const speed = magnitude(world.ship.velocity);
  const angleDiff = Math.abs(shortestAngleDelta(world.ship.rotation, touchedPad.normalAngle));
  const isSoftEnough = speed <= touchedPad.allowedApproachSpeed;
  const isAligned = angleDiff <= touchedPad.requiredAngleTolerance;
  const isSafeDocking = isSoftEnough && (isAligned || isControlledDockSpeed(speed, touchedPad));

  if (!isSafeDocking) {
    const activeObjectiveContact = isActiveObjectiveContact(world, touchedPad);
    if (!activeObjectiveContact) {
      world.status = "crashed";
      world.landingRating = "Insurance Event";
      world.crashReason = isSoftEnough ? "Misaligned Dock" : "Hard Landing";
      world.ship.cargoDamage = 1;
      return;
    }

    applyRoughDockDamage(world, speed, angleDiff, touchedPad);
    if (isCatastrophicDockImpact(speed, touchedPad)) {
      world.ship.cargoDamage = Math.max(world.ship.cargoDamage, CATASTROPHIC_ACTIVE_DOCK_DAMAGE);
    }
  }

  if (touchedPad.role === "pickup" && world.objectivePhase === "pickup") {
    world.cargoOnboard = true;
    world.objectivePhase = "delivery";
    if (world.elapsedSeconds <= QUICK_PICKUP_WINDOW_SECONDS && world.ship.cargoDamage <= 0.02) {
      awardStyle(world, QUICK_PICKUP_STYLE_BONUS, world.lastMilestone === "Assist Burn" ? "Assist Burn" : "Quick Pickup");
    } else {
      world.lastMilestone = "Cargo Loaded";
    }
    world.launchBurstSecondsRemaining = LAUNCH_BURST_WINDOW_SECONDS;
    world.ship.velocity = scale(world.ship.velocity, 0.25);
    for (const pad of world.landingPads) {
      pad.active = pad.role === "destination";
    }
    return;
  }

  if (touchedPad.role === "destination" && world.objectivePhase === "pickup") {
    world.lastMilestone = "Pickup Required";
    world.ship.velocity = scale(world.ship.velocity, 0.25);
    return;
  }

  if (touchedPad.role === "destination" && world.cargoOnboard) {
    world.status = "delivered";
    world.objectivePhase = "complete";
    world.landingRating = rateLanding(speed, angleDiff, touchedPad, world.ship.cargoDamage);
    if (canAwardCometFinish(world)) {
      awardStyle(world, COMET_FINISH_STYLE_BONUS, "Comet Finish");
    } else if (canFinishStyleChain(world)) {
      awardStyle(world, CHAIN_FINISH_STYLE_BONUS, "Chain Finish");
    } else if (world.landingRating === "Perfect Landing" && world.bestApproachStreakSeconds >= PERFECT_APPROACH_STREAK_SECONDS) {
      awardStyle(world, PERFECT_APPROACH_STYLE_BONUS, "Perfect Approach");
    } else if (canAwardExpressFinish(world)) {
      awardStyle(world, EXPRESS_FINISH_STYLE_BONUS, "Express Finish");
    } else if (canAwardLastDrop(world)) {
      awardStyle(world, LAST_DROP_STYLE_BONUS, "Last Drop");
    } else if (world.fuelUsed <= ECO_DRIFT_FUEL_USED_LIMIT && world.ship.cargoDamage <= 0.02) {
      awardStyle(world, ECO_DRIFT_STYLE_BONUS, "Eco Drift");
    } else if (canAwardAntimatterDrift(world)) {
      awardStyle(world, ANTIMATTER_DRIFT_STYLE_BONUS, "Antimatter Drift");
    } else if (canAwardNoBrakeFinesse(world)) {
      awardStyle(world, NO_BRAKE_STYLE_BONUS, "No Brake Finesse");
    } else if (canAwardDamageControl(world)) {
      awardStyle(world, DAMAGE_CONTROL_STYLE_BONUS, "Damage Control");
    } else {
      world.lastMilestone = "Delivered";
    }
    return;
  }

  const departingUsedPickup =
    touchedPad.role === "pickup" &&
    world.cargoOnboard &&
    world.ship.velocity.x * Math.cos(touchedPad.normalAngle) + world.ship.velocity.y * Math.sin(touchedPad.normalAngle) > 0;
  world.lastMilestone = world.lastMilestone ?? (touchedPad.role === "pickup" ? "Cargo Already Loaded" : "Docked");
  if (!departingUsedPickup) {
    world.ship.velocity = scale(world.ship.velocity, 0.25);
  }
}

function isActiveObjectiveContact(world: SimulationWorld, touchedPad: LandingPadState): boolean {
  if (!touchedPad.active) {
    return false;
  }

  if (touchedPad.role === "pickup" && world.objectivePhase === "pickup") {
    return true;
  }

  return touchedPad.role === "destination" && world.cargoOnboard;
}

function isCatastrophicDockImpact(speed: number, pad: LandingPadState): boolean {
  return speed > pad.allowedApproachSpeed * CATASTROPHIC_DOCK_SPEED_RATIO;
}

function applyRoughDockDamage(world: SimulationWorld, speed: number, angleDiff: number, pad: LandingPadState): void {
  const speedOverage = Math.max(0, speed / pad.allowedApproachSpeed - 1);
  const alignmentOverage = Math.max(0, angleDiff / pad.requiredAngleTolerance - 1);
  const roughness = speedOverage * ROUGH_DOCK_SPEED_DAMAGE + alignmentOverage * ROUGH_DOCK_ALIGNMENT_DAMAGE;
  if (roughness <= 0) {
    return;
  }

  const fragilityMultiplier = Math.max(0.25, world.activeCargo.fragility);
  world.ship.cargoDamage = clamp(world.ship.cargoDamage + roughness * fragilityMultiplier, 0, 0.95);
}

function updateScore(world: SimulationWorld): void {
  world.scoreBreakdown = buildScoreBreakdown(world);
  world.score = world.scoreBreakdown.total;
}

function buildScoreBreakdown(world: SimulationWorld): ScoreBreakdown {
  if (world.status !== "delivered") {
    const base = 100;
    const paceBonus = round(world.tick * 0.05, 3);
    const incidentPenalty = round(world.ship.cargoDamage * 100, 3);
    const styleBonus = world.styleBonus;
    const total = Math.max(0, Math.round(base + paceBonus + styleBonus - incidentPenalty));

    return {
      base,
      paceBonus,
      fuelBonus: 0,
      cargoBonus: 0,
      landingBonus: 0,
      styleBonus,
      dangerBonus: 0,
      incidentPenalty,
      total
    };
  }

  const base = 1000;
  const paceBonus = round(Math.max(0, 700 - world.elapsedSeconds * 8), 3);
  const fuelBonus = round(world.ship.fuel * 5, 3);
  const cargoBonus = round((1 - world.ship.cargoDamage) * 500, 3);
  const landingBonus = world.landingRating === "Perfect Landing" ? 300 : 120;
  const styleBonus = world.styleBonus;
  const dangerBonus = dangerPayBonus(world);
  const incidentPenalty = 0;
  const total = Math.max(
    0,
    Math.round(base + paceBonus + fuelBonus + cargoBonus + landingBonus + styleBonus + dangerBonus - incidentPenalty)
  );

  return {
    base,
    paceBonus,
    fuelBonus,
    cargoBonus,
    landingBonus,
    styleBonus,
    dangerBonus,
    incidentPenalty,
    total
  };
}

function createEmptyScoreBreakdown(): ScoreBreakdown {
  return {
    base: 0,
    paceBonus: 0,
    fuelBonus: 0,
    cargoBonus: 0,
    landingBonus: 0,
    styleBonus: 0,
    dangerBonus: 0,
    incidentPenalty: 0,
    total: 0
  };
}

function dangerPayBonus(world: SimulationWorld): number {
  const multiplier = world.activeContract.hazardSeverityMultiplier ?? 1;
  return round(Math.max(0, multiplier - 1) * 400, 3);
}

function medalFor(world: SimulationWorld): RunMedal {
  if (world.status !== "delivered") {
    return "none";
  }

  const thresholds = world.activeContract.medalTimes;
  const cargoIntact = world.ship.cargoDamage <= 0.02;
  const efficientFuel = world.fuelUsed <= world.ship.maxFuel * 0.25;

  if (
    world.elapsedSeconds <= thresholds.gold &&
    cargoIntact &&
    efficientFuel &&
    world.landingRating === "Perfect Landing"
  ) {
    return "comet";
  }
  if (world.elapsedSeconds <= thresholds.gold) {
    return "gold";
  }
  if (world.elapsedSeconds <= thresholds.silver) {
    return "silver";
  }
  if (world.elapsedSeconds <= thresholds.bronze) {
    return "bronze";
  }
  return "none";
}

function gradeFor(world: SimulationWorld): RunGrade {
  if (world.status !== "delivered") {
    return "F";
  }

  const medal = medalFor(world);
  if (medal === "comet") return "S";
  if (medal === "gold") return world.ship.cargoDamage <= 0.08 ? "A" : "B";
  if (medal === "silver") return "B";
  if (medal === "bronze") return "C";
  return "D";
}

function rateLanding(
  speed: number,
  angleDiff: number,
  pad: LandingPadState,
  cargoDamage: number
): LandingRating {
  if (speed <= pad.allowedApproachSpeed * 0.45 && angleDiff <= pad.requiredAngleTolerance * 0.5 && cargoDamage <= 0.02) {
    return "Perfect Landing";
  }

  if (isControlledDockSpeed(speed, pad) && cargoDamage <= 0.08) {
    return "Soft Landing";
  }

  if (cargoDamage <= 0.35) {
    return "Spicy Landing";
  }

  return "Cargo Survived Somehow";
}

function isControlledDockSpeed(speed: number, pad: LandingPadState): boolean {
  return speed <= pad.allowedApproachSpeed * CONTROLLED_DOCK_SPEED_RATIO;
}

function rotateTowardTarget(ship: ShipState, fixedDt: number): void {
  const delta = shortestAngleDelta(ship.rotation, ship.targetRotation);
  const maxTurn = ship.rotationPower * fixedDt;
  ship.rotation = normalizeAngle(ship.rotation + clamp(delta, -maxTurn, maxTurn));
}

function cloneWorld(world: SimulationWorld): SimulationWorld {
  return JSON.parse(JSON.stringify(world)) as SimulationWorld;
}

function toVec2(tuple: [number, number]): Vec2 {
  return {
    x: tuple[0],
    y: tuple[1]
  };
}

function add(left: Vec2, right: Vec2): Vec2 {
  return {
    x: left.x + right.x,
    y: left.y + right.y
  };
}

function subtract(left: Vec2, right: Vec2): Vec2 {
  return {
    x: left.x - right.x,
    y: left.y - right.y
  };
}

function scale(value: Vec2, amount: number): Vec2 {
  return {
    x: value.x * amount,
    y: value.y * amount
  };
}

function magnitude(value: Vec2): number {
  return Math.hypot(value.x, value.y);
}

function normalizeVector(value: Vec2): Vec2 {
  const length = magnitude(value);
  if (length <= 0) {
    return { x: 0, y: 0 };
  }
  return scale(value, 1 / length);
}

function limitVector(value: Vec2, maxLength: number): Vec2 {
  const length = magnitude(value);
  if (length <= maxLength || length <= 0) {
    return value;
  }
  return scale(value, maxLength / length);
}

function dot(left: Vec2, right: Vec2): number {
  return left.x * right.x + left.y * right.y;
}

function distanceBetween(left: Vec2, right: Vec2): number {
  return magnitude(subtract(left, right));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dailyHazardSeverityPulse(seed: string): (hazardId: string) => number {
  if (!seed.startsWith("daily-")) {
    return () => 1;
  }

  return (hazardId: string) => 0.9 + deterministicUnit(`${seed}:${hazardId}:hazard`) * 0.2;
}

function deterministicUnit(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function normalizeAngle(angle: number): number {
  let next = angle;
  while (next <= -Math.PI) next += Math.PI * 2;
  while (next > Math.PI) next -= Math.PI * 2;
  return next;
}

function shortestAngleDelta(from: number, to: number): number {
  return normalizeAngle(to - from);
}

function round(value: number, digits: number): number {
  const scaleFactor = 10 ** digits;
  return Math.round(value * scaleFactor) / scaleFactor;
}
