import type { RunStatus, SimulationSnapshot, Vec2 } from "@astro-courier/shared";

export type TrajectoryRiskLevel = "near" | "inside";

export type TrajectoryRiskForecast = {
  hazardId: string;
  level: TrajectoryRiskLevel;
  seconds: number;
  distance: number;
  radius: number;
};

export type TrajectoryRiskInput = {
  status: RunStatus;
  trajectory: Vec2[];
  hazards: SimulationSnapshot["hazards"];
  sampleIntervalSeconds: number;
};

export function forecastTrajectoryHazardRisk(input: TrajectoryRiskInput): TrajectoryRiskForecast | undefined {
  if (input.status !== "flying" || input.trajectory.length === 0 || input.hazards.length === 0) {
    return undefined;
  }

  let firstNear: TrajectoryRiskForecast | undefined;
  for (let index = 0; index < input.trajectory.length; index += 1) {
    const point = input.trajectory[index];
    for (const hazard of input.hazards) {
      const distance = Math.hypot(point.x - hazard.position.x, point.y - hazard.position.y);
      if (distance <= hazard.radius) {
        return forecastFor("inside", hazard.id, index, input.sampleIntervalSeconds, distance, hazard.radius);
      }
      if (!firstNear && distance <= hazard.radius * 1.6) {
        firstNear = forecastFor("near", hazard.id, index, input.sampleIntervalSeconds, distance, hazard.radius);
      }
    }
  }

  return firstNear;
}

function forecastFor(
  level: TrajectoryRiskLevel,
  hazardId: string,
  sampleIndex: number,
  sampleIntervalSeconds: number,
  distance: number,
  radius: number
): TrajectoryRiskForecast {
  return {
    hazardId,
    level,
    seconds: round((sampleIndex + 1) * Math.max(0, sampleIntervalSeconds), 1),
    distance: round(distance, 3),
    radius
  };
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
