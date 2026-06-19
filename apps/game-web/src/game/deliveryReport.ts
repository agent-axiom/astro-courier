import type { RunGrade, RunMedal, RunStatus } from "@astro-courier/shared";

const PERFECT_DOCK_BONUS = 300;

export type ShareableDeliveryReportInput = {
  status: Extract<RunStatus, "crashed" | "delivered">;
  contractTitle: string;
  cargoName: string;
  score: number;
  elapsedSeconds: number;
  cargoIntegrity: number;
  medal: RunMedal;
  grade: RunGrade;
  landingBonus: number;
  url: string;
};

export function buildShareableDeliveryReport(input: ShareableDeliveryReportInput): string {
  const title =
    input.status === "delivered"
      ? `Astro Courier delivery: ${input.contractTitle}`
      : `Astro Courier route failed: ${input.contractTitle}`;
  const cargoPercent = Math.round(Math.max(0, Math.min(1, input.cargoIntegrity)) * 100);

  return [
    title,
    `${input.cargoName} - ${input.elapsedSeconds.toFixed(1)}s - ${Math.round(input.score)} pts - ${cargoPercent}% cargo`,
    `Dock: ${dockLabel(input)} - Medal: ${medalLabel(input.medal)} - Grade: ${input.grade}`,
    input.url
  ].join("\n");
}

function dockLabel(input: Pick<ShareableDeliveryReportInput, "landingBonus" | "status">): string {
  if (input.status !== "delivered") {
    return "Failed";
  }

  if (input.landingBonus >= PERFECT_DOCK_BONUS) {
    return "Perfect";
  }

  return input.landingBonus > 0 ? "Soft" : "Rough";
}

function medalLabel(medal: RunMedal): string {
  if (medal === "none") return "None";
  return `${medal.charAt(0).toUpperCase()}${medal.slice(1)}`;
}
