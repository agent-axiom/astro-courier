import {
  HAZARD_THREAD_SPEED_THRESHOLD,
  LAST_DROP_FUEL_RATIO,
  LAST_DROP_STYLE_BONUS,
  PERFECT_APPROACH_STREAK_SECONDS,
  PERFECT_APPROACH_STYLE_BONUS
} from "@astro-courier/simulation";
import type { HudState } from "./GameShell";
import { COMET_RESERVE_MIN_RATIO, COMET_RESERVE_WARNING_RATIO } from "./comet";
import { STYLE_CHAIN_URGENT_SECONDS } from "./style";

export function buildRadioMessage(hud: HudState): string {
  if (hud.status === "paused") {
    return "Contract loaded. Review the route and launch when the courier is lined up.";
  }

  if (hud.status === "crashed") {
    if (hud.crashReason === "Hard Landing") return "Insurance desk reports: hard landing. Bleed speed before contact.";
    if (hud.crashReason === "Hull Collision" && hud.contractId === "asteroid-sprint") {
      return "Insurance desk reports: Asteroid impact. Give the field wider clearance.";
    }
    if (hud.crashReason === "Hull Collision") return "Insurance desk reports: hull collision. Respect the gravity well.";
    return `Insurance desk reports: ${hud.landingRating ?? "courier incident logged"}.`;
  }

  if (hud.status === "delivered") {
    if (hud.lastMilestone === "Perfect Approach") return "Perfect approach logged. That docking line was textbook.";
    if (hud.lastMilestone === "Eco Drift") return "Eco drift logged. Minimal burn, maximum courier finesse.";
    if (hud.lastMilestone === "Chain Finish") return "Chain finish logged. You carried the style window all the way home.";
    if (hud.lastMilestone === "Express Finish") return "Express finish logged. Fast cargo, clean hands, premium route.";
    if (hud.lastMilestone === "Damage Control") return "Damage control logged. Damaged cargo recovered with a soft dock.";
    if (hud.lastMilestone === "Last Drop") return "Last drop logged. Empty tanks, intact cargo, excellent nerve.";
    if (hud.medal === "comet") return "Comet Medal confirmed. That route is going on the office wall.";
    if (hud.medal === "gold") return "Gold delivery logged. Clean burn, clean dock.";
    if (hud.medal === "silver") return "Silver delivery logged. Reliable courier work.";
    if (hud.medal === "bronze") return "Bronze delivery logged. Package made it, and that counts.";
    return "Delivery complete. The parcel survived another charming orbital situation.";
  }

  if (hud.lastMilestone === "Needle Thread") {
    return "Needle thread logged. Fast skim, clean cargo, premium style.";
  }

  if (hud.lastMilestone === "Gravity Sling") {
    return "Gravity sling logged. Fast arc, clean cargo, excellent orbital nerve.";
  }

  if (hud.lastMilestone === "Clean Hazard Skim") {
    return "Style bonus logged. Clean skim, no scratches.";
  }

  if (hud.cargoOnboard && hud.launchBurstSecondsRemaining > 0) {
    return `Launch burst armed. Hit Boost in ${hud.launchBurstSecondsRemaining.toFixed(1)}s to cash the pickup chain.`;
  }

  if (hud.lastMilestone === "Quick Pickup") {
    return "Fast pickup logged. Keep that momentum to the destination.";
  }

  if (hud.lastMilestone === "Launch Burst") {
    return "Launch burst logged. Cargo is loaded, chain is alive, punch out clean.";
  }

  if (hud.lastMilestone === "Assist Burn") {
    return "Assist burn fired. Fuel traded for a softer contact.";
  }

  if (hud.hazardDangerLevel === "inside") {
    return `Hazard contact. Exit the field${hud.hazardDistance === undefined ? "" : `, ${Math.round(hud.hazardDistance)}m from center`}.`;
  }

  if (hud.cargoOnboard && hud.cargoDamage > 0.02) {
    return `Cargo integrity ${Math.round(Math.max(0, 1 - hud.cargoDamage) * 100)}%. Keep it out of hazards and dock clean.`;
  }

  const urgentStyleChainMessage = buildUrgentStyleChainMessage(hud);
  if (urgentStyleChainMessage) {
    return urgentStyleChainMessage;
  }

  if (
    hud.objectivePhase === "delivery" &&
    hud.cargoOnboard &&
    hud.paceTier === "gold" &&
    hud.paceSecondsRemaining > 0 &&
    hud.paceSecondsRemaining <= 5 &&
    hud.cargoDamage <= 0.02
  ) {
    return `Express window closing. Dock clean in ${hud.paceSecondsRemaining.toFixed(1)}s.`;
  }

  if (hud.hazardDangerLevel === "near") {
    const needleThreadSetupSpeed = HAZARD_THREAD_SPEED_THRESHOLD * 0.65;
    if (
      hud.cargoDamage <= 0.02 &&
      hud.speed >= needleThreadSetupSpeed &&
      hud.speed < HAZARD_THREAD_SPEED_THRESHOLD
    ) {
      return `Thread window nearby. Build ${HAZARD_THREAD_SPEED_THRESHOLD}+ speed or skim clean.`;
    }
    return `Asteroid field ahead. Skim wide${hud.hazardDistance === undefined ? "" : `, ${Math.round(hud.hazardDistance)}m out`}.`;
  }

  if (hud.trajectoryRiskLevel === "inside") {
    return `Trajectory intersects hazard${formatTrajectoryEta(hud.trajectoryRiskSeconds)}. Brake or turn now.`;
  }

  if (hud.trajectoryRiskLevel === "near") {
    if (hud.cargoDamage <= 0.02 && hud.speed >= HAZARD_THREAD_SPEED_THRESHOLD) {
      return `Thread vector crosses the hazard edge${formatTrajectoryEta(hud.trajectoryRiskSeconds)}. Hold it clean for style.`;
    }
    return `Trajectory skims the hazard edge${formatTrajectoryEta(hud.trajectoryRiskSeconds)}. Hold it clean for style.`;
  }

  if (hud.gravitySlingDistance !== undefined) {
    if (hud.gravitySlingReady) {
      const multiplier = Math.max(1, hud.styleMultiplier);
      const payout = hud.gravitySlingStyleBonus === undefined ? undefined : Math.round(hud.gravitySlingStyleBonus * multiplier);
      return `Sling window open${payout === undefined ? "" : ` for +${payout}`}. Hold the fast gravity arc.`;
    }

    return `Gravity pocket live. Build ${hud.gravitySlingSpeedThreshold ?? 54}+ speed for a sling bonus.`;
  }

  if (isLastDropWindowOpen(hud)) {
    return `Last drop window. Dock clean for +${LAST_DROP_STYLE_BONUS} style.`;
  }

  if (hud.maxFuel > 0 && hud.fuel / hud.maxFuel <= 0.15) {
    return "Fuel critical. Coast clean and save the last burn for docking.";
  }

  if (
    hud.objectivePhase === "delivery" &&
    hud.cargoOnboard &&
    hud.paceTier === "gold" &&
    hud.cargoDamage <= 0.02 &&
    hud.maxFuel > 0
  ) {
    const fuelReserve = hud.fuel / hud.maxFuel;
    if (fuelReserve >= COMET_RESERVE_MIN_RATIO && fuelReserve < COMET_RESERVE_WARNING_RATIO) {
      return "Comet reserve tight. Coast the line and save one clean dock burn.";
    }
  }

  if (hud.assistAvailable) {
    return "Assist burn available. Hold the line and let the legs do their job.";
  }

  if (hud.landingStatus === "too-fast") {
    return "Slow your approach. Cargo prefers gentle physics.";
  }

  if (hud.landingStatus === "misaligned") {
    return "Align ship attitude before contact. Landing pads are picky.";
  }

  if (hud.approachStreakSeconds >= PERFECT_APPROACH_STREAK_SECONDS) {
    return `Perfect setup banked. Soft dock now for +${PERFECT_APPROACH_STYLE_BONUS} style.`;
  }

  if (hud.landingStatus === "ready") {
    return "Docking window is green. Set it down softly.";
  }

  if (hud.objectivePhase === "delivery") {
    return "Cargo secured. Drift toward the destination beacon.";
  }

  return "Pickup beacon active. Bring the courier close and keep it tidy.";
}

