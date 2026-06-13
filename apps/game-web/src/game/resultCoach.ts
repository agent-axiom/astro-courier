import type { CrashReason, ObjectivePhase, RunGrade, RunMedal, RunStatus, ScoreBreakdown } from "@astro-courier/shared";

export type ResultCoachInput = {
  status: RunStatus;
  objectivePhase?: ObjectivePhase;
  contractId?: string;
  lastMilestone?: string;
  crashReason?: CrashReason;
  medal: RunMedal;
  grade: RunGrade;
  cargoDamage: number;
  fuel: number;
  maxFuel: number;
  targetDistance?: number;
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
    contractId?: string;
  };
};

export type ResultBoardPrompt = {
  label: "Board target";
  value: string;
  tone: "retry" | "clear" | "comet" | "complete";
};

export type ResultBoardActionInput = {
  status: Extract<RunStatus, "delivered" | "crashed">;
  currentContractId: string;
  routeBoardTarget: {
    value: string;
    tone: "clear" | "comet" | "complete";
    contractId?: string;
  };
};

export type ResultBoardAction = {
  label: "Open Target" | "Chase Comet" | "Defend Board" | "Retry Route";
  targetContractId: string;
  tone: "retry" | "clear" | "comet" | "complete";
};

export function buildResultCoach(input: ResultCoachInput): ResultCoach {
  if (input.status === "crashed") {
    const gravityHullCollision = input.contractId === "gravity-slingshot" && input.crashReason === "Hull Collision";
    if (isDeliveryNearMiss(input)) {
      return {
        label: "Next run",
        value: "Near miss: feather final brake",
        tone: "danger"
      };
    }

    return {
      label: "Next run",
      value:
        input.crashReason === "Hull Collision"
          ? gravityHullCollision
            ? "Stay in the outer sling ring"
            : input.contractId === "chain-relay"
            ? "Give relay lanes wider clearance"
            : input.contractId === "asteroid-sprint"
            ? "Give asteroid fields wider clearance"
            : "Keep orbit outside gravity wells"
          : "Brake earlier before pad contact",
      tone: "danger"
    };
  }

  if (input.lastMilestone === "Eco Drift") {
    return {
      label: "Next run",
      value: "Repeat the low-burn line",
      tone: "success"
    };
  }

  if (input.lastMilestone === "Damage Control") {
    return {
      label: "Next run",
      value: "Repeat the salvage dock",
      tone: "success"
    };
  }

  if (input.lastMilestone === "Last Drop") {
    return {
      label: "Next run",
      value: "Repeat the last-drop coast",
      tone: "success"
    };
  }

  if (input.lastMilestone === "No Brake Finesse") {
    return {
      label: "Next run",
      value: "Repeat the no-brake line",
      tone: "success"
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
      value:
        input.contractId === "gravity-slingshot"
          ? "Catch one gravity sling"
          : input.contractId === "asteroid-sprint"
          ? "Thread one asteroid gap"
          : input.contractId === "return-leg" || input.contractId === "chain-relay"
          ? "Carry a chain into dock"
          : "Add a skim or quick pickup",
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

  if (input.lastMilestone === "Express Finish") {
    return {
      label: "Next run",
      value: "Repeat the express line",
      tone: "success"
    };
  }

  if (input.lastMilestone === "Perfect Approach") {
    return {
      label: "Next run",
      value: "Repeat the soft dock",
      tone: "success"
    };
  }

  if (input.lastMilestone === "Chain Finish") {
    return {
      label: "Next run",
      value: "Carry the chain home",
      tone: "success"
    };
  }

  return {
    label: "Next run",
    value: "Tighten landing angle",
    tone: "opportunity"
  };
}

function isDeliveryNearMiss(input: ResultCoachInput): boolean {
  return input.objectivePhase === "delivery" && input.targetDistance !== undefined && input.targetDistance <= 60;
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

export function buildResultBoardAction(input: ResultBoardActionInput): ResultBoardAction {
  if (input.status === "crashed") {
    return {
      label: "Retry Route",
      targetContractId: input.currentContractId,
      tone: "retry"
    };
  }

  if (input.routeBoardTarget.tone === "complete") {
    return {
      label: "Defend Board",
      targetContractId: input.currentContractId,
      tone: "complete"
    };
  }

  return {
    label: input.routeBoardTarget.tone === "comet" ? "Chase Comet" : "Open Target",
    targetContractId: input.routeBoardTarget.contractId ?? input.currentContractId,
    tone: input.routeBoardTarget.tone
  };
}
