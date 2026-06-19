import { describe, expect, it } from "vitest";
import { buildCourierLicenseCue, shouldIssueCourierLicense } from "./courierLicense";

describe("courier license first-run cues", () => {
  it("shows short license steps only for the first courier route before the license is issued", () => {
    expect(
      buildCourierLicenseCue({
        contractId: "first-light-delivery",
        licenseIssued: false,
        preflightOpen: true,
        status: "paused",
        objectivePhase: "pickup"
      })
    ).toEqual({
      label: "License",
      value: "Launch",
      tone: "ready"
    });

    expect(
      buildCourierLicenseCue({
        contractId: "first-light-delivery",
        licenseIssued: false,
        preflightOpen: false,
        status: "flying",
        objectivePhase: "pickup"
      })
    ).toEqual({
      label: "License",
      value: "Load",
      tone: "active"
    });

    expect(
      buildCourierLicenseCue({
        contractId: "first-light-delivery",
        licenseIssued: false,
        preflightOpen: false,
        status: "flying",
        objectivePhase: "delivery",
        landingStatus: "ready"
      })
    ).toEqual({
      label: "License",
      value: "Dock",
      tone: "precision"
    });
  });

  it("keeps license cues out of later contracts and already licensed runs", () => {
    expect(
      buildCourierLicenseCue({
        contractId: "asteroid-sprint",
        licenseIssued: false,
        preflightOpen: false,
        status: "flying",
        objectivePhase: "pickup"
      })
    ).toBeUndefined();

    expect(
      buildCourierLicenseCue({
        contractId: "first-light-delivery",
        licenseIssued: true,
        preflightOpen: false,
        status: "flying",
        objectivePhase: "pickup"
      })
    ).toBeUndefined();
  });

  it("marks the license as issued only after the first route is delivered", () => {
    expect(shouldIssueCourierLicense({ contractId: "first-light-delivery", licenseIssued: false, status: "delivered" })).toBe(true);
    expect(shouldIssueCourierLicense({ contractId: "first-light-delivery", licenseIssued: true, status: "delivered" })).toBe(false);
    expect(shouldIssueCourierLicense({ contractId: "first-light-delivery", licenseIssued: false, status: "crashed" })).toBe(false);
    expect(shouldIssueCourierLicense({ contractId: "return-leg", licenseIssued: false, status: "delivered" })).toBe(false);
  });
});
