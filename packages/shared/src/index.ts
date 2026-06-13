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

export type LandingRating =
  | "Perfect Landing"
  | "Soft Landing"
  | "Spicy Landing"
  | "Cargo Survived Somehow"
  | "Insurance Event";

export type RunResultSummary = {
  status: RunStatus;
  elapsedSeconds: number;
  score: number;
  cargoDamage: number;
  fuelUsed: number;
  landingRating?: LandingRating;
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
  elapsedSeconds: number;
  score: number;
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
    destination: boolean;
  }>;
  hazards: Array<{
    id: string;
    type: string;
    position: Vec2;
    radius: number;
    severity: number;
  }>;
};

