import type {
  CrashReason,
  InputFrame,
  LandingRating,
  LandingGuidanceStatus,
  ObjectivePhase,
  PlayerCommand,
  ReplayEnvelope,
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
  pickupId: string;
  destinationId: string;
  cargoId: string;
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

export type ShipState = {
  position: Vec2;
  velocity: Vec2;
  rotation: number;
  targetRotation: number;
  fuel: number;
  maxFuel: number;
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
  cargoOnboard: boolean;
  lastMilestone?: string;
  approachStreakSeconds: number;
  bestApproachStreakSeconds: number;
  landingRating?: LandingRating;
  crashReason?: CrashReason;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  fuelUsed: number;
  activeContract: ContractContent;
  gravitySources: GravitySourceState[];
  landingPads: LandingPadState[];
  hazards: HazardState[];
  ship: ShipState;
};

export type TrajectoryOptions = {
  seconds: number;
  fixedDt: number;
  sampleEvery: number;
};

export type WorldReplayInput = {
  system: SystemContent;
  seed: string;
  commandBuffer: CommandBuffer;
  ticks: number;
};

export type WorldReplayOutput = {
  world: SimulationWorld;
  replay: ReplayEnvelope;
};

const GRAVITY_SCALE = 70;
const GRAVITY_SOFTENING = 16;
const FUEL_BURN_PER_SECOND = 8;
const BRAKE_BURN_PER_SECOND = 3;

export function createWorldFromSystem(system: SystemContent, seed: string): SimulationWorld {
  const activeContract = system.contracts[0];
  if (!activeContract) {
    throw new Error(`System "${system.id}" does not define a contract`);
  }

  return {
    systemId: system.id,
    contractId: activeContract.id,
    contentVersion: `${system.id}@1`,
    seed,
    tick: 0,
    elapsedSeconds: 0,
    status: "flying",
    objectivePhase: "pickup",
    cargoOnboard: false,
    approachStreakSeconds: 0,
    bestApproachStreakSeconds: 0,
    score: 0,
    scoreBreakdown: createEmptyScoreBreakdown(),
    fuelUsed: 0,
    activeContract,
    gravitySources: system.planets.map((planet) => ({
      id: planet.id,
      name: planet.name,
      position: toVec2(planet.position),
      radius: planet.radius,
      gravityMass: planet.gravityMass,
      influenceRadius: planet.influenceRadius
    })),
    landingPads: [
      ...system.planets.flatMap((planet) => planet.landingPads),
      ...system.stations.flatMap((station) => station.landingPads)
    ].map((pad) => ({
      id: pad.id,
      position: toVec2(pad.position),
      normalAngle: pad.normalAngle,
      radius: pad.radius,
      allowedApproachSpeed: pad.allowedApproachSpeed,
      requiredAngleTolerance: pad.requiredAngleTolerance,
      role:
        pad.id === activeContract.pickupId ? "pickup" : pad.id === activeContract.destinationId ? "destination" : "neutral",
      active: pad.id === activeContract.pickupId,
      destination: pad.id === activeContract.destinationId
    })),
    hazards: system.hazards.map((hazard) => ({
      id: hazard.id,
      type: hazard.type,
      position: toVec2(hazard.position),
      radius: hazard.radius,
      severity: hazard.severity
    })),
    ship: {
      position: toVec2(system.ship.startPosition),
      velocity: toVec2(system.ship.startVelocity),
      rotation: system.ship.rotation,
      targetRotation: system.ship.rotation,
      fuel: system.ship.fuel,
      maxFuel: system.ship.fuel,
      thrustPower: system.ship.thrustPower,
      rotationPower: system.ship.rotationPower,
      cargoDamage: 0
    }
  };
}

export function stepWorld(world: SimulationWorld, fixedDt: number, commands: PlayerCommand[]): SimulationWorld {
  if (world.status !== "flying") {
    return world;
  }
  world.lastMilestone = undefined;

  let thrust = 0;
  let brake = 0;

  for (const command of commands) {
    if (command.type === "AIM") {
      world.ship.targetRotation = normalizeAngle(command.angle);
    } else if (command.type === "THRUST") {
      thrust = Math.max(thrust, clamp(command.amount, 0, 1));
    } else if (command.type === "BRAKE") {
      brake = Math.max(brake, clamp(command.amount, 0, 1));
    } else if (command.type === "BOOST" && world.ship.fuel > 2) {
      thrust = Math.max(thrust, 1);
      world.ship.fuel -= 2;
      world.fuelUsed += 2;
      world.lastMilestone = "Boost Burn";
    } else if (command.type === "PAUSE") {
      world.status = "paused";
      return world;
    }
  }

  rotateTowardTarget(world.ship, fixedDt);
  applyGravity(world, fixedDt);
  applyThrust(world, fixedDt, thrust);
  applyBrake(world, fixedDt, brake);
  integrate(world, fixedDt);
  applyLandingAssist(world);
  updateApproachStreak(world, fixedDt);
  updateHazards(world, fixedDt);
  resolveLandingOrCrash(world);
  updateScore(world);

  world.tick += 1;
  world.elapsedSeconds = round(world.elapsedSeconds + fixedDt, 6);

  return world;
}

export function createWorldReplay(input: WorldReplayInput): WorldReplayOutput {
  const world = createWorldFromSystem(input.system, input.seed);

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
    stepWorld(preview, options.fixedDt, []);
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
    lastMilestone: world.lastMilestone,
    approachStreakSeconds: round(world.approachStreakSeconds, 3),
    bestApproachStreakSeconds: round(world.bestApproachStreakSeconds, 3),
    elapsedSeconds: world.elapsedSeconds,
    score: world.score,
    objectiveTarget: getObjectiveTarget(world),
    ship: {
      position: { ...world.ship.position },
      velocity: { ...world.ship.velocity },
      rotation: world.ship.rotation,
      fuel: world.ship.fuel,
      maxFuel: world.ship.maxFuel,
      cargoDamage: world.ship.cargoDamage
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
  const assistAvailable = canLandingAssist(distance, speed, angleError, pad);

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
  if (distance > pad.radius * 1.35) {
    return "approach";
  }
  if (speed > pad.allowedApproachSpeed) {
    return "too-fast";
  }
  if (angleError > pad.requiredAngleTolerance) {
    return "misaligned";
  }
  return "ready";
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

function integrate(world: SimulationWorld, fixedDt: number): void {
  world.ship.position = add(world.ship.position, scale(world.ship.velocity, fixedDt));
}

function updateHazards(world: SimulationWorld, fixedDt: number): void {
  for (const hazard of world.hazards) {
    const distance = distanceBetween(world.ship.position, hazard.position);
    if (distance <= hazard.radius) {
      world.ship.cargoDamage = clamp(world.ship.cargoDamage + hazard.severity * fixedDt * 0.08, 0, 1);
    }
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

  if (!canLandingAssist(distance, speed, angleError, pad)) {
    return;
  }

  const assistedSpeed = pad.allowedApproachSpeed * 0.92;
  world.ship.velocity = scale(world.ship.velocity, assistedSpeed / speed);
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

function canLandingAssist(distance: number, speed: number, angleError: number, pad: LandingPadState): boolean {
  const closeEnough = distance <= pad.radius * 1.35;
  const moderatelyFast = speed > pad.allowedApproachSpeed && speed <= pad.allowedApproachSpeed * 1.3;
  const nearlyAligned = angleError <= pad.requiredAngleTolerance * 1.25;
  return closeEnough && moderatelyFast && nearlyAligned;
}

function resolveLandingOrCrash(world: SimulationWorld): void {
  const touchedPad = world.landingPads.find((pad) => distanceBetween(world.ship.position, pad.position) <= pad.radius);
  if (touchedPad) {
    const speed = magnitude(world.ship.velocity);
    const angleDiff = Math.abs(shortestAngleDelta(world.ship.rotation, touchedPad.normalAngle));
    const isSoftEnough = speed <= touchedPad.allowedApproachSpeed;
    const isAligned = angleDiff <= touchedPad.requiredAngleTolerance;
    const isSafeDocking = isSoftEnough && isAligned;

    if (!isSafeDocking) {
      world.status = "crashed";
      world.landingRating = "Insurance Event";
      world.crashReason = "Hard Landing";
      world.ship.cargoDamage = 1;
      return;
    }

    if (touchedPad.role === "pickup" && world.objectivePhase === "pickup") {
      world.cargoOnboard = true;
      world.objectivePhase = "delivery";
      world.lastMilestone = "Cargo Loaded";
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
      world.lastMilestone = "Delivered";
      world.landingRating = rateLanding(speed, angleDiff, touchedPad, world.ship.cargoDamage);
      return;
    }

    world.lastMilestone = touchedPad.role === "pickup" ? "Cargo Already Loaded" : "Docked";
    world.ship.velocity = scale(world.ship.velocity, 0.25);
    return;
  }

  const hitGravitySource = world.gravitySources.find((source) => distanceBetween(world.ship.position, source.position) <= source.radius);
  if (hitGravitySource) {
    world.status = "crashed";
    world.landingRating = "Insurance Event";
    world.crashReason = "Hull Collision";
    world.ship.cargoDamage = 1;
  }
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
    const total = Math.max(0, Math.round(base + paceBonus - incidentPenalty));

    return {
      base,
      paceBonus,
      fuelBonus: 0,
      cargoBonus: 0,
      landingBonus: 0,
      incidentPenalty,
      total
    };
  }

  const base = 1000;
  const paceBonus = round(Math.max(0, 700 - world.elapsedSeconds * 8), 3);
  const fuelBonus = round(world.ship.fuel * 5, 3);
  const cargoBonus = round((1 - world.ship.cargoDamage) * 500, 3);
  const landingBonus = world.landingRating === "Perfect Landing" ? 300 : 120;
  const incidentPenalty = 0;
  const total = Math.max(0, Math.round(base + paceBonus + fuelBonus + cargoBonus + landingBonus - incidentPenalty));

  return {
    base,
    paceBonus,
    fuelBonus,
    cargoBonus,
    landingBonus,
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
    incidentPenalty: 0,
    total: 0
  };
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

function rateLanding(
  speed: number,
  angleDiff: number,
  pad: LandingPadState,
  cargoDamage: number
): LandingRating {
  if (speed <= pad.allowedApproachSpeed * 0.45 && angleDiff <= pad.requiredAngleTolerance * 0.5 && cargoDamage <= 0.02) {
    return "Perfect Landing";
  }

  if (speed <= pad.allowedApproachSpeed * 0.7 && cargoDamage <= 0.08) {
    return "Soft Landing";
  }

  if (cargoDamage <= 0.35) {
    return "Spicy Landing";
  }

  return "Cargo Survived Somehow";
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

function distanceBetween(left: Vec2, right: Vec2): number {
  return magnitude(subtract(left, right));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
