export type ContractIdentity = {
  id: string;
};

export type DailyDispatchContract = ContractIdentity & {
  title: string;
};

export type DailyDispatchInput = {
  contracts: readonly DailyDispatchContract[];
  now: Date;
};

export type DailyDispatch = {
  label: "Daily dispatch";
  value: string;
  contractId: string;
  seed: string;
  tone: "daily";
};

export type DailyDispatchAction = {
  label: "Open daily" | "Push daily gold" | "Chase daily comet" | "Race daily ghost" | "Defend daily comet";
  contractId: string;
};

export type DailyDispatchBestRun = {
  medal: "none" | "bronze" | "silver" | "gold" | "comet";
  score?: number;
  elapsedSeconds?: number;
  ghostTrail?: readonly { x: number; y: number }[];
};

export type DailyDispatchStatus = {
  label: "Daily status";
  value: string;
  tone: "open" | "chase" | "ghost" | "comet";
};

export type DailyDispatchReset = {
  label: "Daily reset";
  value: string;
  tone: "steady" | "urgent";
};

export type DailyDispatchPulse = {
  label: "Daily pulse";
  value: string;
  tone: "hot" | "soft" | "steady";
};

export type DailyDispatchProgress = {
  dayKey: string;
  lastContractId: string;
  streak: number;
};

export type DailyDispatchProgressReceipt = {
  label: "Daily streak";
  value: "Daily clear banked" | `${number}-day streak`;
  tone: "fresh" | "streak";
};

export type DailyDispatchProgressStatus = {
  label: "Daily streak";
  value: "Start streak" | "Streak banked" | `${number}-day streak banked` | `Keep ${number}-day streak` | "Rebuild streak";
  tone: "open" | "banked" | "streak" | "reset";
};

export type DailyDispatchClearRecord = {
  progress: DailyDispatchProgress;
  receipt: DailyDispatchProgressReceipt;
};

type DailyDispatchProgressStorage = Pick<Storage, "getItem" | "setItem">;

export type DailyDispatchResultInput = {
  dispatch: DailyDispatch | undefined;
  contractId: string;
  status: "crashed" | "delivered";
  medal: DailyDispatchBestRun["medal"];
  isNewBest: boolean;
};

export type DailyDispatchResult = {
  label: "Daily dispatch";
  value: "Daily route failed" | "Daily PB banked" | "Comet daily clear" | "Gold daily clear" | "Daily clear banked";
  tone: "failed" | "new-best" | "comet" | "gold" | "clear";
};

export type ContractHazardTraitInput = {
  hazardSeverityMultiplier?: number;
};

export type ContractRoutePlanInput = {
  contractId?: string;
  cargoKind: string;
  cargoFragility: number;
  hazardSeverityMultiplier?: number;
  goldSeconds: number;
};

export type ContractPreflightKickerInput = {
  contractId: string;
  hazardSeverityMultiplier?: number;
  goldSeconds: number;
};

export type ContractRoutePlan = {
  label: "Route plan";
  value: string;
  tone: "danger" | "careful" | "speed" | "balanced";
};

export type RoutePressureBriefing = {
  label: "Route pressure";
  value: string;
  tone: "hot" | "tempo" | "care" | "steady";
};

export type LaunchCommitment = {
  label: "Launch intent";
  value: string;
  tone: RoutePressureBriefing["tone"];
};

export type ContractModifierTone = "cargo" | "danger" | "fuel" | "precision" | "speed" | "style";

export type ContractSignatureManeuver = {
  label: "Signature move";
  value: string;
  detail: string;
  tone: ContractModifierTone;
};

export type ContractModifier = {
  label: string;
  value: string;
  tone: ContractModifierTone;
};

export type ContractOptionHook = {
  label: "Pick for";
  value: string;
  tone: ContractModifierTone;
};

export function getNextContractId(contracts: readonly ContractIdentity[], currentContractId: string): string {
  if (contracts.length < 2) {
    return currentContractId;
  }

  const currentIndex = contracts.findIndex((contract) => contract.id === currentContractId);
  if (currentIndex < 0) {
    return currentContractId;
  }

  return contracts[(currentIndex + 1) % contracts.length].id;
}

