import { describe, expect, it } from "vitest";
import { appendRunFeedUpdates, deriveRunFeedUpdates, type RunFeedSnapshot } from "./runFeed";

const baseSnapshot: RunFeedSnapshot = {
  status: "flying",
  lastMilestone: undefined,
  lastStyleAward: undefined,
  fuel: 100,
  maxFuel: 100,
  hazardDangerLevel: undefined,
  trajectoryRiskLevel: undefined,
  trajectoryRiskSeconds: undefined
};

describe("run action feed", () => {
  it("keeps initial snapshots quiet", () => {
    expect(deriveRunFeedUpdates(undefined, baseSnapshot)).toEqual([]);
  });

  it("derives expressive updates from fresh run events", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, lastMilestone: "Gravity Sling", lastStyleAward: 240 })).toEqual([
      {
        label: "Gravity Sling",
        value: "+240 style",
        tone: "style"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, fuel: 14 })).toEqual([
      {
        label: "Fuel critical",
        value: "Coast and commit",
        tone: "warning"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, hazardDangerLevel: "inside" })).toEqual([
      {
        label: "Hazard contact",
        value: "Break field",
        tone: "danger"
      }
    ]);
  });

  it("derives terminal updates once status changes", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, status: "delivered" })).toEqual([
      {
        label: "Delivery logged",
        value: "Route complete",
        tone: "success"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, status: "crashed" })).toEqual([
      {
        label: "Insurance event",
        value: "Review approach",
        tone: "danger"
      }
    ]);
  });

  it("warns when the projected trajectory enters hazard space", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, trajectoryRiskLevel: "inside", trajectoryRiskSeconds: 1.8 })).toEqual([
      {
        label: "Collision forecast",
        value: "Evade in 1.8s",
        tone: "danger"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, trajectoryRiskLevel: "inside", trajectoryRiskSeconds: 1.8 },
        { ...baseSnapshot, trajectoryRiskLevel: "inside", trajectoryRiskSeconds: 1.2 }
      )
    ).toEqual([]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, trajectoryRiskLevel: "near", trajectoryRiskSeconds: 2.4 })).toEqual([
      {
        label: "Hazard vector",
        value: "Thread in 2.4s",
        tone: "warning"
      }
    ]);
  });

  it("prepends fresh updates and caps the feed", () => {
    const result = appendRunFeedUpdates(
      [
        { id: 1, label: "Old one", value: "A", tone: "neutral" },
        { id: 2, label: "Old two", value: "B", tone: "style" }
      ],
      [
        { label: "Fuel critical", value: "Coast and commit", tone: "warning" },
        { label: "Hazard contact", value: "Break field", tone: "danger" }
      ],
      3,
      3
    );

    expect(result).toEqual({
      entries: [
        { id: 4, label: "Hazard contact", value: "Break field", tone: "danger" },
        { id: 3, label: "Fuel critical", value: "Coast and commit", tone: "warning" },
        { id: 1, label: "Old one", value: "A", tone: "neutral" }
      ],
      nextId: 5
    });
  });
});
