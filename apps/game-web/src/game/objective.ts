import type { ObjectivePhase } from "@astro-courier/shared";

export type ObjectiveDirectiveInput = {
  objectivePhase: ObjectivePhase;
  pickupLabel: string;
  destinationLabel: string;
  lastMilestone?: string;
};

export type ObjectiveDirective = {
  label: "Pickup" | "Pickup first" | "Deliver" | "Complete";
  value: string;
};

export function buildObjectiveDirective(input: ObjectiveDirectiveInput): ObjectiveDirective {
  if (input.objectivePhase === "complete") {
    return {
      label: "Complete",
      value: "Cargo delivered"
    };
  }

  if (input.objectivePhase === "delivery") {
    return {
      label: "Deliver",
      value: input.destinationLabel
    };
  }

  return {
    label: input.lastMilestone === "Pickup Required" ? "Pickup first" : "Pickup",
    value: input.pickupLabel
  };
}
