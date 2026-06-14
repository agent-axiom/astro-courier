import type { RunMedal, RunStatus, Vec2 } from "@astro-courier/shared";

export type BestRun = {
  score: number;
  elapsedSeconds: number;
  medal: RunMedal;
  ghostTrail?: Vec2[];
};

export type BestRunChase = {
  label: "First clear" | "PB target" | "PB ghost";
  value: string;
  tone: "empty" | "target";
};

export type ContractMasteryBadge = {
  label: "Mastery";
  value: "Open" | "Cleared" | "Comet";
  tone: "open" | "cleared" | "comet";
};

export type ContractRouteMarkTarget = {
  label: "Next mark";
  value: "Clear route" | "Bank comet" | "Capture ghost" | "3/3 banked";
  tone: "clear" | "comet" | "ghost" | "complete";
};

export type ContractRouteMarkBadge = {
  label: "Mark";
  value: "Clear" | "Comet" | "Ghost" | "Banked";
  tone: ContractRouteMarkTarget["tone"];
};

export type RouteMarkLaunchCaption = {
  label: "Launch focus";
  value: "Launch first clear" | "Launch comet push" | "Launch ghost capture" | "Launch mastery lap";
};

export type LiveRouteMarkCueInput = {
  target: ContractRouteMarkTarget;
  status: RunStatus;
  preflightOpen: boolean;
};

export type LiveRouteMarkCue = {
  label: "Route mark";
  value: "Clear this route" | "Push comet mark" | "Record ghost mark" | "Mastery lap";
  tone: ContractRouteMarkTarget["tone"];
};

export type RouteBoardContractMarks = {
  label: "Marks";
  value: `${number}/3`;
  tone: "open" | "progress" | "mastery" | "complete";
};

export type ContractBestRunTone = "open" | "pb" | "ghost";

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
  label: "PB pace" | "PB chase" | "PB clutch" | "Ghost chase" | "Ghost clutch";
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
  label: "Routes cleared" | "Ghost routes" | "Comet clears";
  value: string;
  tone: "open" | "progress" | "mastery" | "complete";
};

export type RouteBoardCampaignProgress = {
  label: "Campaign";
  value: "Launch campaign" | "Campaign mastered" | `${number}% mastered`;
  detail: `${number}/${number} route marks`;
  tone: "open" | "progress" | "mastery" | "complete";
  progress: number;
};

export type RouteBoardCampaignMilestoneReceipt = {
  label: "Campaign milestone";
  value: "25% route board" | "50% route board" | "75% route board" | "Campaign mastered";
  tone: "quarter" | "half" | "mastery" | "complete";
};

export type RouteBoardCampaignMilestoneTarget = {
  label: "Next milestone";
  value: RouteBoardCampaignMilestoneReceipt["value"];
  detail: `${number} mark to go` | `${number} marks to go`;
  tone: RouteBoardCampaignMilestoneReceipt["tone"];
};

export type RouteBoardTarget = {
  label: "Next clear" | "Comet chase" | "Ghost chase" | "Board status";
  value: string;
  tone: "clear" | "comet" | "ghost" | "complete";
  contractId?: string;
};

export type RouteBoardMastery = {
  label: "Board mastery";
  value: string;
  tone: "open" | "progress" | "mastery" | "complete";
};

export type RouteBoardSelectionAction = {
  label: "Select target";
  contractId: string;
};

export type RouteBoardRecommendationBadge = "Next" | "Comet" | "Ghost" | "Relay";

export type RouteMarkReceipt = {
  label: "Route mark";
  value: "Clear mark banked" | "Comet mark banked" | "Ghost mark banked";
  tone: "clear" | "comet" | "ghost";
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

  const hasGhostTrail = hasReplayTrail(bestRun);
  return {
    label: hasGhostTrail ? "PB ghost" : "PB target",
    value: `${bestRun.score} / ${bestRun.elapsedSeconds.toFixed(1)}s${hasGhostTrail ? " trail" : ""}`,
    tone: "target"
  };
}

export function buildContractBestRunLabel(bestRun: BestRun | undefined): string {
  if (!bestRun) {
    return "PB open";
  }

  const prefix = hasReplayTrail(bestRun) ? "Ghost" : "PB";
  return `${prefix} ${bestRun.score} / ${bestRun.elapsedSeconds.toFixed(1)}s`;
}

