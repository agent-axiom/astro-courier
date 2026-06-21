type WeeklyChallengeContract = {
  id: string;
  title: string;
  missionType?: string;
  difficultyTier?: string;
};

export type WeeklyChallengeInput = {
  contracts: readonly WeeklyChallengeContract[];
  now: Date;
};

export type WeeklyChallenge = {
  label: "Weekly challenge";
  value: string;
  contractId: string;
  seed: string;
  tone: "raid" | "combat" | "route";
};

export type WeeklyChallengeAction = {
  label: "Open weekly";
  contractId: string;
};

const UTC_DAY_MS = 86_400_000;
const UTC_WEEK_MS = 7 * UTC_DAY_MS;

export function buildWeeklyChallenge(input: WeeklyChallengeInput): WeeklyChallenge | undefined {
  const candidates = input.contracts.filter(isWeeklyChallengeCandidate);
  if (candidates.length === 0) {
    return undefined;
  }

  const week = getUtcWeek(input.now);
  const contract = candidates[week.index % candidates.length];

  return {
    label: "Weekly challenge",
    value: contract.title,
    contractId: contract.id,
    seed: `weekly-${week.key}-${contract.id}`,
    tone: buildWeeklyChallengeTone(contract)
  };
}

export function buildWeeklyChallengeAction(challenge: WeeklyChallenge | undefined, currentContractId: string): WeeklyChallengeAction | undefined {
  if (!challenge || challenge.contractId === currentContractId) {
    return undefined;
  }

  return {
    label: "Open weekly",
    contractId: challenge.contractId
  };
}

function isWeeklyChallengeCandidate(contract: WeeklyChallengeContract): boolean {
  return (
    contract.difficultyTier === "hard" ||
    contract.difficultyTier === "raid" ||
    contract.difficultyTier === "boss" ||
    contract.missionType === "combat" ||
    contract.missionType === "raid" ||
    /forge|siege|interceptor|labyrinth|comet/i.test(contract.id)
  );
}

function buildWeeklyChallengeTone(contract: WeeklyChallengeContract): WeeklyChallenge["tone"] {
  if (contract.difficultyTier === "raid" || contract.difficultyTier === "boss" || contract.missionType === "raid") {
    return "raid";
  }

  if (contract.missionType === "combat" || /interceptor|siege/i.test(contract.id)) {
    return "combat";
  }

  return "route";
}

function getUtcWeek(now: Date): { key: string; index: number } {
  const dayNumber = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / UTC_DAY_MS);
  const dayOfWeek = (new Date(dayNumber * UTC_DAY_MS).getUTCDay() + 6) % 7;
  const weekStartDay = dayNumber - dayOfWeek;
  const weekStart = new Date(weekStartDay * UTC_DAY_MS).toISOString().slice(0, 10);
  return {
    key: weekStart,
    index: Math.floor((weekStartDay * UTC_DAY_MS) / UTC_WEEK_MS)
  };
}
