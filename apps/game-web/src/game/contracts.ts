export type ContractIdentity = {
  id: string;
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

  if (input.contractId === "gravity-slingshot") {
    return "Gravity Contract";
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