export function buildDailyDispatch(input: DailyDispatchInput): DailyDispatch | undefined {
  if (input.contracts.length === 0) {
    return undefined;
  }

  const dayKey = input.now.toISOString().slice(0, 10);
  const dayNumber = Math.floor(Date.UTC(input.now.getUTCFullYear(), input.now.getUTCMonth(), input.now.getUTCDate()) / 86_400_000);
  const contract = input.contracts[dayNumber % input.contracts.length];

  return {
    label: "Daily dispatch",
    value: contract.title,
    contractId: contract.id,
    seed: `daily-${dayKey}-${contract.id}`,
    tone: "daily"
  };
}

const DAILY_DISPATCH_PROGRESS_KEY = "astro-courier:daily-progress";
const DAILY_DISPATCH_SEED_DAY_PATTERN = /^daily-(\d{4}-\d{2}-\d{2})-/;
const UTC_DAY_MILLISECONDS = 86_400_000;

export function getDailyDispatchProgress(storage: DailyDispatchProgressStorage): DailyDispatchProgress | undefined {
  const rawProgress = storage.getItem(DAILY_DISPATCH_PROGRESS_KEY);
  if (!rawProgress) {
    return undefined;
  }

  try {
    const parsedProgress: unknown = JSON.parse(rawProgress);
    return isDailyDispatchProgress(parsedProgress) ? parsedProgress : undefined;
  } catch {
    return undefined;
  }
}

export function recordDailyDispatchClear(storage: DailyDispatchProgressStorage, dispatch: DailyDispatch): DailyDispatchClearRecord {
  const dayKey = extractDailyDispatchDayKey(dispatch.seed) ?? dispatch.seed;
  const previousProgress = getDailyDispatchProgress(storage);
  const streak = buildDailyDispatchStreak(previousProgress, dayKey);
  const progress = {
    dayKey,
    lastContractId: dispatch.contractId,
    streak
  };

  storage.setItem(DAILY_DISPATCH_PROGRESS_KEY, JSON.stringify(progress));

  return {
    progress,
    receipt: buildDailyDispatchProgressReceipt(streak)
  };
}

export function buildDailyDispatchProgressStatus(
  dispatch: DailyDispatch | undefined,
  progress: DailyDispatchProgress | undefined
): DailyDispatchProgressStatus | undefined {
  if (!dispatch) {
    return undefined;
  }

  const dayKey = extractDailyDispatchDayKey(dispatch.seed) ?? dispatch.seed;
  if (!progress) {
    return {
      label: "Daily streak",
      value: "Start streak",
      tone: "open"
    };
  }

  const streak = Math.max(1, Math.floor(progress.streak));
  if (progress.dayKey === dayKey) {
    return {
      label: "Daily streak",
      value: streak > 1 ? `${streak}-day streak banked` : "Streak banked",
      tone: "banked"
    };
  }

  if (isNextUtcDay(progress.dayKey, dayKey)) {
    return {
      label: "Daily streak",
      value: `Keep ${streak}-day streak`,
      tone: "streak"
    };
  }

  return {
    label: "Daily streak",
    value: streak > 1 ? "Rebuild streak" : "Start streak",
    tone: streak > 1 ? "reset" : "open"
  };
}

function isDailyDispatchProgress(value: unknown): value is DailyDispatchProgress {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DailyDispatchProgress>;
  return (
    typeof candidate.dayKey === "string" &&
    typeof candidate.lastContractId === "string" &&
    typeof candidate.streak === "number" &&
    Number.isFinite(candidate.streak) &&
    candidate.streak >= 1
  );
}

function buildDailyDispatchStreak(previousProgress: DailyDispatchProgress | undefined, dayKey: string): number {
  if (!previousProgress) {
    return 1;
  }

  if (previousProgress.dayKey === dayKey) {
    return Math.max(1, Math.floor(previousProgress.streak));
  }

  if (isNextUtcDay(previousProgress.dayKey, dayKey)) {
    return Math.max(1, Math.floor(previousProgress.streak)) + 1;
  }

  return 1;
}

function buildDailyDispatchProgressReceipt(streak: number): DailyDispatchProgressReceipt {
  if (streak <= 1) {
    return {
      label: "Daily streak",
      value: "Daily clear banked",
      tone: "fresh"
    };
  }

  return {
    label: "Daily streak",
    value: `${streak}-day streak`,
    tone: "streak"
  };
}

