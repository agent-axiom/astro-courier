import type { RunMedal, RunStatus } from "@astro-courier/shared";

export type BestRun = {
  score: number;
  elapsedSeconds: number;
  medal: RunMedal;
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
  elapsedSeconds: number;
  status: RunStatus;
};

export type LiveBestPace = {
  label: "PB pace";
  value: string;
  tone: "ahead" | "behind";
};

export type RouteBoardContract = {
  id: string;
};

export type RouteBoardProgress = {
  label: "Routes cleared" | "Comet clears";
  value: string;
  tone: "open" | "progress" | "mastery" | "complete";
};

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
    return {
      score: parsed.score,
      elapsedSeconds: parsed.elapsedSeconds,
      medal: parsed.medal
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

  const secondsDelta = input.bestRun.elapsedSeconds - input.elapsedSeconds;
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

function storageKey(contractKey: string): string {
  return `astro-courier:best-run:${contractKey}`;
}
