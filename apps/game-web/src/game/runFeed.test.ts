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
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, lastMilestone: "Comet Finish", lastStyleAward: 320 })).toEqual([
      {
        label: "Comet Finish",
        value: "+320 style",
        tone: "style"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, lastMilestone: "No Brake Finesse", lastStyleAward: 150 })).toEqual([
      {
        label: "No Brake Finesse",
        value: "+150 style",
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

  it("derives medal-aware terminal updates for strong deliveries", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, status: "delivered", medal: "comet" })).toEqual([
      {
        label: "Comet secured",
        value: "Route mastered",
        tone: "success"
      }
    ]);
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, status: "delivered", medal: "gold" })).toEqual([
      {
        label: "Gold logged",
        value: "Medal pace locked",
        tone: "success"
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
    expect(
      deriveRunFeedUpdates({ ...baseSnapshot, cargoDamage: 0.18 }, {
        ...baseSnapshot,
        trajectoryRiskLevel: "near",
        trajectoryRiskSeconds: 2.4,
        cargoDamage: 0.18
      })
    ).toEqual([
      {
        label: "Damaged vector",
        value: "Clear in 2.4s",
        tone: "warning"
      }
    ]);
  });

  it("announces when a launch burst window opens after pickup", () => {
    expect(deriveRunFeedUpdates(baseSnapshot, { ...baseSnapshot, launchBurstSecondsRemaining: 2.4 })).toEqual([
      {
        label: "Burst armed",
        value: "Boost in 2.4s",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, launchBurstSecondsRemaining: 2.4 },
        { ...baseSnapshot, launchBurstSecondsRemaining: 1.8 }
      )
    ).toEqual([]);
  });

  it("announces launch bursts as chain opportunities while a multiplier is live", () => {
    expect(
      deriveRunFeedUpdates(baseSnapshot, {
        ...baseSnapshot,
        launchBurstSecondsRemaining: 2.4,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 3.2
      })
    ).toEqual([
      {
        label: "Burst armed",
        value: "Boost in 2.4s / chain x1.50",
        tone: "style"
      }
    ]);
  });

  it("announces when an active style chain reaches the critical window", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 1.4 },
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 0.8 }
      )
    ).toEqual([
      {
        label: "Chain fading",
        value: "Save in 0.8s",
        tone: "warning"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 0.8 },
        { ...baseSnapshot, styleMultiplier: 1.5, styleChainSecondsRemaining: 0.5 }
      )
    ).toEqual([]);
  });

  it("announces when the live run loses the gold medal window", () => {
    expect(deriveRunFeedUpdates({ ...baseSnapshot, paceTier: "gold" }, { ...baseSnapshot, paceTier: "silver" })).toEqual([
      {
        label: "Gold missed",
        value: "Silver window live",
        tone: "warning"
      }
    ]);
    expect(deriveRunFeedUpdates({ ...baseSnapshot, paceTier: "silver" }, { ...baseSnapshot, paceTier: "silver" })).toEqual([]);
  });

  it("announces when the live run first overtakes the saved personal best score", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 3280, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3440, bestRunScore: 3290 }
      )
    ).toEqual([
      {
        label: "PB lead",
        value: "+150 score",
        tone: "success"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 3440, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3510, bestRunScore: 3290 }
      )
    ).toEqual([]);
  });

  it("announces when the live run enters personal-best chase range", () => {
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 2980, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3105, bestRunScore: 3290 }
      )
    ).toEqual([
      {
        label: "PB pressure",
        value: "185 score back",
        tone: "style"
      }
    ]);
    expect(
      deriveRunFeedUpdates(
        { ...baseSnapshot, score: 3105, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3180, bestRunScore: 3290 }
      )
    ).toEqual([]);
  });

  it("warns when clean cargo first takes damage", () => {
    expect(deriveRunFeedUpdates({ ...baseSnapshot, cargoDamage: 0.01 }, { ...baseSnapshot, cargoDamage: 0.05 })).toEqual([
      {
        label: "Cargo exposed",
        value: "Protect the load",
        tone: "warning"
      }
    ]);
    expect(deriveRunFeedUpdates({ ...baseSnapshot, cargoDamage: 0.05 }, { ...baseSnapshot, cargoDamage: 0.12 })).toEqual([]);
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
