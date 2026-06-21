import type { ObjectivePhase, RunStatus } from "@astro-courier/shared";

export type BossMissionType = "standard" | "longhaul" | "rescue" | "escort" | "raid" | "stealth" | "chase";

export type BossLoopPhase = "breach" | "guard" | "beacon" | "extract";

export type BossLoopInput = {
  contractId: string;
  missionType?: BossMissionType;
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  cargoOnboard: boolean;
  interceptorCount: number;
  riskGateCount: number;
  clearedRiskGateCount: number;
  targetDistance?: number;
};

export type BossLoop = {
  label: "Boss loop";
  phase: BossLoopPhase;
  action: "Breach" | "Break Guard" | "Plant Beacon" | "Extract";
  detail: string;
  tone: "breach" | "danger" | "target" | "complete";
  progress: number;
};

export function buildBossLoop(input: BossLoopInput): BossLoop | undefined {
  if (!isBossMission(input)) {
    return undefined;
  }

  if (input.status === "delivered" || input.objectivePhase === "complete") {
    return bossLoop("extract", "Extract", "Secured", "complete", 1);
  }

  if (input.status === "crashed") {
    return bossLoop("extract", "Extract", "Raid lost", "danger", 1);
  }

  const gateCount = Math.max(0, input.riskGateCount);
  const clearedGateCount = Math.max(0, Math.min(gateCount, input.clearedRiskGateCount));
  if (gateCount > 0 && clearedGateCount < gateCount) {
    return bossLoop("breach", "Breach", `${clearedGateCount}/${gateCount} gates`, "breach", clearedGateCount / gateCount);
  }

  if (input.interceptorCount > 0) {
    return bossLoop(
      "guard",
      "Break Guard",
      `${input.interceptorCount} ${input.interceptorCount === 1 ? "hostile" : "hostiles"}`,
      "danger",
      0.5
    );
  }

  if (input.objectivePhase === "pickup" || !input.cargoOnboard) {
    return bossLoop("beacon", "Plant Beacon", "Reach core", "target", 0.72);
  }

  return bossLoop(
    "extract",
    "Extract",
    input.targetDistance === undefined ? "Dock Forge" : `Dock ${Math.round(input.targetDistance)}m`,
    "complete",
    0.9
  );
}

function isBossMission(input: Pick<BossLoopInput, "contractId" | "missionType">): boolean {
  if (input.missionType === "raid") {
    return true;
  }

  return /boss|forge|flagship|raid|siege/i.test(input.contractId);
}

function bossLoop(phase: BossLoopPhase, action: BossLoop["action"], detail: string, tone: BossLoop["tone"], progress: number): BossLoop {
  return {
    label: "Boss loop",
    phase,
    action,
    detail,
    tone,
    progress: round(clamp(progress, 0, 1), 2)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
