export type ContractMedalTimes = {
  bronze: number;
  silver: number;
  gold: number;
};

export type ContractPaceTier = "gold" | "silver" | "bronze" | "overtime";

export type ContractPace = {
  tier: ContractPaceTier;
  secondsRemaining: number;
};

export function calculateContractPace(elapsedSeconds: number, medalTimes: ContractMedalTimes): ContractPace {
  if (elapsedSeconds <= medalTimes.gold) {
    return {
      tier: "gold",
      secondsRemaining: round(medalTimes.gold - elapsedSeconds)
    };
  }

  if (elapsedSeconds <= medalTimes.silver) {
    return {
      tier: "silver",
      secondsRemaining: round(medalTimes.silver - elapsedSeconds)
    };
  }

  if (elapsedSeconds <= medalTimes.bronze) {
    return {
      tier: "bronze",
      secondsRemaining: round(medalTimes.bronze - elapsedSeconds)
    };
  }

  return {
    tier: "overtime",
    secondsRemaining: 0
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
