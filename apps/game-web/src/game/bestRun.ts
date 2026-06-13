import type { RunMedal, RunStatus, Vec2 } from "@astro-courier/shared";

export type BestRun = {
  score: number;
  elapsedSeconds: number;
  medal: RunMedal;
  ghostTrail?: Vec2[];
};

export type BestRunChase = {
  label: "First clear" | "PB target";
  value: string;
  tone: "empty" | "target";
};

export type ContractMasteryBadge = {
  label: "Mastery";
  value: "Open" | "Cleared" | "Comet";
  tone: "open" | "cleared" | "comet";
};

export type BestRunDeltaInput = {
  bestRun: BestRun | undefined;
  run: BestRun;
  isNewBest: boolean;
};

export type BestRunDelta = {
  label: "PB delta";
  value: string;
  tone: "success" | "chase";
};

export type LiveBestPaceInput = {
  bestRun: BestRun | undefined;
  score?: number;
  elapsedSeconds: number;
  targetDistance?: number;
  status: RunStatus;
};

export type LiveBestPace = {
  label: "PB pace" | "PB chase" | "PB clutch";
  value: string;
  tone: "ahead" | "behind" | "clutch";
};

export type RouteBoardContract = {
  id: string;
};

export type RouteBoardTargetContract = RouteBoardContract & {
  title: string;
};

export type RouteBoardProgress = {
  label: "Routes cleared" | "Comet clears";
  value: string;
  tone: "open" | "progress" | "mastery" | "complete";
};

export type RouteBoardTarget = {
  label: "Next clear" | "Comet chase" | "Board status";
  value: string;
  tone: "clear" | "comet" | "complete";
  contractId?: string;
};

export type RouteBoardSelectionAction = {
  label: "Select target";
  contractId: string;
};

export type RouteBoardRecommendationBadge = "Clear" | "Comet" | "Relay";

type BestRunStorage = Pick<Storage, "getItem" | "setItem">;

export function getBestRun(storage: BestRunStorage, contractKey: string): BestRun | undefined {
  const raw = storage.getItem(storageKey(contractKey));
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BestRun>;
    if (typeof parsed.score !== "number" || typeof parsed.elapsedSeconds !== "number" || !parsed.medal) {
      return undefined;
    }
    const ghostTrail = parseGhostTrail(parsed.ghostTrail);
    return {
      score: parsed.score,
      elapsedSeconds: parsed.elapsedSeconds,
      medal: parsed.medal,
      ...(ghostTrail ? { ghostTrail } : {})
    };
  } catch {
    return undefined;
  }
}

export function recordBestRun(
  storage: BestRunStorage,
  contractKey: string,
  run: BestRun
): { best: BestRun; isNewBest: boolean } {
  const current = getBestRun(storage, contractKey);
  if (current && !isBetterRun(run, current)) {
    return { best: current, isNewBest: false };
  }

  storage.setItem(storageKey(contractKey), JSON.stringify(run));
  return { best: run, isNewBest: true };
}

export function buildBestRunChase(bestRun: BestRun | undefined): BestRunChase {
  if (!bestRun) {
    return {
      label: "First clear",
      value: "Sets personal best",
      tone: "empty"
    };
  }

  return {
    label: "PB target",
    value: `${bestRun.score} / ${bestRun.elapsedSeconds.toFixed(1)}s`,
    tone: "target"
  };
}

export function buildContractBestRunLabel(bestRun: BestRun | undefined): string {
  if (!bestRun) {
    return "PB open";
  }

  return `PB ${bestRun.score} / ${bestRun.elapsedSeconds.toFixed(1)}s`;
}

export function buildContractMasteryBadge(bestRun: BestRun | undefined): ContractMasteryBadge {
  if (!bestRun) {
    return { label: "Mastery", value: "Open", tone: "open" };
  }

  if (bestRun.medal === "comet") {
    return { label: "Mastery", value: "Comet", tone: "comet" };
  }

  return { label: "Mastery", value: "Cleared", tone: "cleared" };
}

export function buildRouteBoardProgress(
  contracts: readonly RouteBoardContract[],
  bestRunsByContract: Readonly<Record<string, BestRun | undefined>>
): RouteBoardProgress[] {
  const total = contracts.length;
  const bestRuns = contracts.map((contract) => bestRunsByContract[contract.id]);
  const cleared = bestRuns.filter(Boolean).length;
  const comets = bestRuns.filter((bestRun) => bestRun?.medal === "comet").length;

  return [
    {
      label: "Routes cleared",
      value: `${cleared}/${total}`,
      tone: progressTone(cleared, total)
    },
    {
      label: "Comet clears",
      value: `${comets}/${total}`,
      tone: comets === total && total > 0 ? "complete" : comets > 0 ? "mastery" : "open"
    }
  ];
}