function extractDailyDispatchDayKey(seed: string): string | undefined {
  return DAILY_DISPATCH_SEED_DAY_PATTERN.exec(seed)?.[1];
}

function isNextUtcDay(previousDayKey: string, currentDayKey: string): boolean {
  const previousDayNumber = parseUtcDayNumber(previousDayKey);
  const currentDayNumber = parseUtcDayNumber(currentDayKey);
  return previousDayNumber !== undefined && currentDayNumber !== undefined && currentDayNumber - previousDayNumber === 1;
}

function parseUtcDayNumber(dayKey: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return undefined;
  }

  return Math.floor(date.getTime() / UTC_DAY_MILLISECONDS);
}

export function buildDailyDispatchAction(
  dispatch: DailyDispatch | undefined,
  currentContractId: string,
  status?: DailyDispatchStatus
): DailyDispatchAction | undefined {
  if (!dispatch || dispatch.contractId === currentContractId) {
    return undefined;
  }

  return {
    label: buildDailyDispatchActionLabel(status),
    contractId: dispatch.contractId
  };
}

function buildDailyDispatchActionLabel(status: DailyDispatchStatus | undefined): DailyDispatchAction["label"] {
  if (!status || status.tone === "open") {
    return "Open daily";
  }

  if (status.tone === "ghost") {
    return "Race daily ghost";
  }

  if (status.tone === "comet") {
    return "Defend daily comet";
  }

  if (status.value === "Push daily gold" || status.value.startsWith("PB ")) {
    return "Push daily gold";
  }

  return "Chase daily comet";
}

export function buildDailyDispatchBadge(dispatch: DailyDispatch | undefined, contractId: string): string | undefined {
  return dispatch?.contractId === contractId ? "Daily route" : undefined;
}

export function buildContractSelectionBadge(currentContractId: string, contractId: string): string | undefined {
  return currentContractId === contractId ? "Current route" : undefined;
}

export function buildDailyDispatchStatus(
  dispatch: DailyDispatch | undefined,
  bestRun: DailyDispatchBestRun | undefined
): DailyDispatchStatus | undefined {
  if (!dispatch) {
    return undefined;
  }

  if (!bestRun || bestRun.medal === "none") {
    return {
      label: "Daily status",
      value: "First daily clear",
      tone: "open"
    };
  }

  const dailyBest = formatDailyBestRun(bestRun);
  if (dailyBest) {
    return {
      label: "Daily status",
      value: dailyBest,
      tone: bestRun.medal === "comet" ? "comet" : hasReplayTrail(bestRun) ? "ghost" : "chase"
    };
  }

  if (bestRun.medal === "comet") {
    return {
      label: "Daily status",
      value: "Comet held",
      tone: "comet"
    };
  }

  if (bestRun.medal === "bronze" || bestRun.medal === "silver") {
    return {
      label: "Daily status",
      value: "Push daily gold",
      tone: "chase"
    };
  }

  return {
    label: "Daily status",
    value: "Chase daily comet",
    tone: "chase"
  };
}

function formatDailyBestRun(bestRun: DailyDispatchBestRun): string | undefined {
  if (bestRun.score === undefined || bestRun.elapsedSeconds === undefined) {
    return undefined;
  }

  const result = `${Math.round(bestRun.score)} / ${bestRun.elapsedSeconds.toFixed(1)}s`;
  if (bestRun.medal === "comet") {
    return `Comet PB ${result}`;
  }
  if (hasReplayTrail(bestRun)) {
    return `Ghost PB ${result}`;
  }
  if (bestRun.medal === "gold") {
    return `Gold PB ${result}`;
  }
  return `PB ${result}`;
}

function hasReplayTrail(bestRun: DailyDispatchBestRun): boolean {
  return (bestRun.ghostTrail?.length ?? 0) >= 2;
}

export function buildDailyDispatchReset(dispatch: DailyDispatch | undefined, now: Date): DailyDispatchReset | undefined {
  if (!dispatch) {
    return undefined;
  }

  const nextUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const millisecondsRemaining = Math.max(0, nextUtcMidnight - now.getTime());
  const urgent = millisecondsRemaining <= 60 * 60 * 1000;
  const resetPrefix = urgent ? "Final " : "";
  return {
    label: "Daily reset",
    value: `${resetPrefix}${formatResetTime(millisecondsRemaining)} left`,
    tone: urgent ? "urgent" : "steady"
  };
}

