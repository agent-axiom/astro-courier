export type Vec2 = {
  x: number;
  y: number;
};

export type PlayerCommand =
  | { type: "AIM"; angle: number }
  | { type: "THRUST"; amount: number }
  | { type: "BRAKE"; amount: number }
  | { type: "BOOST" }
  | { type: "FIRE" }
  | { type: "INTERACT" }
  | { type: "PAUSE" };

export type InputFrame = {
  tick: number;
  command: PlayerCommand;
};

export type RunStatus = "flying" | "delivered" | "crashed" | "paused";
export type ObjectivePhase = "pickup" | "delivery" | "complete";
export type LandingGuidanceStatus = "approach" | "too-fast" | "misaligned" | "ready";
export type PlayerPerkId = "afterburner" | "shield-crate" | "pulse-shot" | "magnet-clamp";

export type LandingRating =
  | "Perfect Landing"
  | "Soft Landing"
  | "Spicy Landing"
  | "Cargo Survived Somehow"
  | "Insurance Event";
export type RunMedal = "none" | "bronze" | "silver" | "gold" | "comet";
export type CrashReason = "Hard Landing" | "Misaligned Dock" | "Hull Collision" | "Fuel Depleted";
export type RunGrade = "S" | "A" | "B" | "C" | "D" | "F";

export type ScoreBreakdown = {
  base: number;
  paceBonus: number;
  fuelBonus: number;
  cargoBonus: number;
  landingBonus: number;
  styleBonus: number;
  dangerBonus: number;
  incidentPenalty: number;
  total: number;
};

export type EnemyShipArchetype = "drone" | "fighter" | "brute" | "sentinel";

export type EnemyDirectorPolicy = {
  aggression: number;
  flank: number;
  fireBias: number;
  retreatHp: number;
  focus: "cargo" | "player" | "objective";
};

export type RiskGateSnapshot = {
  id: string;
  position: Vec2;
  radius: number;
  cleared: boolean;
  speedThreshold: number;
  styleBonus: number;
};

export type RunResultSummary = {
  status: RunStatus;
  elapsedSeconds: number;
  score: number;
  cargoDamage: number;
  fuelUsed: number;
  medal: RunMedal;
  grade: RunGrade;
  landingRating?: LandingRating;
  crashReason?: CrashReason;
  scoreBreakdown: ScoreBreakdown;
};

export type ReplayEnvelope = {
  gameVersion: string;
  contentVersion: string;
  systemId: string;
  contractId: string;
  rngSeed: string;
  shipConfig: {
    hull: string;
    upgrades: string[];
  };
  inputFrames: InputFrame[];
  result: RunResultSummary;
};

export type SimulationSnapshot = {
  tick: number;
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  activePerk: PlayerPerkId;
  cargoOnboard: boolean;
  manualBrakeUsed: boolean;
  emergencyShieldAvailable: boolean;
  lastMilestone?: string;
  lastStyleAward?: number;
  approachStreakSeconds: number;
  bestApproachStreakSeconds: number;
  styleChainCount: number;
  styleChainSecondsRemaining: number;
  styleMultiplier: number;
  launchBurstSecondsRemaining: number;
  elapsedSeconds: number;
  score: number;
  crashReason?: CrashReason;
  fuelDepletedCountdownSeconds?: number;
  blackHole?: {
    position: Vec2;
    radius: number;
    pullRadius: number;
    intensity: number;
  };
  objectiveTarget?: {
    id: string;
    role: "pickup" | "destination" | "neutral";
    position: Vec2;
    distance: number;
    bearing: number;
    speed: number;
    allowedApproachSpeed: number;
    angleError: number;
    requiredAngleTolerance: number;
    assistAvailable: boolean;
    landingStatus: LandingGuidanceStatus;
  };
  gravitySlingOpportunity?: {
    id: string;
    name: string;
    distance: number;
    ready: boolean;
    speedThreshold: number;
    styleBonus: number;
  };
  refuelStop?: {
    id: string;
    position: Vec2;
    distance: number;
    bearing: number;
    ready: boolean;
    fuelGain: number;
    allowedApproachSpeed: number;
  };
  riskGates: RiskGateSnapshot[];
  ship: {
    position: Vec2;
    velocity: Vec2;
    rotation: number;
    fuel: number;
    maxFuel: number;
    hp: number;
    maxHp: number;
    weaponCooldownSeconds: number;
    boostCooldownSeconds: number;
    cargoDamage: number;
  };
  enemies: Array<{
    id: string;
    archetype: EnemyShipArchetype;
    position: Vec2;
    velocity: Vec2;
    rotation: number;
    hp: number;
    maxHp: number;
    radius: number;
    policy: "patrol" | "chase" | "evade";
  }>;
  playerProjectiles: Array<{
    id: string;
    position: Vec2;
    velocity: Vec2;
    radius: number;
  }>;
  enemyProjectiles: Array<{
    id: string;
    position: Vec2;
    velocity: Vec2;
    radius: number;
  }>;
  enemyDirector: {
    mode: "local" | "openai" | "fallback";
    policy: EnemyDirectorPolicy;
  };
  gravitySources: Array<{
    id: string;
    name: string;
    visualTheme: string;
    position: Vec2;
    radius: number;
    influenceRadius: number;
  }>;
  landingPads: Array<{
    id: string;
    position: Vec2;
    normalAngle: number;
    radius: number;
    role: "pickup" | "destination" | "neutral";
    stationRole?: "neutral" | "fuel";
    refuel: boolean;
    refueled: boolean;
    active: boolean;
    destination: boolean;
  }>;
  hazards: Array<{
    id: string;
    type: string;
    position: Vec2;
    radius: number;
    severity: number;
  }>;
  nearestHazard?: {
    id: string;
    type: string;
    position: Vec2;
    distance: number;
    radius: number;
    severity: number;
    dangerLevel: "near" | "inside";
  };
};