export function buildRouteBoardTarget(
  contracts: readonly RouteBoardTargetContract[],
  bestRunsByContract: Readonly<Record<string, BestRun | undefined>>
): RouteBoardTarget {
  const unclearedContract = contracts.find((contract) => !bestRunsByContract[contract.id]);
  if (unclearedContract) {
    return {
      label: "Next clear",
      value: `Clear ${unclearedContract.title}`,
      tone: "clear",
      contractId: unclearedContract.id
    };
  }

  const unmasteredContract = contracts
    .filter((contract) => bestRunsByContract[contract.id]?.medal !== "comet")
    .sort((left, right) => medalRank(bestRunsByContract[right.id]?.medal) - medalRank(bestRunsByContract[left.id]?.medal))[0];
  if (unmasteredContract) {
    return {
      label: "Comet chase",
      value: `Comet ${unmasteredContract.title}`,
      tone: "comet",
      contractId: unmasteredContract.id
    };
  }

  return { label: "Board status", value: "Board mastered", tone: "complete" };
}

export function buildRouteBoardSelectionAction(
  routeBoardTarget: RouteBoardTarget,
  currentContractId: string
): RouteBoardSelectionAction | undefined {
  if (!routeBoardTarget.contractId || routeBoardTarget.contractId === currentContractId) {
    return undefined;
  }

  return { label: "Select target", contractId: routeBoardTarget.contractId };
}

export function buildRouteBoardRecommendationBadge(routeBoardTarget: RouteBoardTarget): RouteBoardRecommendationBadge | undefined {
  if (routeBoardTarget.tone === "clear") {
    if (routeBoardTarget.contractId === "chain-relay") {
      return "Relay";
    }
    return "Clear";
  }
  if (routeBoardTarget.tone === "comet") {
    return "Comet";
  }
  return undefined;
}

export function buildBestRunDelta(input: BestRunDeltaInput): BestRunDelta | undefined {
  if (!input.bestRun) {
    return undefined;
  }

  if (input.isNewBest) {
    return {
      label: "PB delta",
      value: "New personal best",
      tone: "success"
    };
  }

  const scoreGap = input.bestRun.score - input.run.score;
  if (scoreGap > 0) {
    return {
      label: "PB delta",
      value: `Need +${Math.round(scoreGap)} score`,
      tone: "chase"
    };
  }

  const timeGap = input.run.elapsedSeconds - input.bestRun.elapsedSeconds;
  if (timeGap <= 0.05) {
    return {
      label: "PB delta",
      value: "Matched personal best",
      tone: "success"
    };
  }

  return {
    label: "PB delta",
    value: `Need ${timeGap.toFixed(1)}s faster`,
    tone: "chase"
  };
}

export function buildLiveBestPace(input: LiveBestPaceInput): LiveBestPace | undefined {
  if (!input.bestRun || input.status === "delivered" || input.status === "crashed") {
    return undefined;
  }

  const scoreDelta = (input.score ?? 0) - input.bestRun.score;
  if (scoreDelta > 0) {
    if ((input.targetDistance ?? Number.POSITIVE_INFINITY) <= 150) {
      return {
        label: "PB clutch",
        value: `Defend +${Math.round(scoreDelta)} into dock`,
        tone: "clutch"
      };
    }
    return {
      label: "PB chase",
      value: `+${Math.round(scoreDelta)} score lead`,
      tone: "ahead"
    };
  }

  const secondsDelta = input.bestRun.elapsedSeconds - input.elapsedSeconds;
  if (input.score !== undefined && scoreDelta < 0 && secondsDelta < 0) {
    return {
      label: "PB chase",
      value: `Need +${Math.round(Math.abs(scoreDelta))} score`,
      tone: "behind"
    };
  }

  if (secondsDelta >= 0) {
    return {
      label: "PB pace",
      value: `${secondsDelta.toFixed(1)}s bank`,
      tone: "ahead"
    };
  }

  return {
    label: "PB pace",
    value: `${Math.abs(secondsDelta).toFixed(1)}s over`,
    tone: "behind"
  };
}

function isBetterRun(candidate: BestRun, current: BestRun): boolean {
  if (candidate.score !== current.score) {
    return candidate.score > current.score;
  }
  return candidate.elapsedSeconds < current.elapsedSeconds;
}

function progressTone(count: number, total: number): RouteBoardProgress["tone"] {
  if (total > 0 && count === total) {
    return "complete";
  }
  return count > 0 ? "progress" : "open";
}

function medalRank(medal: RunMedal | undefined): number {
  switch (medal) {
    case "comet":
      return 4;
    case "gold":
      return 3;
    case "silver":
      return 2;
    case "bronze":
      return 1;
    default:
      return 0;
  }
}

function storageKey(contractKey: string): string {
  return `astro-courier:best-run:${contractKey}`;
}

function parseGhostTrail(value: unknown): Vec2[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const trail = value.flatMap((point) => {
    if (
      point &&
      typeof point === "object" &&
      typeof (point as Partial<Vec2>).x === "number" &&
      typeof (point as Partial<Vec2>).y === "number" &&
      Number.isFinite((point as Partial<Vec2>).x) &&
      Number.isFinite((point as Partial<Vec2>).y)
    ) {
      return [{ x: (point as Vec2).x, y: (point as Vec2).y }];
    }
    return [];
  });

  return trail.length >= 2 ? trail : undefined;
}
