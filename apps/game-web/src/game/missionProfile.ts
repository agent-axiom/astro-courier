export type MissionProfileContract = {
  id: string;
  title: string;
  missionType?: "standard" | "longhaul" | "rescue" | "escort" | "raid" | "stealth" | "chase";
  difficultyTier?: "standard" | "hard" | "raid" | "boss";
  riskLabel: string;
  rewardLabel: string;
  refuelStationIds?: readonly string[];
  riskGateCount?: number;
  enemyWave?: Readonly<Record<string, number | undefined>>;
};

export type MissionProfile = {
  label: "Standard route" | "Relay route" | "Rescue run" | "Escort lane" | "Assault route" | "Boss route" | "Silent run" | "Comet chase" | "Maze route";
  value: string;
  detail: string;
  tone: "standard" | "relay" | "rescue" | "escort" | "assault" | "boss" | "stealth" | "chase" | "maze";
};

export function buildMissionProfile(contract: MissionProfileContract | undefined): MissionProfile | undefined {
  if (!contract) {
    return undefined;
  }

  if (contract.difficultyTier === "boss" || contract.id.includes("flagship")) {
    return { label: "Boss route", value: "Break guard", detail: enemyCountLabel(contract), tone: "boss" };
  }

  if (contract.missionType === "stealth") {
    return { label: "Silent run", value: "Stay quiet", detail: "Low signature", tone: "stealth" };
  }

  if (contract.missionType === "chase") {
    return {
      label: "Comet chase",
      value: "Catch target",
      detail: gateLabel(contract.riskGateCount),
      tone: "chase"
    };
  }

  if (contract.riskGateCount && contract.riskLabel.toLowerCase().includes("maze")) {
    return { label: "Maze route", value: "Thread gates", detail: gateLabel(contract.riskGateCount), tone: "maze" };
  }

  if (contract.missionType === "longhaul" || (contract.refuelStationIds?.length ?? 0) > 0) {
    return {
      label: "Relay route",
      value: `Refuel x${Math.max(1, contract.refuelStationIds?.length ?? 1)}`,
      detail: gateLabel(contract.riskGateCount),
      tone: "relay"
    };
  }

  if (contract.missionType === "rescue") {
    return { label: "Rescue run", value: "Soft cargo", detail: contract.rewardLabel, tone: "rescue" };
  }

  if (contract.missionType === "escort") {
    return { label: "Escort lane", value: "Guard route", detail: enemyCountLabel(contract), tone: "escort" };
  }

  if (contract.missionType === "raid" || contract.difficultyTier === "raid" || contract.id.includes("forge")) {
    return { label: "Assault route", value: "Capture dock", detail: enemyCountLabel(contract), tone: "assault" };
  }

  return { label: "Standard route", value: "Deliver clean", detail: contract.riskLabel, tone: "standard" };
}

function gateLabel(count: number | undefined): string {
  const gates = Math.max(0, Math.floor(count ?? 0));
  if (gates <= 0) {
    return "Clean line";
  }
  return `${gates} ${gates === 1 ? "gate" : "gates"}`;
}

function enemyCountLabel(contract: Pick<MissionProfileContract, "enemyWave">): string {
  const enemyCount = Object.values(contract.enemyWave ?? {}).reduce<number>((total, count) => total + Math.max(0, Math.floor(count ?? 0)), 0);
  if (enemyCount <= 0) {
    return "No patrol";
  }
  return `${enemyCount} hostiles`;
}
