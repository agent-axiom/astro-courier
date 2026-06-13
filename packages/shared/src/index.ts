export type Vec2 = {
  x: number;
  y: number;
};

export type PlayerCommand =
  | { type: "AIM"; angle: number }
  | { type: "THRUST"; amount: number }
  | { type: "BRAKE"; amount: number }
  | { type: "BOOST" }
  | { type: "INTERACT" }
  | { type: "PAUSE" };

export type InputFrame = {
  tick: number;
  command: PlayerCommand;
};

export type RunStatus = "flying" | "delivered" | "crashed" | "paused";
export type ObjectivePhase = "pickup" | "delivery" | "complete";
export type LandingGuidanceStatus = "approach" | "too-fast" | "misaligned" | "ready";

export type LandingRating =
  | "Perfect Landing"
  | "Soft Landing"
  | "Spicy Landing"
  | "Cargo Survived Somehow"
  | "Insurance Event";
export type RunMedal = "none" | "bronze" | "silver" | "gold" | "comet";
export type CrashReason = "Hard Landing" | "Hull Collision";

export type RunResultSummary = {
  status: RunStatus;
  elapsedSeconds: number;
  score: number;
  cargoDamage: number;
  fuelUsed: number;
  medal: RunMedal;
  landingRating?: LandingRating;
  crashReason?: CrashReason;
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
  cargoOnboard: boolean;
  lastMilestone?: string;
  approachStreakSeconds: number;
  bestApproachStreakSeconds: number;
  elapsedSeconds: number;
  score: number;
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
  ship: {
    position: Vec2;
    velocity: Vec2;
    rotation: number;
    fuel: number;
    maxFuel: number;
    cargoDamage: number;
  };
  gravitySources: Array<{
    id: string;
    name: string;
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
