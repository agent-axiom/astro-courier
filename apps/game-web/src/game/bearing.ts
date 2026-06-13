export type BearingGuidance = {
  label: "Target ahead" | "Target left" | "Target right" | "Turn around";
  value: string;
  tone: "ahead" | "side" | "reverse";
};

const aheadThreshold = Math.PI / 8;
const reverseThreshold = Math.PI * 0.72;

export function formatBearingGuidance(relativeBearing: number): BearingGuidance {
  const normalized = normalizeAngle(relativeBearing);
  const degrees = `${Math.round(Math.abs((normalized * 180) / Math.PI))}deg`;
  const magnitude = Math.abs(normalized);

  if (magnitude <= aheadThreshold) {
    return { label: "Target ahead", value: degrees, tone: "ahead" };
  }
  if (magnitude >= reverseThreshold) {
    return { label: "Turn around", value: degrees, tone: "reverse" };
  }
  return {
    label: normalized < 0 ? "Target left" : "Target right",
    value: degrees,
    tone: "side"
  };
}

export function normalizeAngle(angle: number): number {
  let next = angle;
  while (next <= -Math.PI) next += Math.PI * 2;
  while (next > Math.PI) next -= Math.PI * 2;
  return next;
}
