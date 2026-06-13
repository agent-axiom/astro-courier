import type { CrashReason, RunGrade, RunMedal, RunStatus, ScoreBreakdown } from "@astro-courier/shared";

export type ResultCoachInput = {
  status: RunStatus;
  crashReason?: CrashReason;
  medal: RunMedal;
  grade: RunGrade;
  cargoDamage: number;
  fuel: number;
  maxFuel: number;
  scoreBreakdown: ScoreBreakdown;
};

export type ResultCoach = {
  label: "Next run";
  value: string;
  tone: "danger" | "warning" | "opportunity" | "success";
};

export type ResultBoardPromptInput = {
  status: Extract<RunStatus, "delivered" | "crashed">;
  routeBoardTarget: {
    value: string;
    tone: "clear" | "comet" | "complete";
  };
};

export type ResultBoardPrompt = {
  label: "Board target";
  value: string;
  tone: "retry" | "clear" | "comet" | "complete";
};

export function buildResultCoach(input: ResultCoachInput): ResultCoach {
  if (input.status === "crashed") {
    return {
      label: "Next run",
      value:
        input.crashReason === "Hull Collision" ? "Keep orbit outside gravity wells" : "Brake earlier before pad contact",
      tone: "danger"
    };
  }

  if (input.cargoDamage >= 0.15) {
    return {
      label: "Next run",
      value: "Take wider hazard lines",
      tone: "warning"
    };
  }

  const fuelRatio = input.maxFuel > 0 ? input.fuel / input.maxFuel : 0;
  if (fuelRatio <= 0.15) {
    return {
      label: "Next run",
      value: "Plan one longer coast",
      tone: "warning"
    };
  }

  if (input.scoreBreakdown.styleBonus <= 0) {
    return {
      label: "Next run",
      value: "Add a skim or quick pickup",
      tone: "opportunity"
    };
  }

  if (input.medal === "comet" || input.grade === "S") {
    return {
      label: "Next run",
      value: "Defend the comet line",
      tone: "success"
    };
  }

  return {
    label: "Next run",
    value: "Tighten landing angle",
    tone: "opportunity"
  };
}

export function buildResultBoardPrompt(input: ResultBoardPromptInput): ResultBoardPrompt {
  if (input.status === "crashed") {
    return {
      label: "Board target",
      value: "Retry current route",
      tone: "retry"
    };
  }

  return {
    label: "Board target",
    value: input.routeBoardTarget.value,
    tone: input.routeBoardTarget.tone
  };
}