export function buildContractBestRunTone(bestRun: BestRun | undefined): ContractBestRunTone {
  if (!bestRun) {
    return "open";
  }

  return hasReplayTrail(bestRun) ? "ghost" : "pb";
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

export function buildContractRouteMarkTarget(bestRun: BestRun | undefined): ContractRouteMarkTarget {
  if (!bestRun) {
    return { label: "Next mark", value: "Clear route", tone: "clear" };
  }

  if (bestRun.medal !== "comet") {
    return { label: "Next mark", value: "Bank comet", tone: "comet" };
  }

  if (!hasReplayTrail(bestRun)) {
    return { label: "Next mark", value: "Capture ghost", tone: "ghost" };
  }

  return { label: "Next mark", value: "3/3 banked", tone: "complete" };
}

export function buildContractRouteMarkBadge(target: ContractRouteMarkTarget): ContractRouteMarkBadge {
  if (target.tone === "clear") {
    return { label: "Mark", value: "Clear", tone: "clear" };
  }
  if (target.tone === "comet") {
    return { label: "Mark", value: "Comet", tone: "comet" };
  }
  if (target.tone === "ghost") {
    return { label: "Mark", value: "Ghost", tone: "ghost" };
  }
  return { label: "Mark", value: "Banked", tone: "complete" };
}

export function buildRouteMarkLaunchCaption(target: ContractRouteMarkTarget): RouteMarkLaunchCaption {
  if (target.tone === "clear") {
    return { label: "Launch focus", value: "Launch first clear" };
  }
  if (target.tone === "comet") {
    return { label: "Launch focus", value: "Launch comet push" };
  }
  if (target.tone === "ghost") {
    return { label: "Launch focus", value: "Launch ghost capture" };
  }
  return { label: "Launch focus", value: "Launch mastery lap" };
}

export function buildLiveRouteMarkCue(input: LiveRouteMarkCueInput): LiveRouteMarkCue | undefined {
  if (input.preflightOpen || input.status === "delivered" || input.status === "crashed") {
    return undefined;
  }

  if (input.target.tone === "clear") {
    return { label: "Route mark", value: "Clear this route", tone: "clear" };
  }
  if (input.target.tone === "comet") {
    return { label: "Route mark", value: "Push comet mark", tone: "comet" };
  }
  if (input.target.tone === "ghost") {
    return { label: "Route mark", value: "Record ghost mark", tone: "ghost" };
  }
  return { label: "Route mark", value: "Mastery lap", tone: "complete" };
}

export function buildRouteBoardContractMarks(bestRun: BestRun | undefined): RouteBoardContractMarks {
  const marks = routeMarks(bestRun);
  return {
    label: "Marks",
    value: `${marks}/3`,
    tone: marks === 0 ? "open" : marks === 3 ? "complete" : marks === 2 ? "mastery" : "progress"
  };
}

export function buildRouteMarkReceipt(previousBestRun: BestRun | undefined, nextBestRun: BestRun | undefined): RouteMarkReceipt | undefined {
  if (!nextBestRun || routeMarks(nextBestRun) <= routeMarks(previousBestRun)) {
    return undefined;
  }

  if (!hasReplayTrail(previousBestRun) && hasReplayTrail(nextBestRun)) {
    return {
      label: "Route mark",
      value: "Ghost mark banked",
      tone: "ghost"
    };
  }

  if (previousBestRun?.medal !== "comet" && nextBestRun.medal === "comet") {
    return {
      label: "Route mark",
      value: "Comet mark banked",
      tone: "comet"
    };
  }

  if (!previousBestRun) {
    return {
      label: "Route mark",
      value: "Clear mark banked",
      tone: "clear"
    };
  }

  return undefined;
}

export function buildRouteBoardProgress(
  contracts: readonly RouteBoardContract[],
  bestRunsByContract: Readonly<Record<string, BestRun | undefined>>
): RouteBoardProgress[] {
  const total = contracts.length;
  const bestRuns = contracts.map((contract) => bestRunsByContract[contract.id]);
  const cleared = bestRuns.filter(Boolean).length;
  const ghostRoutes = bestRuns.filter((bestRun) => bestRun && hasReplayTrail(bestRun)).length;
  const comets = bestRuns.filter((bestRun) => bestRun?.medal === "comet").length;

  return [
    {
      label: "Routes cleared",
      value: `${cleared}/${total}`,
      tone: progressTone(cleared, total)
    },
    {
      label: "Ghost routes",
      value: `${ghostRoutes}/${total}`,
      tone: progressTone(ghostRoutes, total)
    },
    {
      label: "Comet clears",
      value: `${comets}/${total}`,
      tone: comets === total && total > 0 ? "complete" : comets > 0 ? "mastery" : "open"
    }
  ];
}

export function buildRouteBoardCampaignProgress(
  contracts: readonly RouteBoardContract[],
  bestRunsByContract: Readonly<Record<string, BestRun | undefined>>
): RouteBoardCampaignProgress {
  const totalMarks = contracts.length * 3;
  const earnedMarks = contracts.reduce((total, contract) => total + routeMarks(bestRunsByContract[contract.id]), 0);
  const progress = totalMarks > 0 ? round(earnedMarks / totalMarks, 2) : 0;
  const percent = Math.round(progress * 100);

  if (earnedMarks === 0) {
    return {
      label: "Campaign",
      value: "Launch campaign",
      detail: `${earnedMarks}/${totalMarks} route marks`,
      tone: "open",
      progress
    };
  }

  if (totalMarks > 0 && earnedMarks === totalMarks) {
    return {
      label: "Campaign",
      value: "Campaign mastered",
      detail: `${earnedMarks}/${totalMarks} route marks`,
      tone: "complete",
      progress
    };
  }

  return {
    label: "Campaign",
    value: `${percent}% mastered`,
    detail: `${earnedMarks}/${totalMarks} route marks`,
    tone: progress >= 0.75 ? "mastery" : "progress",
    progress
  };
}

export function buildRouteBoardCampaignMilestoneTarget(
  contracts: readonly RouteBoardContract[],
  bestRunsByContract: Readonly<Record<string, BestRun | undefined>>
): RouteBoardCampaignMilestoneTarget | undefined {
  const totalMarks = contracts.length * 3;
  if (totalMarks === 0) {
    return undefined;
  }

  const earnedMarks = contracts.reduce((total, contract) => total + routeMarks(bestRunsByContract[contract.id]), 0);
  const progress = earnedMarks / totalMarks;
  const milestone = [...campaignMilestones].reverse().find((entry) => progress < entry.progress);
  if (!milestone) {
    return undefined;
  }

  const marksToGo = Math.max(1, Math.ceil(milestone.progress * totalMarks) - earnedMarks);
  const detail: RouteBoardCampaignMilestoneTarget["detail"] = marksToGo === 1 ? `${marksToGo} mark to go` : `${marksToGo} marks to go`;
  return {
    label: "Next milestone",
    value: milestone.value,
    detail,
    tone: milestone.tone
  };
}

export function buildRouteBoardCampaignMilestoneReceipt(
  contracts: readonly RouteBoardContract[],
  previousBestRunsByContract: Readonly<Record<string, BestRun | undefined>>,
  nextBestRunsByContract: Readonly<Record<string, BestRun | undefined>>
): RouteBoardCampaignMilestoneReceipt | undefined {
  const totalMarks = contracts.length * 3;
  if (totalMarks === 0) {
    return undefined;
  }

  const previousMarks = contracts.reduce((total, contract) => total + routeMarks(previousBestRunsByContract[contract.id]), 0);
  const nextMarks = contracts.reduce((total, contract) => total + routeMarks(nextBestRunsByContract[contract.id]), 0);
  if (nextMarks <= previousMarks) {
    return undefined;
  }

  const previousProgress = previousMarks / totalMarks;
  const nextProgress = nextMarks / totalMarks;
  const milestone = campaignMilestones.find((entry) => previousProgress < entry.progress && nextProgress >= entry.progress);
  return milestone ? { label: milestone.label, value: milestone.value, tone: milestone.tone } : undefined;
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

  const ghostCaptureContract = contracts.find((contract) => !hasReplayTrail(bestRunsByContract[contract.id]));
  if (ghostCaptureContract) {
    return {
      label: "Ghost chase",
      value: `Capture ${ghostCaptureContract.title} ghost`,
      tone: "ghost",
      contractId: ghostCaptureContract.id
    };
  }

  return { label: "Board status", value: "Board mastered", tone: "complete" };
}

export function buildRouteBoardMastery(
  contracts: readonly RouteBoardContract[],
  bestRunsByContract: Readonly<Record<string, BestRun | undefined>>
): RouteBoardMastery {
  const total = contracts.length;
  const bestRuns = contracts.map((contract) => bestRunsByContract[contract.id]);
  const cleared = bestRuns.filter(Boolean).length;
  const comets = bestRuns.filter((bestRun) => bestRun?.medal === "comet").length;
  const ghosts = bestRuns.filter((bestRun) => hasReplayTrail(bestRun)).length;

  if (cleared < total) {
    const remaining = total - cleared;
    return {
      label: "Board mastery",
      value: `${remaining} ${pluralize(remaining, "route")} to clear`,
      tone: cleared > 0 ? "progress" : "open"
    };
  }

  if (comets < total) {
    const remaining = total - comets;
    return {
      label: "Board mastery",
      value: `${remaining} ${pluralize(remaining, "comet")} to master`,
      tone: "mastery"
    };
  }

  if (ghosts < total) {
    const remaining = total - ghosts;
    return {
      label: "Board mastery",
      value: `${remaining} ${pluralize(remaining, "ghost")} to bank`,
      tone: "mastery"
    };
  }

  return {
    label: "Board mastery",
    value: "Full route board",
    tone: "complete"
  };
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
    return "Next";
  }
  if (routeBoardTarget.tone === "comet") {
    return "Comet";
  }
  if (routeBoardTarget.tone === "ghost") {
    return "Ghost";
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

  const hasGhostTrail = hasReplayTrail(input.bestRun);
  const chaseLabel = hasGhostTrail ? "Ghost chase" : "PB chase";
  const clutchLabel = hasGhostTrail ? "Ghost clutch" : "PB clutch";
  const scoreDelta = (input.score ?? 0) - input.bestRun.score;
  if (scoreDelta > 0) {
    if ((input.targetDistance ?? Number.POSITIVE_INFINITY) <= 150) {
      return {
        label: clutchLabel,
        value: hasGhostTrail ? `Defend ghost +${Math.round(scoreDelta)}` : `Defend +${Math.round(scoreDelta)} into dock`,
        tone: "clutch"
      };
    }
    return {
      label: chaseLabel,
      value: hasGhostTrail ? `+${Math.round(scoreDelta)} ghost lead` : `+${Math.round(scoreDelta)} score lead`,
      tone: "ahead"
    };
  }

  const secondsDelta = input.bestRun.elapsedSeconds - input.elapsedSeconds;
  if (input.score !== undefined && scoreDelta < 0 && secondsDelta < 0) {
    return {
      label: chaseLabel,
      value: hasGhostTrail ? `Need +${Math.round(Math.abs(scoreDelta))} vs ghost` : `Need +${Math.round(Math.abs(scoreDelta))} score`,
      tone: "behind"
    };
  }

  if (secondsDelta >= 0) {
    return {
      label: hasGhostTrail ? "Ghost chase" : "PB pace",
      value: hasGhostTrail ? `${secondsDelta.toFixed(1)}s ahead of ghost` : `${secondsDelta.toFixed(1)}s bank`,
      tone: "ahead"
    };
  }

  return {
    label: hasGhostTrail ? "Ghost chase" : "PB pace",
    value: hasGhostTrail ? `${Math.abs(secondsDelta).toFixed(1)}s behind ghost` : `${Math.abs(secondsDelta).toFixed(1)}s over`,
    tone: "behind"
  };
}

function isBetterRun(candidate: BestRun, current: BestRun): boolean {
  if (candidate.score !== current.score) {
    return candidate.score > current.score;
  }
  if (candidate.elapsedSeconds !== current.elapsedSeconds) {
    return candidate.elapsedSeconds < current.elapsedSeconds;
  }
  return hasReplayTrail(candidate) && !hasReplayTrail(current);
}

function hasReplayTrail(bestRun: BestRun | undefined): boolean {
  return (bestRun?.ghostTrail?.length ?? 0) >= 2;
}

function routeMarks(bestRun: BestRun | undefined): number {
  if (!bestRun) {
    return 0;
  }

  return 1 + (bestRun.medal === "comet" ? 1 : 0) + (hasReplayTrail(bestRun) ? 1 : 0);
}

const campaignMilestones: readonly (RouteBoardCampaignMilestoneReceipt & { progress: number })[] = [
  { progress: 1, label: "Campaign milestone", value: "Campaign mastered", tone: "complete" },
  { progress: 0.75, label: "Campaign milestone", value: "75% route board", tone: "mastery" },
  { progress: 0.5, label: "Campaign milestone", value: "50% route board", tone: "half" },
  { progress: 0.25, label: "Campaign milestone", value: "25% route board", tone: "quarter" }
];

function progressTone(count: number, total: number): RouteBoardProgress["tone"] {
  if (total > 0 && count === total) {
    return "complete";
  }
  return count > 0 ? "progress" : "open";
}

function pluralize(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
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
