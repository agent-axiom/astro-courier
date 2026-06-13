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
