export type FirstRunExperienceCheckId =
  | "default-route"
  | "goal-visible"
  | "controls-visible"
  | "mobile-steering-label"
  | "optional-training"
  | "soft-first-route"
  | "no-forced-tutorial-copy"
  | "fuel-countdown"
  | "minimal-result";

export type FirstRunExperienceCheck = {
  id: FirstRunExperienceCheckId;
  label: string;
  passed: boolean;
};

export type FirstRunExperienceAuditInput = {
  firstContractId: string;
  firstContractBriefing: string;
  firstContractFuel?: number;
  firstContractEnemyCount: number;
  preflightShowsGoal: boolean;
  preflightShowsControls: boolean;
  mobileSteeringLabel: string;
  hasOptionalTraining: boolean;
  fuelCountdownCue?: string;
  crashResultIsMinimal: boolean;
};

export type FirstRunExperienceAudit = {
  score: number;
  checks: FirstRunExperienceCheck[];
};

export type FirstExperienceCue = {
  label: "First flight" | "Training";
  value: string;
  detail: string;
  tone: "guide" | "training";
};

export function buildFirstExperienceCue(input: {
  status: "paused" | "flying" | "delivered" | "crashed";
  preflightOpen: boolean;
  savedRouteCount: number;
  contractId: string;
}): FirstExperienceCue | undefined {
  if (!input.preflightOpen || input.status !== "paused" || input.savedRouteCount > 0) {
    return undefined;
  }

  if (input.contractId === "training-flight") {
    return { label: "Training", value: "Try controls", detail: "Safe lane", tone: "training" };
  }

  if (input.contractId === "first-light-delivery") {
    return { label: "First flight", value: "Pickup then dock", detail: "Training optional", tone: "guide" };
  }

  return undefined;
}

export function buildFirstRunExperienceAudit(input: FirstRunExperienceAuditInput): FirstRunExperienceAudit {
  const checks: FirstRunExperienceCheck[] = [
    {
      id: "default-route",
      label: "First route remains the default route",
      passed: input.firstContractId === "first-light-delivery"
    },
    {
      id: "goal-visible",
      label: "First preflight shows the route goal",
      passed: input.preflightShowsGoal
    },
    {
      id: "controls-visible",
      label: "First preflight shows compact controls",
      passed: input.preflightShowsControls
    },
    {
      id: "mobile-steering-label",
      label: "Mobile steering has a direct label",
      passed: input.mobileSteeringLabel.trim().length > 0
    },
    {
      id: "optional-training",
      label: "Training is opt-in",
      passed: input.hasOptionalTraining
    },
    {
      id: "soft-first-route",
      label: "First route is forgiving",
      passed: (input.firstContractFuel ?? 0) >= 130 && input.firstContractEnemyCount === 0
    },
    {
      id: "no-forced-tutorial-copy",
      label: "First route avoids tutorial framing",
      passed: !/\btutorial\b/i.test(input.firstContractBriefing)
    },
    {
      id: "fuel-countdown",
      label: "Dry fuel explains the black-hole failure",
      passed: input.fuelCountdownCue?.startsWith("Black hole / ") === true
    },
    {
      id: "minimal-result",
      label: "Result overlay stays minimal",
      passed: input.crashResultIsMinimal
    }
  ];

  const passedCount = checks.filter((check) => check.passed).length;
  return {
    score: Math.round((passedCount / checks.length) * 100),
    checks
  };
}
