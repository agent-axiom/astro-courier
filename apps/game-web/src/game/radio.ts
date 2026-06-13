import { PERFECT_APPROACH_STREAK_SECONDS, PERFECT_APPROACH_STYLE_BONUS } from "@astro-courier/simulation";
import type { HudState } from "./GameShell";

export function buildRadioMessage(hud: HudState): string {
  if (hud.status === "paused") {
    return "Contract loaded. Review the route and launch when the courier is lined up.";
  }

  if (hud.status === "crashed") {
    if (hud.crashReason === "Hard Landing") return "Insurance desk reports: hard landing. Bleed speed before contact.";
    if (hud.crashReason === "Hull Collision") return "Insurance desk reports: hull collision. Respect the gravity well.";
    return `Insurance desk reports: ${hud.landingRating ?? "courier incident logged"}.`;
  }

  if (hud.status === "delivered") {
    if (hud.lastMilestone === "Perfect Approach") return "Perfect approach logged. That docking line was textbook.";
    if (hud.lastMilestone === "Eco Drift") return "Eco drift logged. Minimal burn, maximum courier finesse.";
    if (hud.lastMilestone === "Chain Finish") return "Chain finish logged. You carried the style window all the way home.";
    if (hud.medal === "comet") return "Comet Medal confirmed. That route is going on the office wall.";
    if (hud.medal === "gold") return "Gold delivery logged. Clean burn, clean dock.";
    if (hud.medal === "silver") return "Silver delivery logged. Reliable courier work.";
    if (hud.medal === "bronze") return "Bronze delivery logged. Package made it, and that counts.";
    return "Delivery complete. The parcel survived another charming orbital situation.";
  }

  if (hud.lastMilestone === "Needle Thread") {
    return "Needle thread logged. Fast skim, clean cargo, premium style.";
  }

  if (hud.lastMilestone === "Clean Hazard Skim") {
    return "Style bonus logged. Clean skim, no scratches.";
  }

  if (hud.lastMilestone === "Quick Pickup") {
    return "Fast pickup logged. Keep that momentum to the destination.";
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

  if (hud.hazardDangerLevel === "near") {
    return `Asteroid field ahead. Skim wide${hud.hazardDistance === undefined ? "" : `, ${Math.round(hud.hazardDistance)}m out`}.`;
  }

  if (hud.trajectoryRiskLevel === "inside") {
    return `Trajectory intersects hazard${formatTrajectoryEta(hud.trajectoryRiskSeconds)}. Brake or turn now.`;
  }

  if (hud.trajectoryRiskLevel === "near") {
    return `Trajectory skims the hazard edge${formatTrajectoryEta(hud.trajectoryRiskSeconds)}. Hold it clean for style.`;
  }

  if (hud.maxFuel > 0 && hud.fuel / hud.maxFuel <= 0.15) {
    return "Fuel critical. Coast clean and save the last burn for docking.";
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

function formatTrajectoryEta(seconds?: number): string {
  return seconds === undefined ? " soon" : ` in ${seconds.toFixed(1)}s`;
}
