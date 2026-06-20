import {
  HAZARD_THREAD_SPEED_THRESHOLD,
  LAST_DROP_FUEL_RATIO,
  LAST_DROP_STYLE_BONUS,
  PERFECT_APPROACH_STREAK_SECONDS,
  PERFECT_APPROACH_STYLE_BONUS
} from "@astro-courier/simulation";
import type { HudState } from "./GameShell";
import {
  COMET_RESERVE_MIN_RATIO,
  COMET_RESERVE_WARNING_RATIO,
  formatCometReserveShortfallFuelGoal,
  isLiveCometDockArmed
} from "./comet";
import { STYLE_CHAIN_URGENT_SECONDS } from "./style";

const cometReserveNearMissRatio = 0.6;
const cleanCargoDamageLimit = 0.02;
const perfectLandingBonus = 300;

export type RadioMessageContext = {
  preflightOpen?: boolean;
};

export function buildRadioMessage(hud: HudState, context: RadioMessageContext = {}): string {
  if (hud.status === "paused") {
    if (context.preflightOpen === false) {
      return buildLivePauseMessage(hud);
    }
    if (hud.cargoKind === "time-sensitive") {
      return `Rush cargo loaded: ${hud.cargoName}. Gold window is ${hud.paceSecondsRemaining.toFixed(1)}s; launch clean.`;
    }
    if (hud.cargoKind === "unstable") {
      return `Unstable cargo loaded: ${hud.cargoName}. Brake taps stress the load; plan a coast line.`;
    }
    return "Contract loaded. Review the route and launch when the courier is lined up.";
  }

  if (hud.status === "crashed") {
    if (hud.crashReason === "Hard Landing") return "Insurance desk reports: hard landing. Bleed speed before contact.";
    if (hud.crashReason === "Misaligned Dock") return "Insurance desk reports: dock alignment failed. Align ship before contact.";
    if (hud.crashReason === "Fuel Depleted") return "Fuel depleted. Keep a reserve or finish before the singularity.";
    if (isCloseTargetHullCollision(hud)) {
      return "Insurance desk reports: missed landing pad. Re-enter the dock ring.";
    }
    if (hud.crashReason === "Hull Collision" && hud.contractId === "chain-relay") {
      return "Insurance desk reports: Relay lane impact. Widen asteroid clearance.";
    }
    if (hud.crashReason === "Hull Collision" && hud.contractId === "asteroid-sprint") {
      return "Insurance desk reports: Asteroid impact. Give the field wider clearance.";
    }
    if (hud.crashReason === "Hull Collision") return "Insurance desk reports: hull collision. Respect the gravity well.";
    return `Insurance desk reports: ${hud.landingRating ?? "courier incident logged"}.`;
  }

  if (hud.status === "delivered") {
    if (hud.lastMilestone === "Comet Finish") return "Comet finish confirmed. Gold pace, perfect dock, intact cargo, reserve intact.";
    const cometNearMissMessage = buildDeliveredCometNearMissMessage(hud);
    if (cometNearMissMessage) return cometNearMissMessage;
    if (hud.lastMilestone === "Perfect Approach") return "Perfect approach logged. That docking line was textbook.";
    if (hud.lastMilestone === "Eco Drift") return "Eco drift logged. Minimal burn, maximum courier finesse.";
    if (hud.lastMilestone === "Chain Finish") return "Chain finish logged. You carried the style window all the way home.";
    if (hud.lastMilestone === "Express Finish") return "Express finish logged. Fast cargo, clean hands, premium route.";
    if (hud.lastMilestone === "Damage Control") return "Damage control logged. Damaged cargo recovered with a soft dock.";
    if (hud.lastMilestone === "Last Drop") return "Last drop logged. Empty tanks, intact cargo, excellent nerve.";
    if (hud.lastMilestone === "No Brake Finesse") return "No-brake finesse logged. Clean cargo, no manual brake, smooth hands.";
    if (hud.lastMilestone === "Assist Burn") return "Assist burn delivery logged. Soft contact saved the package.";
    if (hud.lastMilestone === "Boost Burn") return "Boost burn delivery logged. Vector correction carried the line.";
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

  if (hud.lastMilestone === "Shield Rebound") {
    return "Shield rebound spent. Widen the route; next gravity hit breaks hull.";
  }

  const urgentStyleChainMessage = buildUrgentStyleChainMessage(hud);
  if (urgentStyleChainMessage) {
    return urgentStyleChainMessage;
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

  if (hud.lastMilestone === "Boost Burn") {
    return "Boost burn logged. Vector corrected, now settle the line.";
  }

  if (hud.hazardDangerLevel === "inside") {
    return `Hazard contact. Exit the field${hud.hazardDistance === undefined ? "" : `, ${Math.round(hud.hazardDistance)}m from center`}.`;
  }

  if (hud.cargoOnboard && hud.cargoDamage > 0.02 && hud.trajectoryRiskLevel === "near") {
    return `Damaged cargo on hazard vector. Clear it${formatTrajectoryEta(hud.trajectoryRiskSeconds)}.`;
  }

  if (hud.cargoOnboard && hud.cargoDamage > 0.02) {
    return `Cargo integrity ${Math.round(Math.max(0, 1 - hud.cargoDamage) * 100)}%. Keep it out of hazards and dock clean.`;
  }

  if (isChainRelayCarryWindowOpen(hud)) {
    return "Chain relay live. Carry the style chain into dock.";
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
      return `Thread window open. Hold the needle gap for style${formatTrajectoryEta(hud.trajectoryRiskSeconds)}.`;
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
    return `Last drop window. Dock clean for +${lastDropRadioPayout(hud)} style.`;
  }

  if (hud.maxFuel > 0 && hud.fuel / hud.maxFuel <= 0.15) {
    return "Fuel critical. Coast clean and save the last burn for docking.";
  }

  if (hud.cargoOnboard && isLiveCometDockArmed(hud)) {
    return "Comet dock armed. Set it down clean for the finish.";
  }

  if (
    hud.objectivePhase === "delivery" &&
    hud.cargoOnboard &&
    hud.paceTier === "gold" &&
    hud.cargoDamage <= 0.02 &&
    hud.maxFuel > 0
  ) {
    const fuelReserve = hud.fuel / hud.maxFuel;
    if (fuelReserve < COMET_RESERVE_MIN_RATIO) {
      return `Comet reserve lost. Bank ${formatCometReserveShortfallFuelGoal(fuelReserve)} on retry and finish clean.`;
    }
    if (fuelReserve >= COMET_RESERVE_MIN_RATIO && fuelReserve < COMET_RESERVE_WARNING_RATIO) {
      return "Comet reserve tight. Coast the line and save one clean dock burn.";
    }
  }

  if (hud.assistAvailable) {
    return "Assist burn available. Hold the line and let the legs do their job.";
  }

  if (hud.landingStatus === "too-fast") {
    return "Too fast for a clean dock. Slow down to protect the cargo, or take a rough handoff.";
  }

  if (hud.landingStatus === "misaligned") {
    return "Off-angle dock. It will be rough; align the nose for a clean handoff.";
  }

  if (hud.approachStreakSeconds >= PERFECT_APPROACH_STREAK_SECONDS) {
    return `Perfect setup banked. Soft dock now for +${PERFECT_APPROACH_STYLE_BONUS} style.`;
  }

  if (hud.landingStatus === "ready") {
    return "Docking window is green. Set it down softly.";
  }

  if (hud.objectivePhase === "delivery" && hud.cargoOnboard && hud.cargoKind === "volatile" && hud.cargoDamage <= cleanCargoDamageLimit) {
    return "Volatile cargo armed. Coast or tap thrust; brake shocks the load.";
  }

  if (hud.objectivePhase === "delivery") {
    return "Cargo secured. Drift toward the destination beacon.";
  }

  return "Pickup beacon active. Bring the courier close and keep it tidy.";
}

function buildLivePauseMessage(hud: HudState): string {
  if (hud.objectivePhase === "delivery" && hud.cargoOnboard) {
    return `Route paused. Cargo line held for ${hud.destinationLabel}.`;
  }

  return `Route paused. Pickup line held for ${hud.pickupLabel}.`;
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

  if (hud.launchBurstSecondsRemaining > 0) {
    return "Style chain fading. Hit Boost now for the burst.";
  }

  if (hud.quickPickupSecondsRemaining > 0) {
    return "Style chain fading. Take the pickup now.";
  }

  if (hud.landingStatus === "ready") {
    return "Style chain fading. Set down softly now.";
  }

  return "Style chain fading. Hit a skim or clean dock to save it.";
}

function isChainRelayCarryWindowOpen(hud: HudState): boolean {
  return (
    hud.contractId === "chain-relay" &&
    hud.objectivePhase === "delivery" &&
    hud.cargoOnboard &&
    hud.styleMultiplier > 1 &&
    hud.styleChainSecondsRemaining > STYLE_CHAIN_URGENT_SECONDS
  );
}

function isCloseTargetHullCollision(hud: HudState): boolean {
  return hud.crashReason === "Hull Collision" && hud.targetDistance !== undefined && hud.targetDistance <= 90;
}

function formatTrajectoryEta(seconds?: number): string {
  return seconds === undefined ? " soon" : ` in ${seconds.toFixed(1)}s`;
}

function buildDeliveredCometNearMissMessage(hud: HudState): string | undefined {
  if (
    hud.medal !== "gold" ||
    hud.lastMilestone !== "Express Finish" ||
    hud.cargoDamage > cleanCargoDamageLimit ||
    hud.scoreBreakdown.styleBonus <= 0 ||
    hud.maxFuel <= 0
  ) {
    return undefined;
  }

  const reserveRatio = hud.fuel / hud.maxFuel;
  if (reserveRatio >= cometReserveNearMissRatio && reserveRatio < COMET_RESERVE_MIN_RATIO) {
    return `Express finish logged. Bank ${formatCometReserveShortfallFuelGoal(reserveRatio)} next run to convert it into a comet finish.`;
  }

  if (reserveRatio >= COMET_RESERVE_MIN_RATIO && hud.scoreBreakdown.landingBonus < perfectLandingBonus) {
    return "Express finish logged. Perfect dock next run to convert it into a comet finish.";
  }

  return undefined;
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

function lastDropRadioPayout(hud: HudState): number {
  return Math.round(LAST_DROP_STYLE_BONUS * Math.max(1, hud.styleMultiplier));
}