export function buildDailyDispatchPulse(dispatch: DailyDispatch | undefined): DailyDispatchPulse | undefined {
  if (!dispatch) {
    return undefined;
  }

  const percent = Math.round((dailyHazardPulse(dispatch.seed) - 1) * 100);
  if (Math.abs(percent) <= 3) {
    return {
      label: "Daily pulse",
      value: "Hazards stable",
      tone: "steady"
    };
  }

  return {
    label: "Daily pulse",
    value: `Hazards ${percent > 0 ? "+" : ""}${percent}%`,
    tone: percent > 0 ? "hot" : "soft"
  };
}

export function buildActiveDailyDispatchPulse(dispatch: DailyDispatch | undefined, currentContractId: string): DailyDispatchPulse | undefined {
  if (!dispatch || dispatch.contractId !== currentContractId) {
    return undefined;
  }

  return buildDailyDispatchPulse(dispatch);
}

export function buildActiveDailyDispatchProgressStatus(
  dispatch: DailyDispatch | undefined,
  currentContractId: string,
  progress: DailyDispatchProgress | undefined
): DailyDispatchProgressStatus | undefined {
  if (!dispatch || dispatch.contractId !== currentContractId) {
    return undefined;
  }

  return buildDailyDispatchProgressStatus(dispatch, progress);
}

export function buildDailyDispatchResult(input: DailyDispatchResultInput): DailyDispatchResult | undefined {
  if (!input.dispatch || input.dispatch.contractId !== input.contractId) {
    return undefined;
  }

  if (input.status === "crashed") {
    return {
      label: "Daily dispatch",
      value: "Daily route failed",
      tone: "failed"
    };
  }

  if (input.isNewBest) {
    return {
      label: "Daily dispatch",
      value: "Daily PB banked",
      tone: "new-best"
    };
  }

  if (input.medal === "comet") {
    return {
      label: "Daily dispatch",
      value: "Comet daily clear",
      tone: "comet"
    };
  }

  if (input.medal === "gold") {
    return {
      label: "Daily dispatch",
      value: "Gold daily clear",
      tone: "gold"
    };
  }

  return {
    label: "Daily dispatch",
    value: "Daily clear banked",
    tone: "clear"
  };
}

