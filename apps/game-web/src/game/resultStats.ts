import type { CrashReason, RunGrade, RunMedal, RunStatus, ScoreBreakdown } from "@astro-courier/shared";

export type ResultStatsInput = {
  score: number;
  elapsedSeconds: number;
  cargoIntegrity: number;
};

export type ResultStat = {
  label: "Score" | "Time" | "Cargo";
  value: string;
};

export type ResultHighlight = {
  label: "Run highlight";
  value: string;
  tone: "pace" | "efficiency" | "cargo" | "precision" | "style" | "danger";
};

export type ReplayReceipt = {
  label: "Replay ID";
  value: string;
  tone: "verified";
};

export type ResultOutcomePresentation = {
  icon: "alert" | "trophy";
  tone: "danger" | "success";
};

export type RunIdentityReceiptInput = {
  status: Extract<RunStatus, "crashed" | "delivered">;
  contractId?: string;
  lastMilestone?: string;
  crashReason?: CrashReason;
  medal: RunMedal;
  grade: RunGrade;
  cargoDamage: number;
  fuel: number;
  maxFuel: number;
  scoreBreakdown: ScoreBreakdown;
};

export type RunIdentityReceipt = {
  label: "Run identity";
  value: string;
  tone: "clean" | "clutch" | "danger" | "elite" | "failure" | "style";
};

const styleMilestones = new Set([
  "Clean Hazard Skim",
  "Needle Thread",
  "Gravity Sling",
  "Quick Pickup",
  "Launch Burst",
  "Comet Finish",
  "Perfect Approach",
  "Eco Drift",
  "Chain Finish",
  "Express Finish",
  "Damage Control",
  "Last Drop",
  "No Brake Finesse"
]);

export function buildResultStats(input: ResultStatsInput): ResultStat[] {
  return [
    { label: "Score", value: `${input.score}` },
    { label: "Time", value: `${input.elapsedSeconds.toFixed(1)}s` },
    { label: "Cargo", value: `${Math.round(Math.max(0, input.cargoIntegrity) * 100)}%` }
  ];
}

export function buildResultOutcomePresentation(status: Extract<RunStatus, "crashed" | "delivered">): ResultOutcomePresentation {
  if (status === "crashed") {
    return {
      icon: "alert",
      tone: "danger"
    };
  }

  return {
    icon: "trophy",
    tone: "success"
  };
}

export function buildResultHighlight(breakdown: ScoreBreakdown, lastMilestone?: string): ResultHighlight | undefined {
  const candidates = [
    { label: "Style", value: breakdown.styleBonus, tone: "style" },
    { label: "Danger", value: breakdown.dangerBonus, tone: "danger" },
    { label: "Landing", value: breakdown.landingBonus, tone: "precision" },
    { label: "Cargo", value: breakdown.cargoBonus, tone: "cargo" },
    { label: "Fuel", value: breakdown.fuelBonus, tone: "efficiency" },
    { label: "Pace", value: breakdown.paceBonus, tone: "pace" }
  ] satisfies Array<{ label: string; value: number; tone: ResultHighlight["tone"] }>;
  const [winner] = candidates.filter((candidate) => candidate.value > 0).sort((left, right) => right.value - left.value);

  if (!winner) {
    return undefined;
  }

  const highlightLabel = winner.tone === "style" && lastMilestone && styleMilestones.has(lastMilestone) ? lastMilestone : winner.label;

  return {
    label: "Run highlight",
    value: `${highlightLabel} +${Math.round(winner.value)}`,
    tone: winner.tone
  };
}

export function buildRunIdentityReceipt(input: RunIdentityReceiptInput): RunIdentityReceipt {
  if (input.status === "crashed") {
    return {
      label: "Run identity",
      value: input.crashReason === "Hull Collision" ? "Route failed / hull contact" : "Route failed / final approach",
      tone: "failure"
    };
  }

  if (input.medal === "comet" || input.grade === "S") {
    return {
      label: "Run identity",
      value: "Elite courier line",
      tone: "elite"
    };
  }

  if (input.lastMilestone === "Last Drop") {
    return {
      label: "Run identity",
      value: "Fuel clutch finish",
      tone: "clutch"
    };
  }

  if (
    input.lastMilestone === "Chain Finish" ||
    (input.contractId === "chain-relay" && input.scoreBreakdown.styleBonus > 0)
  ) {
    return {
      label: "Run identity",
      value: "Style chain route",
      tone: "style"
    };
  }

  if (input.scoreBreakdown.dangerBonus > input.scoreBreakdown.styleBonus && input.scoreBreakdown.dangerBonus >= 300) {
    return {
      label: "Run identity",
      value: "Danger pay route",
      tone: "danger"
    };
  }

  if (input.cargoDamage <= 0.02) {
    return {
      label: "Run identity",
      value: "Clean cargo clear",
      tone: "clean"
    };
  }

  return {
    label: "Run identity",
    value: "Delivery banked",
    tone: "clean"
  };
}

export function buildReplayReceipt(replayChecksum?: string): ReplayReceipt | undefined {
  if (!replayChecksum) {
    return undefined;
  }

  return {
    label: "Replay ID",
    value: replayChecksum.replace(/^rc-/, "RC-").toUpperCase(),
    tone: "verified"
  };
}
