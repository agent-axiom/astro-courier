import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";
import type { ScreenFeedback } from "./screenFeedback";

export const COURIER_LICENSE_CONTRACT_ID = "first-light-delivery";
export const COURIER_LICENSE_STORAGE_KEY = "astro-courier-license-issued";

export type CourierLicenseCue = {
  label: "License";
  value: "Launch" | "Load" | "Dock";
  tone: "active" | "precision" | "ready";
};

export type CourierLicenseCueInput = {
  contractId: string;
  licenseIssued: boolean;
  preflightOpen: boolean;
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  landingStatus?: LandingGuidanceStatus;
};

export type CourierLicenseIssuedInput = {
  contractId: string;
  licenseIssued: boolean;
  status: RunStatus;
};

export function buildCourierLicenseCue(input: CourierLicenseCueInput): CourierLicenseCue | undefined {
  if (input.licenseIssued || input.contractId !== COURIER_LICENSE_CONTRACT_ID) {
    return undefined;
  }

  if (input.preflightOpen) {
    return { label: "License", value: "Launch", tone: "ready" };
  }

  if (input.status !== "flying") {
    return undefined;
  }

  if (input.objectivePhase === "pickup") {
    return { label: "License", value: "Load", tone: "active" };
  }

  return {
    label: "License",
    value: "Dock",
    tone: input.landingStatus === "ready" ? "precision" : "active"
  };
}

export function shouldIssueCourierLicense(input: CourierLicenseIssuedInput): boolean {
  return input.contractId === COURIER_LICENSE_CONTRACT_ID && !input.licenseIssued && input.status === "delivered";
}

export function buildCourierLicenseIssuedFeedback(): ScreenFeedback {
  return {
    label: "License issued",
    value: "Courier cleared",
    accent: "precision",
    tone: "success",
    intensity: "heavy",
    durationMs: 680
  };
}