function buildUrgentStyleChainMessage(hud: HudState): string | undefined {
  if (!(hud.styleMultiplier > 1 && hud.styleChainSecondsRemaining > 0 && hud.styleChainSecondsRemaining <= STYLE_CHAIN_URGENT_SECONDS)) {
    return undefined;
  }

  if (hud.gravitySlingReady) {
    return "Style chain fading. Hold the sling arc now.";
  }

  if (hud.hazardDangerLevel === "near" && hud.cargoDamage <= 0.02) {
    if (hud.speed >= HAZARD_THREAD_SPEED_THRESHOLD) {
      return "Style chain fading. Thread the hazard gap now.";
    }
    return "Style chain fading. Skim the hazard edge now.";
  }

  if (hud.quickPickupSecondsRemaining > 0) {
    return "Style chain fading. Take the pickup now.";
  }

  if (hud.landingStatus === "ready") {
    return "Style chain fading. Set down softly now.";
  }

  return "Style chain fading. Hit a skim or clean dock to save it.";
}

function formatTrajectoryEta(seconds?: number): string {
  return seconds === undefined ? " soon" : ` in ${seconds.toFixed(1)}s`;
}

function isLastDropWindowOpen(hud: HudState): boolean {
  return (
    hud.objectivePhase === "delivery" &&
    hud.cargoOnboard &&
    hud.landingStatus === "ready" &&
    hud.cargoDamage <= 0.02 &&
    hud.maxFuel > 0 &&
    hud.fuel / hud.maxFuel <= LAST_DROP_FUEL_RATIO
  );
}
