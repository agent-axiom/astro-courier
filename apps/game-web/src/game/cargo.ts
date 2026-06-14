export type CargoManifestInput = {
  cargoName: string;
  cargoOnboard: boolean;
};

export type CargoRiskReadoutInput = {
  cargoKind: string;
  cargoFragility: number;
  cargoDamage: number;
  cargoOnboard: boolean;
  hazardDangerLevel?: "near" | "inside";
  paceSecondsRemaining?: number;
};

export type CargoManifest = {
  label: "Cargo";
  value: string;
};

export type CargoRiskReadout = {
  label: "Cargo risk" | "Cargo stress";
  value: string;
  tone: "normal" | "warning" | "danger";
};

export function buildCargoManifest(input: CargoManifestInput): CargoManifest {
  return {
    label: "Cargo",
    value: input.cargoName
  };
}

export function buildCargoRiskReadout(input: CargoRiskReadoutInput): CargoRiskReadout {
  if (input.cargoOnboard) {
    const integrity = `${Math.round(Math.max(0, 1 - input.cargoDamage) * 100)}%`;
    if (input.hazardDangerLevel === "inside") {
      return {
        label: "Cargo stress",
        value: `${integrity} / contact`,
        tone: "danger"
      };
    }
    if (input.hazardDangerLevel === "near") {
      return {
        label: "Cargo stress",
        value: `${integrity} / hazard near`,
        tone: input.cargoFragility >= 0.95 ? "warning" : "normal"
      };
    }
    if (input.cargoDamage > 0.02) {
      return {
        label: "Cargo stress",
        value: `${integrity} intact`,
        tone: input.cargoDamage >= 0.3 ? "danger" : "warning"
      };
    }
    if (isBrakeSensitiveCargo(input.cargoKind)) {
      return {
        label: "Cargo stress",
        value: "Brake sensitive / keep smooth",
        tone: "warning"
      };
    }
    if (isRushCargo(input)) {
      return {
        label: "Cargo stress",
        value: `Rush window ${formatRushSeconds(input.paceSecondsRemaining)}`,
        tone: getRushCargoTone(input.paceSecondsRemaining)
      };
    }
  }

  if (isRushCargo(input)) {
    return {
      label: "Cargo risk",
      value: `Rush cargo / ${formatRushSeconds(input.paceSecondsRemaining)} gold`,
      tone: getRushCargoTone(input.paceSecondsRemaining)
    };
  }

  if (isBrakeSensitiveCargo(input.cargoKind)) {
    return {
      label: "Cargo risk",
      value: `Brake sensitive / ${input.cargoFragility.toFixed(2)}x`,
      tone: "warning"
    };
  }

  return {
    label: "Cargo risk",
    value: `${titleCase(input.cargoKind)} ${input.cargoFragility.toFixed(2)}x`,
    tone: input.cargoFragility >= 0.95 || input.cargoKind === "unstable" ? "warning" : "normal"
  };
}

export function buildContractCargoTrait(input: Pick<CargoRiskReadoutInput, "cargoKind" | "cargoFragility">): string {
  return buildCargoRiskReadout({
    ...input,
    cargoDamage: 0,
    cargoOnboard: false
  }).value;
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isRushCargo(input: CargoRiskReadoutInput): input is CargoRiskReadoutInput & { paceSecondsRemaining: number } {
  return input.cargoKind === "time-sensitive" && typeof input.paceSecondsRemaining === "number" && input.paceSecondsRemaining > 0;
}

function isBrakeSensitiveCargo(cargoKind: string): boolean {
  return cargoKind === "unstable" || cargoKind === "volatile";
}

function getRushCargoTone(secondsRemaining: number): CargoRiskReadout["tone"] {
  return secondsRemaining <= 5 ? "danger" : "warning";
}

function formatRushSeconds(secondsRemaining: number): string {
  return `${secondsRemaining.toFixed(1)}s`;
}