function formatResetTime(millisecondsRemaining: number): string {
  const totalSeconds = Math.floor(millisecondsRemaining / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function dailyHazardPulse(seed: string): number {
  return 0.9 + deterministicUnit(`${seed}:daily-pulse`) * 0.2;
}

function deterministicUnit(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

export function buildContractHazardTrait(input: ContractHazardTraitInput): string | undefined {
  if (input.hazardSeverityMultiplier === undefined || input.hazardSeverityMultiplier <= 1) {
    return undefined;
  }
  return `Hazard ${input.hazardSeverityMultiplier.toFixed(2)}x`;
}

export function buildContractDangerPayTrait(input: ContractHazardTraitInput): string | undefined {
  if (input.hazardSeverityMultiplier === undefined || input.hazardSeverityMultiplier <= 1) {
    return undefined;
  }
  return `Danger pay +${Math.round((input.hazardSeverityMultiplier - 1) * 400)}`;
}

export function buildContractPreflightKicker(input: ContractPreflightKickerInput): string {
  if (input.contractId === "first-light-delivery") {
    return "Starter Contract";
  }

  if (input.contractId === "return-leg") {
    return "Return Contract";
  }

  if (input.contractId === "gravity-slingshot") {
    return "Gravity Contract";
  }

  if (input.contractId === "asteroid-sprint") {
    return "Asteroid Contract";
  }

  if (input.contractId === "asteroid-labyrinth") {
    return "Bonus Contract";
  }

  if (input.contractId === "chain-relay") {
    return "Chain Contract";
  }

  if (input.contractId === "antimatter-drift") {
    return "Antimatter Contract";
  }

  if (input.contractId === "last-drop-run") {
    return "Last Drop Contract";
  }

  if ((input.hazardSeverityMultiplier ?? 1) >= 1.25) {
    return "Danger Contract";
  }

  if (input.goldSeconds <= 30) {
    return "Sprint Contract";
  }

  return "Courier Contract";
}

export function buildContractRoutePlan(input: ContractRoutePlanInput): ContractRoutePlan {
  if (input.contractId === "gravity-slingshot") {
    return {
      label: "Route plan",
      value: "Ride gravity, bleed speed",
      tone: "speed"
    };
  }

  if (input.contractId === "return-leg") {
    return {
      label: "Route plan",
      value: "Reverse line, brake planet-side",
      tone: "speed"
    };
  }

  if (input.contractId === "asteroid-sprint") {
    return {
      label: "Route plan",
      value: "Thread field, cash danger",
      tone: "danger"
    };
  }

  if (input.contractId === "asteroid-labyrinth") {
    return {
      label: "Route plan",
      value: "Read gaps, thread gates",
      tone: "danger"
    };
  }

  if (input.contractId === "chain-relay") {
    return {
      label: "Route plan",
      value: "Skim, chain, fast dock",
      tone: "danger"
    };
  }

  if (input.contractId === "last-drop-run") {
    return {
      label: "Route plan",
      value: "Preserve fuel, dock empty",
      tone: "speed"
    };
  }

  if (input.contractId === "antimatter-drift") {
    return {
      label: "Route plan",
      value: "Coast arc, no brake",
      tone: "careful"
    };
  }

  if ((input.hazardSeverityMultiplier ?? 1) >= 1.25) {
    return {
      label: "Route plan",
      value: "Skim wide, cash danger",
      tone: "danger"
    };
  }

  if (input.cargoKind === "fragile" || input.cargoFragility < 0.9) {
    return {
      label: "Route plan",
      value: "Soft dock, protect cargo",
      tone: "careful"
    };
  }

  if (input.goldSeconds <= 25) {
    return {
      label: "Route plan",
      value: "Minimal burns, fast dock",
      tone: "speed"
    };
  }

  return {
    label: "Route plan",
    value: "Clean line, spare fuel",
    tone: "balanced"
  };
}

export function buildRoutePressureBriefing(input: ContractRoutePlanInput): RoutePressureBriefing {
  const hazardLoad = input.hazardSeverityMultiplier ?? 1;
  if (
    input.contractId === "asteroid-sprint" ||
    input.contractId === "asteroid-labyrinth" ||
    input.contractId === "chain-relay" ||
    (hazardLoad >= 1.25 && input.goldSeconds <= 25)
  ) {
    return {
      label: "Route pressure",
      value: "High risk / high payout",
      tone: "hot"
    };
  }

  if (input.contractId === "last-drop-run" || input.cargoKind === "time-sensitive") {
    return {
      label: "Route pressure",
      value: "Fuel squeeze / late reward",
      tone: "tempo"
    };
  }

  if (input.contractId === "antimatter-drift") {
    return {
      label: "Route pressure",
      value: "Brake stress / clean dock",
      tone: "care"
    };
  }

  if (input.cargoKind === "fragile" || input.cargoFragility < 0.9) {
    return {
      label: "Route pressure",
      value: "Clean handling / soft dock",
      tone: "care"
    };
  }

  return {
    label: "Route pressure",
    value: "Balanced courier line",
    tone: "steady"
  };
}

export function buildLaunchCommitment(input: ContractRoutePlanInput): LaunchCommitment {
  if (input.contractId === "antimatter-drift") {
    return {
      label: "Launch intent",
      value: "Commit no-brake drift",
      tone: "care"
    };
  }

  const pressure = buildRoutePressureBriefing(input);
  if (pressure.tone === "hot") {
    return {
      label: "Launch intent",
      value: "Commit high payout run",
      tone: pressure.tone
    };
  }

  if (pressure.tone === "tempo") {
    return {
      label: "Launch intent",
      value: "Commit fuel clutch",
      tone: pressure.tone
    };
  }

  if (pressure.tone === "care") {
    return {
      label: "Launch intent",
      value: "Commit clean cargo",
      tone: pressure.tone
    };
  }

  return {
    label: "Launch intent",
    value: "Commit clean courier line",
    tone: pressure.tone
  };
}

export function buildContractOptionHook(input: ContractRoutePlanInput): ContractOptionHook {
  if (input.contractId === "gravity-slingshot") {
    return {
      label: "Pick for",
      value: "Gravity arc mastery",
      tone: "style"
    };
  }

  if (input.contractId === "chain-relay") {
    return {
      label: "Pick for",
      value: "Style chain pressure",
      tone: "style"
    };
  }

  if (input.contractId === "last-drop-run") {
    return {
      label: "Pick for",
      value: "Fuel clutch finish",
      tone: "fuel"
    };
  }

  if (input.contractId === "antimatter-drift") {
    return {
      label: "Pick for",
      value: "No-brake drift mastery",
      tone: "precision"
    };
  }

  if (input.contractId === "asteroid-labyrinth") {
    return {
      label: "Pick for",
      value: "Asteroid maze puzzle",
      tone: "danger"
    };
  }

  if (input.contractId === "asteroid-sprint" || ((input.hazardSeverityMultiplier ?? 1) >= 1.25 && input.goldSeconds <= 25)) {
    return {
      label: "Pick for",
      value: "Danger pay chase",
      tone: "danger"
    };
  }

  if (input.contractId === "return-leg") {
    return {
      label: "Pick for",
      value: "Reverse line proof",
      tone: "precision"
    };
  }

  if (input.cargoKind === "fragile" || input.cargoFragility < 0.9) {
    return {
      label: "Pick for",
      value: "Clean cargo control",
      tone: "precision"
    };
  }

  if (input.cargoKind === "unstable") {
    return {
      label: "Pick for",
      value: "Brake discipline",
      tone: "cargo"
    };
  }

  if (input.goldSeconds <= 25) {
    return {
      label: "Pick for",
      value: "Gold split sprint",
      tone: "speed"
    };
  }

  return {
    label: "Pick for",
    value: "Clean PB setup",
    tone: "cargo"
  };
}

export function buildContractSignatureManeuver(input: ContractRoutePlanInput): ContractSignatureManeuver {
  if (input.contractId === "gravity-slingshot") {
    return {
      label: "Signature move",
      value: "Gravity Sling",
      detail: "Ride the well, then brake the dock",
      tone: "style"
    };
  }

  if (input.contractId === "chain-relay") {
    return {
      label: "Signature move",
      value: "Chain Finish",
      detail: "Keep the combo alive to delivery",
      tone: "style"
    };
  }

  if (input.contractId === "last-drop-run") {
    return {
      label: "Signature move",
      value: "Last Drop",
      detail: "Arrive under 5% fuel",
      tone: "fuel"
    };
  }

  if (input.contractId === "antimatter-drift") {
    return {
      label: "Signature move",
      value: "Antimatter Drift",
      detail: "Coast clean; brake rattles cargo",
      tone: "precision"
    };
  }

  if (input.contractId === "asteroid-sprint") {
    return {
      label: "Signature move",
      value: "Needle Thread",
      detail: "Cross the field through a clean gap",
      tone: "danger"
    };
  }

  if (input.contractId === "asteroid-labyrinth") {
    return {
      label: "Signature move",
      value: "Maze Thread",
      detail: "Read the gaps, clear every gate",
      tone: "danger"
    };
  }

  if (input.contractId === "return-leg") {
    return {
      label: "Signature move",
      value: "No Brake Finesse",
      detail: "Reverse the line, coast the dock",
      tone: "precision"
    };
  }

  if ((input.hazardSeverityMultiplier ?? 1) >= 1.25) {
    return {
      label: "Signature move",
      value: "Clean Hazard Skim",
      detail: "Brush danger, keep cargo clean",
      tone: "danger"
    };
  }

  if (input.cargoKind === "fragile" || input.cargoFragility < 0.9) {
    return {
      label: "Signature move",
      value: "Perfect Approach",
      detail: "Slow hands, soft dock",
      tone: "precision"
    };
  }

  if (input.cargoKind === "time-sensitive") {
    return {
      label: "Signature move",
      value: "Quick Pickup",
      detail: "Load fast, then protect the line",
      tone: "speed"
    };
  }

  if (input.goldSeconds <= 25) {
    return {
      label: "Signature move",
      value: "Express Finish",
      detail: "Fast line, clean stop",
      tone: "speed"
    };
  }

  return {
    label: "Signature move",
    value: "Eco Drift",
    detail: "Spare fuel for a cleaner finish",
    tone: "cargo"
  };
}

export function buildContractModifiers(input: ContractRoutePlanInput): ContractModifier[] {
  if (input.contractId === "gravity-slingshot") {
    return [
      { label: "Sling", value: "+240 style", tone: "style" },
      { label: "Speed", value: "54+ entry", tone: "speed" },
      { label: "Cargo", value: "Soft dock", tone: "precision" }
    ];
  }

  if (input.contractId === "chain-relay") {
    return [
      { label: "Chain", value: "5.5s relay", tone: "style" },
      { label: "Hazard", value: formatHazardField(input.hazardSeverityMultiplier), tone: "danger" },
      { label: "Pace", value: `Gold ${input.goldSeconds}s`, tone: "speed" }
    ];
  }

  if (input.contractId === "asteroid-sprint") {
    return [
      { label: "Thread", value: "Needle pay", tone: "danger" },
      { label: "Hazard", value: formatHazardField(input.hazardSeverityMultiplier), tone: "danger" },
      { label: "Pace", value: `Gold ${input.goldSeconds}s`, tone: "speed" }
    ];
  }

  if (input.contractId === "asteroid-labyrinth") {
    return [
      { label: "Maze", value: "5 gates", tone: "danger" },
      { label: "Thread", value: "Clean gaps", tone: "precision" },
      { label: "Pace", value: `Gold ${input.goldSeconds}s`, tone: "speed" }
    ];
  }

  if (input.contractId === "last-drop-run") {
    return [
      { label: "Fuel", value: "Below 5%", tone: "fuel" },
      { label: "Burns", value: "Minimal", tone: "speed" },
      { label: "Cargo", value: cargoModifierValue(input), tone: cargoModifierTone(input) }
    ];
  }

  if (input.contractId === "antimatter-drift") {
    return [
      { label: "Drift", value: "+210 style", tone: "style" },
      { label: "Brake", value: "No taps", tone: "precision" },
      { label: "Cargo", value: cargoModifierValue(input), tone: cargoModifierTone(input) }
    ];
  }

  if (input.contractId === "return-leg") {
    return [
      { label: "Line", value: "Reverse route", tone: "precision" },
      { label: "Pace", value: `Gold ${input.goldSeconds}s`, tone: "speed" },
      { label: "Cargo", value: cargoModifierValue(input), tone: cargoModifierTone(input) }
    ];
  }

  return [
    { label: "Hazard", value: formatHazardField(input.hazardSeverityMultiplier), tone: hazardModifierTone(input.hazardSeverityMultiplier) },
    { label: "Pace", value: `Gold ${input.goldSeconds}s`, tone: input.goldSeconds <= 30 ? "speed" : "precision" },
    { label: "Cargo", value: cargoModifierValue(input), tone: cargoModifierTone(input) }
  ];
}

function formatHazardField(multiplier: number | undefined): string {
  const value = multiplier ?? 1;
  return value > 1 ? `${value.toFixed(2)}x field` : "Standard field";
}

function hazardModifierTone(multiplier: number | undefined): ContractModifierTone {
  return (multiplier ?? 1) > 1 ? "danger" : "precision";
}

function cargoModifierValue(input: ContractRoutePlanInput): string {
  if (input.cargoKind === "time-sensitive") {
    return "Rush cargo";
  }
  if (input.cargoFragility < 0.9 || input.cargoKind === "fragile") {
    return "Fragile load";
  }
  if (input.cargoKind === "volatile") {
    return "Volatile load";
  }
  if (input.cargoKind === "unstable") {
    return "Brake sensitive";
  }
  return "Standard load";
}

function cargoModifierTone(input: ContractRoutePlanInput): ContractModifierTone {
  if (input.cargoKind === "time-sensitive") {
    return "speed";
  }
  if (input.cargoFragility < 0.9 || input.cargoKind === "fragile") {
    return "precision";
  }
  if (input.cargoKind === "volatile" || input.cargoKind === "unstable") {
    return "cargo";
  }
  return "cargo";
}
