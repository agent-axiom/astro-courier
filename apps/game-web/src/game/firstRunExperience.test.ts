import starterRoute from "@astro-courier/content/data/systems/starter-route.json";
import { validateSystemContent } from "@astro-courier/content";
import { describe, expect, it } from "vitest";
import { buildFirstRunExperienceAudit } from "./firstRunExperience";
import { buildMobileActionLabels } from "./touchControls";
import { buildPreflightOverlayDensity, buildTrainingFlightAction } from "./preflightOverlay";
import { buildResultOverlayDensity } from "./resultOverlay";
import { buildTacticalCue } from "./objective";

describe("first run experience audit", () => {
  it("keeps the first run clear, light, and forgiving", () => {
    const system = validateSystemContent(starterRoute);
    const firstContract = system.contracts[0]!;
    const firstPreflight = buildPreflightOverlayDensity({
      status: "paused",
      preflightOpen: true,
      savedRouteCount: 0
    });
    const trainingContract = system.contracts.find((contract) => contract.id === "training-flight");
    const trainingAction = buildTrainingFlightAction({
      status: "paused",
      preflightOpen: true,
      currentContractId: firstContract.id,
      trainingContract
    });
    const fuelCountdownCue = buildTacticalCue({
      status: "flying",
      objectivePhase: "delivery",
      fuel: 0,
      maxFuel: 135,
      fuelDepletedCountdownSeconds: 9.2
    });
    const crashDensity = buildResultOverlayDensity({ status: "crashed" });
    const firstContractEnemyCount =
      (firstContract.enemyWave?.drones ?? 1) + (firstContract.enemyWave?.fighters ?? 1) + (firstContract.enemyWave?.brutes ?? 0);

    const audit = buildFirstRunExperienceAudit({
      firstContractId: firstContract.id,
      firstContractBriefing: firstContract.briefing,
      firstContractFuel: firstContract.shipStart?.fuel,
      firstContractEnemyCount,
      preflightShowsGoal: firstPreflight.showLaunchSummary,
      preflightShowsControls: firstPreflight.showControlPrimer,
      mobileSteeringLabel: buildMobileActionLabels().steering,
      hasOptionalTraining: trainingAction?.contractId === "training-flight",
      fuelCountdownCue: fuelCountdownCue?.value,
      crashResultIsMinimal:
        !crashDensity.showCrashDebrief &&
        !crashDensity.showQuickStats &&
        !crashDensity.showRunReceipts &&
        !crashDensity.showDetailedScore
    });

    expect(audit.score).toBe(100);
    expect(audit.checks).toHaveLength(9);
    expect(audit.checks.filter((check) => !check.passed)).toEqual([]);
  });
});
