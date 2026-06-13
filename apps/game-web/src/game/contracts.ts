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
  label: "Open daily";
  contractId: string;
};

export type DailyDispatchBestRun = {
  medal: "none" | "bronze" | "silver" | "gold" | "comet";
  score?: number;
  elapsedSeconds?: number;
};

export type DailyDispatchStatus = {
  label: "Daily status";
  value: string;
  tone: "open" | "chase" | "comet";
};

export type DailyDispatchReset = {
  label: "Daily reset";
  value: string;
  tone: "steady" | "urgent";
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

export function buildDailyDispatchAction(dispatch: DailyDispatch | undefined, currentContractId: string): DailyDispatchAction | undefined {
  if (!dispatch || dispatch.contractId === currentContractId) {
    return undefined;
  }

  return {
    label: "Open daily",
    contractId: dispatch.contractId
  };
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
      tone: bestRun.medal === "comet" ? "comet" : "chase"
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
  if (bestRun.medal === "gold") {
    return `Gold PB ${result}`;
  }
  return `PB ${result}`;
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

  if (input.contractId === "chain-relay") {
    return "Chain Contract";
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
  if (input.contractId === "asteroid-sprint" || input.contractId === "chain-relay" || (hazardLoad >= 1.25 && input.goldSeconds <= 25)) {
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

  if (input.contractId === "last-drop-run") {
    return [
      { label: "Fuel", value: "Below 5%", tone: "fuel" },
      { label: "Burns", value: "Minimal", tone: "speed" },
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
  if (input.cargoKind === "volatile" || input.cargoKind === "unstable") {
    return "Stable load";
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
