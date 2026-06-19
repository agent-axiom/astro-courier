import type { RunStatus } from "@astro-courier/shared";
import type { RouteBoardTarget } from "./bestRun";

export type RouteUnlockAction = {
  label: "Next";
  value: string;
  targetContractId: string;
  tone: "clear";
};

type RouteUnlockActionInput = {
  status: Extract<RunStatus, "delivered" | "crashed">;
  currentContractId: string;
  routeBoardTarget: RouteBoardTarget;
};

export function buildRouteUnlockAction(input: RouteUnlockActionInput): RouteUnlockAction | undefined {
  if (input.status !== "delivered" || input.routeBoardTarget.tone !== "clear") {
    return undefined;
  }

  if (!input.routeBoardTarget.contractId || input.routeBoardTarget.contractId === input.currentContractId) {
    return undefined;
  }

  return {
    label: "Next",
    value: input.routeBoardTarget.value.replace(/^Clear\s+/i, ""),
    targetContractId: input.routeBoardTarget.contractId,
    tone: "clear"
  };
}
