import type { HudState } from "./GameShell";

export function buildRadioMessage(hud: HudState): string {
  if (hud.status === "paused") {
    return "Contract loaded. Review the route and launch when the courier is lined up.";
  }

  if (hud.status === "crashed") {
    return `Insurance desk reports: ${hud.landingRating ?? "courier incident logged"}.`;
  }

  if (hud.status === "delivered") {
    if (hud.medal === "comet") return "Comet Medal confirmed. That route is going on the office wall.";
    if (hud.medal === "gold") return "Gold delivery logged. Clean burn, clean dock.";
    if (hud.medal === "silver") return "Silver delivery logged. Reliable courier work.";
    if (hud.medal === "bronze") return "Bronze delivery logged. Package made it, and that counts.";
    return "Delivery complete. The parcel survived another charming orbital situation.";
  }

  if (hud.hazardDangerLevel === "inside") {
    return `Hazard contact. Exit the field${hud.hazardDistance === undefined ? "" : `, ${Math.round(hud.hazardDistance)}m from center`}.`;
  }

  if (hud.hazardDangerLevel === "near") {
    return `Asteroid field ahead. Skim wide${hud.hazardDistance === undefined ? "" : `, ${Math.round(hud.hazardDistance)}m out`}.`;
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

  if (hud.approachStreakSeconds >= 1) {
    return "Keep that steady approach. Courier telemetry likes this line.";
  }

  if (hud.landingStatus === "ready") {
    return "Docking window is green. Set it down softly.";
  }

  if (hud.objectivePhase === "delivery") {
    return "Cargo secured. Drift toward the destination beacon.";
  }

  return "Pickup beacon active. Bring the courier close and keep it tidy.";
}
