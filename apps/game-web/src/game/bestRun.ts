import type { RunMedal } from "@astro-courier/shared";

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

function isBetterRun(candidate: BestRun, current: BestRun): boolean {
  if (candidate.score !== current.score) {
    return candidate.score > current.score;
  }
  return candidate.elapsedSeconds < current.elapsedSeconds;
}

function storageKey(contractKey: string): string {
  return `astro-courier:best-run:${contractKey}`;
}
