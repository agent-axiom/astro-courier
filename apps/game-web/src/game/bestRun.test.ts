import { describe, expect, it } from "vitest";
import {
  buildBestRunChase,
  buildBestRunDelta,
  buildContractBestRunTone,
  buildContractMasteryBadge,
  buildContractRouteMarkTarget,
  buildContractRouteMarkBadge,
  buildContractBestRunLabel,
  buildRouteMarkLaunchCaption,
  buildLiveRouteMarkCue,
  buildLiveBestPace,
  buildRouteBoardContractMarks,
  buildRouteBoardCampaignProgress,
  buildRouteBoardCampaignMilestoneTarget,
  buildRouteBoardCampaignMilestoneReceipt,
  buildRouteBoardMastery,
  buildRouteBoardRecommendationBadge,
  buildRouteBoardProgress,
  buildRouteBoardSelectionAction,
  buildRouteBoardTarget,
  buildRouteMarkReceipt,
  buildShipUpgradeSummary,
  buildShipUpgradeTrack,
  getBestRun,
  recordBestRun
} from "./bestRun";

describe("personal best run storage", () => {
  it("stores a first delivered run as the personal best", () => {
    const storage = new MemoryStorage();

    const result = recordBestRun(storage, "starter", {
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver"
    });

    expect(result.isNewBest).toBe(true);
    expect(getBestRun(storage, "starter")).toEqual({
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver"
    });
  });

  it("keeps the previous best unless score improves or the tie is faster", () => {
    const storage = new MemoryStorage();

    recordBestRun(storage, "starter", {
      score: 1400,
      elapsedSeconds: 39,
      medal: "gold"
    });

    expect(recordBestRun(storage, "starter", { score: 1300, elapsedSeconds: 35, medal: "gold" }).isNewBest).toBe(false);
    expect(recordBestRun(storage, "starter", { score: 1400, elapsedSeconds: 41, medal: "gold" }).isNewBest).toBe(false);
    expect(recordBestRun(storage, "starter", { score: 1400, elapsedSeconds: 37, medal: "gold" }).isNewBest).toBe(true);
    expect(getBestRun(storage, "starter")?.elapsedSeconds).toBe(37);
  });

  it("stores a sampled ghost trail with the personal best", () => {
    const storage = new MemoryStorage();

    recordBestRun(storage, "starter", {
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver",
      ghostTrail: [
        { x: 180, y: 20 },
        { x: 220.25, y: -12.5 },
        { x: 420, y: -140 }
      ]
    });

    expect(getBestRun(storage, "starter")).toEqual({
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver",
      ghostTrail: [
        { x: 180, y: 20 },
        { x: 220.25, y: -12.5 },
        { x: 420, y: -140 }
      ]
    });
  });

  it("upgrades an exact personal best trail without calling it a new best", () => {
    const storage = new MemoryStorage();

    recordBestRun(storage, "starter", {
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver"
    });

    const result = recordBestRun(storage, "starter", {
      score: 1200,
      elapsedSeconds: 42.4,
      medal: "silver",
      ghostTrail: [
        { x: 180, y: 20 },
        { x: 220, y: -12 }
      ]
    });

    expect(result.isNewBest).toBe(false);
    expect(getBestRun(storage, "starter")?.ghostTrail).toEqual([
      { x: 180, y: 20 },
      { x: 220, y: -12 }
    ]);
  });
});

describe("personal best chase copy", () => {
  it("invites the player to set an initial personal best", () => {
    expect(buildBestRunChase(undefined)).toEqual({
      label: "First clear",
      value: "Sets personal best",
      tone: "empty"
    });
  });

  it("formats an existing personal best as a chase target", () => {
    expect(buildBestRunChase({ score: 3290, elapsedSeconds: 24.667, medal: "gold" })).toEqual({
      label: "PB target",
      value: "3290 / 24.7s",
      tone: "target"
    });
  });

  it("calls out when a saved personal best has a ghost route loaded", () => {
    expect(
      buildBestRunChase({
        score: 3290,
        elapsedSeconds: 24.667,
        medal: "gold",
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 12, y: -4 }
        ]
      })
    ).toEqual({
      label: "PB ghost",
      value: "3290 / 24.7s trail",
      tone: "target"
    });
  });
});

describe("contract option personal best copy", () => {
  it("marks unplayed contracts as open personal best slots", () => {
    expect(buildContractBestRunLabel(undefined)).toBe("PB open");
    expect(buildContractBestRunTone(undefined)).toBe("open");
  });

  it("formats saved contract personal bests compactly", () => {
    expect(buildContractBestRunLabel({ score: 3290, elapsedSeconds: 24.667, medal: "gold" })).toBe("PB 3290 / 24.7s");
    expect(buildContractBestRunTone({ score: 3290, elapsedSeconds: 24.667, medal: "gold" })).toBe("pb");
  });

  it("marks saved contract personal bests with replay trails as ghost routes", () => {
    expect(
      buildContractBestRunLabel({
        score: 3290,
        elapsedSeconds: 24.667,
        medal: "gold",
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 12, y: -4 }
        ]
      })
    ).toBe("Ghost 3290 / 24.7s");
    expect(
      buildContractBestRunTone({
        score: 3290,
        elapsedSeconds: 24.667,
        medal: "gold",
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 12, y: -4 }
        ]
      })
    ).toBe("ghost");
  });
});

describe("contract option mastery badge copy", () => {
  it("marks unplayed contracts as open route slots", () => {
    expect(buildContractMasteryBadge(undefined)).toEqual({ label: "Mastery", value: "Open", tone: "open" });
  });

  it("marks non-comet clears as cleared routes", () => {
    expect(buildContractMasteryBadge({ score: 2400, elapsedSeconds: 31.4, medal: "gold" })).toEqual({
      label: "Mastery",
      value: "Cleared",
      tone: "cleared"
    });
  });

  it("marks comet clears as mastered routes", () => {
    expect(buildContractMasteryBadge({ score: 3600, elapsedSeconds: 19.8, medal: "comet" })).toEqual({
      label: "Mastery",
      value: "Comet",
      tone: "comet"
    });
  });
});

describe("contract option route marks copy", () => {
  it("summarizes each contract contribution to campaign progress", () => {
    expect(buildRouteBoardContractMarks(undefined)).toEqual({
      label: "Marks",
      value: "0/3",
      tone: "open"
    });
    expect(buildRouteBoardContractMarks({ score: 1800, elapsedSeconds: 34.2, medal: "gold" })).toEqual({
      label: "Marks",
      value: "1/3",
      tone: "progress"
    });
    expect(buildRouteBoardContractMarks({ score: 2600, elapsedSeconds: 27.1, medal: "comet" })).toEqual({
      label: "Marks",
      value: "2/3",
      tone: "mastery"
    });
    expect(
      buildRouteBoardContractMarks({
        score: 3200,
        elapsedSeconds: 22.4,
        medal: "comet",
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 12, y: 8 }
        ]
      })
    ).toEqual({
      label: "Marks",
      value: "3/3",
      tone: "complete"
    });
  });
});

describe("current contract route mark target copy", () => {
  it("targets the first clear before a route has any saved best", () => {
    expect(buildContractRouteMarkTarget(undefined)).toEqual({
      label: "Next mark",
      value: "Clear route",
      tone: "clear"
    });
  });

  it("targets comet mastery after a non-comet clear", () => {
    expect(buildContractRouteMarkTarget({ score: 1800, elapsedSeconds: 34.2, medal: "gold" })).toEqual({
      label: "Next mark",
      value: "Bank comet",
      tone: "comet"
    });
  });

  it("targets ghost capture after a comet clear without a replay trail", () => {
    expect(buildContractRouteMarkTarget({ score: 2600, elapsedSeconds: 27.1, medal: "comet" })).toEqual({
      label: "Next mark",
      value: "Capture ghost",
      detail: "Match PB 2600 / 27.1s to save trail",
      tone: "ghost"
    });
  });

  it("marks fully banked routes as complete", () => {
    expect(
      buildContractRouteMarkTarget({
        score: 3200,
        elapsedSeconds: 22.4,
        medal: "comet",
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 12, y: 8 }
        ]
      })
    ).toEqual({
      label: "Next mark",
      value: "3/3 banked",
      tone: "complete"
    });
  });
});

describe("contract card route mark badge copy", () => {
  it("formats compact next-mark badges for contract cards", () => {
    expect(buildContractRouteMarkBadge({ label: "Next mark", value: "Clear route", tone: "clear" })).toEqual({
      label: "Mark",
      value: "Clear",
      tone: "clear"
    });
    expect(buildContractRouteMarkBadge({ label: "Next mark", value: "Bank comet", tone: "comet" })).toEqual({
      label: "Mark",
      value: "Comet",
      tone: "comet"
    });
    expect(buildContractRouteMarkBadge({ label: "Next mark", value: "Capture ghost", tone: "ghost" })).toEqual({
      label: "Mark",
      value: "Ghost",
      tone: "ghost"
    });
    expect(buildContractRouteMarkBadge({ label: "Next mark", value: "3/3 banked", tone: "complete" })).toEqual({
      label: "Mark",
      value: "Banked",
      tone: "complete"
    });
  });
});

describe("route mark launch caption copy", () => {
  it("turns the current mark target into launch button subcopy", () => {
    expect(buildRouteMarkLaunchCaption({ label: "Next mark", value: "Clear route", tone: "clear" })).toEqual({
      label: "Launch focus",
      value: "Launch first clear"
    });
    expect(buildRouteMarkLaunchCaption({ label: "Next mark", value: "Bank comet", tone: "comet" })).toEqual({
      label: "Launch focus",
      value: "Launch comet push"
    });
    expect(buildRouteMarkLaunchCaption({ label: "Next mark", value: "Capture ghost", tone: "ghost" })).toEqual({
      label: "Launch focus",
      value: "Launch ghost capture"
    });
    expect(buildRouteMarkLaunchCaption({ label: "Next mark", value: "3/3 banked", tone: "complete" })).toEqual({
      label: "Launch focus",
      value: "Launch mastery lap"
    });
  });
});

describe("live route mark cue copy", () => {
  it("stays hidden in preflight and after the run is over", () => {
    const target = { label: "Next mark", value: "Clear route", tone: "clear" } as const;

    expect(buildLiveRouteMarkCue({ target, status: "paused", preflightOpen: true })).toBeUndefined();
    expect(buildLiveRouteMarkCue({ target, status: "delivered", preflightOpen: false })).toBeUndefined();
    expect(buildLiveRouteMarkCue({ target, status: "crashed", preflightOpen: false })).toBeUndefined();
  });

  it("turns the active route mark target into an in-run cue", () => {
    expect(
      buildLiveRouteMarkCue({
        target: { label: "Next mark", value: "Clear route", tone: "clear" },
        status: "flying",
        preflightOpen: false
      })
    ).toEqual({
      label: "Route mark",
      value: "Clear this route",
      tone: "clear"
    });
    expect(
      buildLiveRouteMarkCue({
        target: { label: "Next mark", value: "Bank comet", tone: "comet" },
        status: "flying",
        preflightOpen: false
      })
    ).toEqual({
      label: "Route mark",
      value: "Push comet mark",
      tone: "comet"
    });
    expect(
      buildLiveRouteMarkCue({
        target: { label: "Next mark", value: "Capture ghost", detail: "Match PB 3200 / 22.4s to save trail", tone: "ghost" },
        status: "paused",
        preflightOpen: false
      })
    ).toEqual({
      label: "Route mark",
      value: "Match PB ghost",
      detail: "Match PB 3200 / 22.4s to save trail",
      tone: "ghost"
    });
    expect(
      buildLiveRouteMarkCue({
        target: { label: "Next mark", value: "3/3 banked", tone: "complete" },
        status: "flying",
        preflightOpen: false
      })
    ).toEqual({
      label: "Route mark",
      value: "Mastery lap",
      tone: "complete"
    });
  });
});

describe("route mark result receipt copy", () => {
  it("celebrates the first clear mark earned on a route", () => {
    expect(buildRouteMarkReceipt(undefined, { score: 1800, elapsedSeconds: 34.2, medal: "gold" })).toEqual({
      label: "Route mark",
      value: "Clear mark banked",
      tone: "clear"
    });
  });

  it("celebrates the highest newly earned mark when one run adds multiple marks", () => {
    expect(
      buildRouteMarkReceipt(undefined, {
        score: 3200,
        elapsedSeconds: 22.4,
        medal: "comet",
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 12, y: 8 }
        ]
      })
    ).toEqual({
      label: "Route mark",
      value: "Ghost mark banked",
      tone: "ghost"
    });
  });

  it("stays hidden when the new personal best does not add a route mark", () => {
    expect(
      buildRouteMarkReceipt(
        {
          score: 2200,
          elapsedSeconds: 28.4,
          medal: "gold"
        },
        {
          score: 2500,
          elapsedSeconds: 27.1,
          medal: "gold"
        }
      )
    ).toBeUndefined();
  });

  it("celebrates comet and ghost upgrades separately", () => {
    expect(
      buildRouteMarkReceipt(
        { score: 2200, elapsedSeconds: 28.4, medal: "gold" },
        { score: 3100, elapsedSeconds: 24.1, medal: "comet" }
      )
    ).toEqual({
      label: "Route mark",
      value: "Comet mark banked",
      tone: "comet"
    });

    expect(
      buildRouteMarkReceipt(
        { score: 3100, elapsedSeconds: 24.1, medal: "comet" },
        {
          score: 3300,
          elapsedSeconds: 22.7,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 18, y: -6 }
          ]
        }
      )
    ).toEqual({
      label: "Route mark",
      value: "Ghost mark banked",
      tone: "ghost"
    });
  });
});

describe("route board progress copy", () => {
  const contracts = [{ id: "first-light-delivery" }, { id: "return-leg" }, { id: "asteroid-sprint" }, { id: "gravity-slingshot" }];

  it("counts cleared routes, ghost routes, and comet clears across the contract board", () => {
    expect(
      buildRouteBoardProgress(contracts, {
        "first-light-delivery": {
          score: 1800,
          elapsedSeconds: 34.2,
          medal: "silver",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 24, y: -8 }
          ]
        },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
        "asteroid-sprint": undefined,
        "gravity-slingshot": undefined
      })
    ).toEqual([
      { label: "Routes cleared", value: "2/4", tone: "progress" },
      { label: "Ghost routes", value: "1/4", tone: "progress" },
      { label: "Comet clears", value: "1/4", tone: "mastery" }
    ]);
  });

  it("marks a fully mastered board distinctly", () => {
    expect(
      buildRouteBoardProgress(contracts, {
        "first-light-delivery": { score: 3200, elapsedSeconds: 22.4, medal: "comet" },
        "return-leg": { score: 3100, elapsedSeconds: 23.1, medal: "comet" },
        "asteroid-sprint": { score: 3500, elapsedSeconds: 21.8, medal: "comet" },
        "gravity-slingshot": { score: 3300, elapsedSeconds: 20.9, medal: "comet" }
      })
    ).toEqual([
      { label: "Routes cleared", value: "4/4", tone: "complete" },
      { label: "Ghost routes", value: "0/4", tone: "open" },
      { label: "Comet clears", value: "4/4", tone: "complete" }
    ]);
  });
});

describe("route board campaign progress copy", () => {
  const contracts = [{ id: "first-light-delivery" }, { id: "return-leg" }, { id: "asteroid-sprint" }, { id: "gravity-slingshot" }];

  it("summarizes clear, comet, and ghost route progress as one campaign percentage", () => {
    expect(
      buildRouteBoardCampaignProgress(contracts, {
        "first-light-delivery": {
          score: 1800,
          elapsedSeconds: 34.2,
          medal: "silver",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 24, y: -8 }
          ]
        },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
        "asteroid-sprint": undefined,
        "gravity-slingshot": undefined
      })
    ).toEqual({
      label: "Campaign",
      value: "33% mastered",
      detail: "4/12 route marks",
      tone: "progress",
      progress: 0.33
    });
  });

  it("calls out an untouched board as campaign launch", () => {
    expect(buildRouteBoardCampaignProgress(contracts, {})).toEqual({
      label: "Campaign",
      value: "Launch campaign",
      detail: "0/12 route marks",
      tone: "open",
      progress: 0
    });
  });

  it("celebrates fully marked boards", () => {
    expect(
      buildRouteBoardCampaignProgress(contracts, {
        "first-light-delivery": {
          score: 3200,
          elapsedSeconds: 22.4,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 12, y: 8 }
          ]
        },
        "return-leg": {
          score: 3100,
          elapsedSeconds: 23.1,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 18, y: -6 }
          ]
        },
        "asteroid-sprint": {
          score: 3500,
          elapsedSeconds: 21.8,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 20, y: -10 }
          ]
        },
        "gravity-slingshot": {
          score: 3300,
          elapsedSeconds: 20.9,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 16, y: 4 }
          ]
        }
      })
    ).toEqual({
      label: "Campaign",
      value: "Campaign mastered",
      detail: "12/12 route marks",
      tone: "complete",
      progress: 1
    });
  });
});

describe("ship upgrade progression copy", () => {
  const contracts = [
    { id: "first-light-delivery" },
    { id: "return-leg" },
    { id: "asteroid-sprint" },
    { id: "gravity-slingshot" },
    { id: "black-forge-capture" }
  ];

  it("starts with the boost tune online and points at the next upgrade", () => {
    const track = buildShipUpgradeTrack(contracts, {});

    expect(track).toEqual([
      { id: "boost-tune", label: "Boost Tune", value: "Boost", requiredMarks: 0, marksRemaining: 0, unlocked: true, tone: "online" },
      { id: "reinforced-hull", label: "Reinforced Hull", value: "+HP", requiredMarks: 3, marksRemaining: 3, unlocked: false, tone: "next" },
      { id: "pulse-rail", label: "Pulse Rail", value: "Shot", requiredMarks: 7, marksRemaining: 7, unlocked: false, tone: "locked" },
      { id: "mag-clamp", label: "Mag Clamp", value: "Pickup", requiredMarks: 12, marksRemaining: 12, unlocked: false, tone: "locked" },
      { id: "forge-core", label: "Forge Core", value: "Raid", requiredMarks: 18, marksRemaining: 18, unlocked: false, tone: "locked" }
    ]);
    expect(buildShipUpgradeSummary(track)).toEqual({
      label: "Ship rank",
      value: "1/5 online",
      detail: "3 marks to Reinforced Hull",
      tone: "starter"
    });
  });

  it("unlocks upgrade tiers from route marks and marks the next tier", () => {
    const track = buildShipUpgradeTrack(contracts, {
      "first-light-delivery": {
        score: 3200,
        elapsedSeconds: 22.4,
        medal: "comet",
        ghostTrail: [
          { x: 0, y: 0 },
          { x: 12, y: 8 }
        ]
      },
      "return-leg": { score: 2900, elapsedSeconds: 28.1, medal: "comet" },
      "asteroid-sprint": { score: 1700, elapsedSeconds: 41.2, medal: "silver" }
    });

    expect(track.map((item) => item.tone)).toEqual(["online", "online", "next", "locked", "locked"]);
    expect(buildShipUpgradeSummary(track)).toEqual({
      label: "Ship rank",
      value: "2/5 online",
      detail: "1 mark to Pulse Rail",
      tone: "upgrade"
    });
  });
});

describe("route board campaign milestone target", () => {
  const contracts = [{ id: "first-light-delivery" }, { id: "return-leg" }, { id: "asteroid-sprint" }, { id: "gravity-slingshot" }];

  it("points untouched campaigns at the first quarter milestone", () => {
    expect(buildRouteBoardCampaignMilestoneTarget(contracts, {})).toEqual({
      label: "Next milestone",
      value: "25% route board",
      detail: "3 marks to go",
      tone: "quarter"
    });
  });

  it("shows marks remaining to the next crossed milestone", () => {
    expect(
      buildRouteBoardCampaignMilestoneTarget(contracts, {
        "first-light-delivery": {
          score: 3200,
          elapsedSeconds: 22.4,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 12, y: 8 }
          ]
        },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "gold" },
        "asteroid-sprint": undefined,
        "gravity-slingshot": undefined
      })
    ).toEqual({
      label: "Next milestone",
      value: "50% route board",
      detail: "2 marks to go",
      tone: "half"
    });
  });

  it("stays hidden after the campaign is fully mastered", () => {
    expect(
      buildRouteBoardCampaignMilestoneTarget(contracts, {
        "first-light-delivery": {
          score: 3200,
          elapsedSeconds: 22.4,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 12, y: 8 }
          ]
        },
        "return-leg": {
          score: 3100,
          elapsedSeconds: 23.1,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 18, y: -6 }
          ]
        },
        "asteroid-sprint": {
          score: 3500,
          elapsedSeconds: 21.8,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 20, y: -10 }
          ]
        },
        "gravity-slingshot": {
          score: 3300,
          elapsedSeconds: 20.9,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 16, y: 4 }
          ]
        }
      })
    ).toBeUndefined();
  });
});

describe("route board campaign milestone receipt copy", () => {
  const contracts = [{ id: "first-light-delivery" }, { id: "return-leg" }, { id: "asteroid-sprint" }, { id: "gravity-slingshot" }];

  it("celebrates the first quarter campaign milestone when route marks cross 25 percent", () => {
    expect(
      buildRouteBoardCampaignMilestoneReceipt(
        contracts,
        {
          "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "gold" },
          "return-leg": { score: 1900, elapsedSeconds: 32.1, medal: "gold" }
        },
        {
          "first-light-delivery": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
          "return-leg": { score: 1900, elapsedSeconds: 32.1, medal: "gold" }
        }
      )
    ).toEqual({
      label: "Campaign milestone",
      value: "25% route board",
      tone: "quarter"
    });
  });

  it("returns the highest crossed milestone when a run jumps multiple thresholds", () => {
    expect(
      buildRouteBoardCampaignMilestoneReceipt(
        contracts,
        {
          "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "gold" },
          "return-leg": { score: 1900, elapsedSeconds: 32.1, medal: "gold" }
        },
        {
          "first-light-delivery": {
            score: 3200,
            elapsedSeconds: 22.4,
            medal: "comet",
            ghostTrail: [
              { x: 0, y: 0 },
              { x: 12, y: 8 }
            ]
          },
          "return-leg": {
            score: 3100,
            elapsedSeconds: 23.1,
            medal: "comet",
            ghostTrail: [
              { x: 0, y: 0 },
              { x: 18, y: -6 }
            ]
          },
          "asteroid-sprint": { score: 2400, elapsedSeconds: 35.5, medal: "gold" }
        }
      )
    ).toEqual({
      label: "Campaign milestone",
      value: "50% route board",
      tone: "half"
    });
  });

  it("celebrates full campaign mastery", () => {
    expect(
      buildRouteBoardCampaignMilestoneReceipt(
        contracts,
        {
          "first-light-delivery": {
            score: 3200,
            elapsedSeconds: 22.4,
            medal: "comet",
            ghostTrail: [
              { x: 0, y: 0 },
              { x: 12, y: 8 }
            ]
          },
          "return-leg": {
            score: 3100,
            elapsedSeconds: 23.1,
            medal: "comet",
            ghostTrail: [
              { x: 0, y: 0 },
              { x: 18, y: -6 }
            ]
          },
          "asteroid-sprint": {
            score: 3500,
            elapsedSeconds: 21.8,
            medal: "comet",
            ghostTrail: [
              { x: 0, y: 0 },
              { x: 20, y: -10 }
            ]
          },
          "gravity-slingshot": { score: 3300, elapsedSeconds: 20.9, medal: "comet" }
        },
        {
          "first-light-delivery": {
            score: 3200,
            elapsedSeconds: 22.4,
            medal: "comet",
            ghostTrail: [
              { x: 0, y: 0 },
              { x: 12, y: 8 }
            ]
          },
          "return-leg": {
            score: 3100,
            elapsedSeconds: 23.1,
            medal: "comet",
            ghostTrail: [
              { x: 0, y: 0 },
              { x: 18, y: -6 }
            ]
          },
          "asteroid-sprint": {
            score: 3500,
            elapsedSeconds: 21.8,
            medal: "comet",
            ghostTrail: [
              { x: 0, y: 0 },
              { x: 20, y: -10 }
            ]
          },
          "gravity-slingshot": {
            score: 3400,
            elapsedSeconds: 20.1,
            medal: "comet",
            ghostTrail: [
              { x: 0, y: 0 },
              { x: 16, y: 4 }
            ]
          }
        }
      )
    ).toEqual({
      label: "Campaign milestone",
      value: "Campaign mastered",
      tone: "complete"
    });
  });

  it("stays hidden when no campaign milestone is crossed", () => {
    expect(
      buildRouteBoardCampaignMilestoneReceipt(
        contracts,
        {
          "first-light-delivery": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
          "return-leg": { score: 1900, elapsedSeconds: 32.1, medal: "gold" }
        },
        {
          "first-light-delivery": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
          "return-leg": { score: 1900, elapsedSeconds: 32.1, medal: "gold" },
          "asteroid-sprint": { score: 2400, elapsedSeconds: 35.5, medal: "gold" }
        }
      )
    ).toBeUndefined();
  });
});

describe("route board mastery copy", () => {
  const contracts = [{ id: "first-light-delivery" }, { id: "return-leg" }, { id: "asteroid-sprint" }, { id: "gravity-slingshot" }];

  it("frames unopened boards as a route-clearing campaign", () => {
    expect(
      buildRouteBoardMastery(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "return-leg": undefined,
        "asteroid-sprint": undefined,
        "gravity-slingshot": undefined
      })
    ).toEqual({
      label: "Board mastery",
      value: "3 routes to clear",
      tone: "progress"
    });
  });

  it("switches to comet mastery once every route has a clear", () => {
    expect(
      buildRouteBoardMastery(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
        "asteroid-sprint": { score: 2400, elapsedSeconds: 35.5, medal: "gold" },
        "gravity-slingshot": { score: 2100, elapsedSeconds: 48.6, medal: "bronze" }
      })
    ).toEqual({
      label: "Board mastery",
      value: "3 comets to master",
      tone: "mastery"
    });
  });

  it("switches to ghost banking after the comet sweep", () => {
    expect(
      buildRouteBoardMastery(contracts, {
        "first-light-delivery": { score: 3200, elapsedSeconds: 22.4, medal: "comet" },
        "return-leg": { score: 3100, elapsedSeconds: 23.1, medal: "comet" },
        "asteroid-sprint": { score: 3500, elapsedSeconds: 21.8, medal: "comet" },
        "gravity-slingshot": { score: 3300, elapsedSeconds: 20.9, medal: "comet" }
      })
    ).toEqual({
      label: "Board mastery",
      value: "4 ghosts to bank",
      tone: "mastery"
    });
  });

  it("celebrates full route boards after every ghost mark is banked", () => {
    expect(
      buildRouteBoardMastery(contracts, {
        "first-light-delivery": {
          score: 3200,
          elapsedSeconds: 22.4,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 12, y: 8 }
          ]
        },
        "return-leg": {
          score: 3100,
          elapsedSeconds: 23.1,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 18, y: -6 }
          ]
        },
        "asteroid-sprint": {
          score: 3500,
          elapsedSeconds: 21.8,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 20, y: -10 }
          ]
        },
        "gravity-slingshot": {
          score: 3300,
          elapsedSeconds: 20.9,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 16, y: 4 }
          ]
        }
      })
    ).toEqual({
      label: "Board mastery",
      value: "Full route board",
      tone: "complete"
    });
  });
});

describe("route board next target copy", () => {
  const contracts = [
    { id: "first-light-delivery", title: "First Light" },
    { id: "return-leg", title: "Return Leg" },
    { id: "asteroid-sprint", title: "Asteroid Sprint" },
    { id: "gravity-slingshot", title: "Gravity Slingshot" }
  ];

  it("prioritizes the first route without any clear", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "return-leg": undefined,
        "asteroid-sprint": undefined,
        "gravity-slingshot": undefined
      })
    ).toEqual({ label: "Next clear", value: "Clear Return Leg", tone: "clear", contractId: "return-leg" });
  });

  it("calls out unopened bonus and puzzle routes distinctly", () => {
    const puzzleContracts = [
      { id: "first-light-delivery", title: "First Light" },
      { id: "asteroid-labyrinth", title: "Asteroid Labyrinth" },
      { id: "gravity-lockpick", title: "Gravity Lockpick" },
      { id: "solar-thread", title: "Solar Thread" }
    ];

    expect(
      buildRouteBoardTarget(puzzleContracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "asteroid-labyrinth": undefined,
        "gravity-lockpick": undefined,
        "solar-thread": undefined
      })
    ).toEqual({ label: "Bonus clear", value: "Clear Asteroid Labyrinth", tone: "clear", contractId: "asteroid-labyrinth" });

    expect(
      buildRouteBoardTarget(puzzleContracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "asteroid-labyrinth": { score: 2200, elapsedSeconds: 38.1, medal: "gold" },
        "gravity-lockpick": undefined,
        "solar-thread": undefined
      })
    ).toEqual({ label: "Puzzle clear", value: "Clear Gravity Lockpick", tone: "clear", contractId: "gravity-lockpick" });
  });

  it("switches to comet chase once every route is cleared", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "silver" },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "comet" },
        "asteroid-sprint": { score: 2400, elapsedSeconds: 35.5, medal: "gold" },
        "gravity-slingshot": { score: 2100, elapsedSeconds: 48.6, medal: "bronze" }
      })
    ).toEqual({ label: "Comet chase", value: "Comet Asteroid Sprint", tone: "comet", contractId: "asteroid-sprint" });
  });

  it("keeps board order as the tie-breaker among equal comet chases", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": { score: 1800, elapsedSeconds: 34.2, medal: "gold" },
        "return-leg": { score: 2600, elapsedSeconds: 27.1, medal: "gold" },
        "asteroid-sprint": { score: 2400, elapsedSeconds: 35.5, medal: "silver" },
        "gravity-slingshot": { score: 2100, elapsedSeconds: 48.6, medal: "bronze" }
      })
    ).toEqual({ label: "Comet chase", value: "Comet First Light", tone: "comet", contractId: "first-light-delivery" });
  });

  it("celebrates a fully mastered route board", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": {
          score: 3200,
          elapsedSeconds: 22.4,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 12, y: 8 }
          ]
        },
        "return-leg": {
          score: 3100,
          elapsedSeconds: 23.1,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 18, y: -6 }
          ]
        },
        "asteroid-sprint": {
          score: 3500,
          elapsedSeconds: 21.8,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 20, y: -10 }
          ]
        },
        "gravity-slingshot": {
          score: 3300,
          elapsedSeconds: 20.9,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 16, y: 4 }
          ]
        }
      })
    ).toEqual({ label: "Board status", value: "Board mastered", tone: "complete" });
  });

  it("targets ghost capture after every route has a comet clear", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": { score: 3200, elapsedSeconds: 22.4, medal: "comet" },
        "return-leg": {
          score: 3100,
          elapsedSeconds: 23.1,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 18, y: -6 }
          ]
        },
        "asteroid-sprint": { score: 3500, elapsedSeconds: 21.8, medal: "comet" },
        "gravity-slingshot": { score: 3300, elapsedSeconds: 20.9, medal: "comet" }
      })
    ).toEqual({
      label: "Ghost chase",
      value: "Capture First Light ghost",
      detail: "Match PB 3200 / 22.4s to save trail",
      tone: "ghost",
      contractId: "first-light-delivery"
    });
  });

  it("keeps board order as the tie-breaker among missing ghost marks", () => {
    expect(
      buildRouteBoardTarget(contracts, {
        "first-light-delivery": { score: 3200, elapsedSeconds: 22.4, medal: "comet" },
        "return-leg": {
          score: 3100,
          elapsedSeconds: 23.1,
          medal: "comet",
          ghostTrail: [
            { x: 0, y: 0 },
            { x: 18, y: -6 }
          ]
        },
        "asteroid-sprint": { score: 3500, elapsedSeconds: 21.8, medal: "comet" },
        "gravity-slingshot": { score: 3300, elapsedSeconds: 20.9, medal: "comet" }
      })
    ).toEqual({
      label: "Ghost chase",
      value: "Capture First Light ghost",
      detail: "Match PB 3200 / 22.4s to save trail",
      tone: "ghost",
      contractId: "first-light-delivery"
    });
  });
});

describe("route board target selection action", () => {
  it("selects the recommended target when it differs from the current route", () => {
    expect(
      buildRouteBoardSelectionAction(
        { label: "Next clear", value: "Clear Return Leg", tone: "clear", contractId: "return-leg" },
        "first-light-delivery"
      )
    ).toEqual({ label: "Open route", contractId: "return-leg" });
  });

  it("uses compact bonus and puzzle copy for special clear targets", () => {
    expect(
      buildRouteBoardSelectionAction(
        { label: "Bonus clear", value: "Clear Asteroid Labyrinth", tone: "clear", contractId: "asteroid-labyrinth" },
        "first-light-delivery"
      )
    ).toEqual({ label: "Open bonus", contractId: "asteroid-labyrinth" });

    expect(
      buildRouteBoardSelectionAction(
        { label: "Puzzle clear", value: "Clear Solar Thread", tone: "clear", contractId: "solar-thread" },
        "first-light-delivery"
      )
    ).toEqual({ label: "Open puzzle", contractId: "solar-thread" });
  });

  it("uses chase copy when a comet target is on a different route", () => {
    expect(
      buildRouteBoardSelectionAction(
        { label: "Comet chase", value: "Comet Asteroid Sprint", tone: "comet", contractId: "asteroid-sprint" },
        "first-light-delivery"
      )
    ).toEqual({ label: "Chase comet", contractId: "asteroid-sprint" });
  });

  it("stays passive when the current route is already the target", () => {
    expect(
      buildRouteBoardSelectionAction(
        { label: "Comet chase", value: "Comet Asteroid Sprint", tone: "comet", contractId: "asteroid-sprint" },
        "asteroid-sprint"
      )
    ).toBeUndefined();
  });

  it("stays passive after the full route board is mastered", () => {
    expect(buildRouteBoardSelectionAction({ label: "Board status", value: "Board mastered", tone: "complete" }, "gravity-slingshot")).toBeUndefined();
  });

  it("selects a ghost capture target when a comet route still needs a replay mark", () => {
    expect(
      buildRouteBoardSelectionAction(
        { label: "Ghost chase", value: "Capture First Light ghost", tone: "ghost", contractId: "first-light-delivery" },
        "gravity-slingshot"
      )
    ).toEqual({ label: "Capture ghost", contractId: "first-light-delivery" });
  });
});

describe("route board recommendation badge", () => {
  it("labels clear targets as the next recommended route", () => {
    expect(
      buildRouteBoardRecommendationBadge({
        label: "Next clear",
        value: "Clear Return Leg",
        tone: "clear",
        contractId: "return-leg"
      })
    ).toBe("Next");
  });

  it("labels chain relay clear targets as relay badges", () => {
    expect(
      buildRouteBoardRecommendationBadge({
        label: "Next clear",
        value: "Clear Chain Relay",
        tone: "clear",
        contractId: "chain-relay"
      })
    ).toBe("Relay");
  });

  it("labels bonus and puzzle clear targets distinctly", () => {
    expect(
      buildRouteBoardRecommendationBadge({
        label: "Bonus clear",
        value: "Clear Asteroid Labyrinth",
        tone: "clear",
        contractId: "asteroid-labyrinth"
      })
    ).toBe("Bonus");

    expect(
      buildRouteBoardRecommendationBadge({
        label: "Puzzle clear",
        value: "Clear Solar Thread",
        tone: "clear",
        contractId: "solar-thread"
      })
    ).toBe("Puzzle");
  });

  it("labels comet targets as comet badges", () => {
    expect(
      buildRouteBoardRecommendationBadge({
        label: "Comet chase",
        value: "Comet Asteroid Sprint",
        tone: "comet",
        contractId: "asteroid-sprint"
      })
    ).toBe("Comet");
  });

  it("labels ghost chase targets as ghost badges", () => {
    expect(
      buildRouteBoardRecommendationBadge({
        label: "Ghost chase",
        value: "Capture Return Leg ghost",
        tone: "ghost",
        contractId: "return-leg"
      })
    ).toBe("Ghost");
  });

  it("stays hidden once the route board is complete", () => {
    expect(buildRouteBoardRecommendationBadge({ label: "Board status", value: "Board mastered", tone: "complete" })).toBeUndefined();
  });
});

describe("personal best result delta copy", () => {
  it("stays hidden before a contract has any saved best", () => {
    expect(
      buildBestRunDelta({
        bestRun: undefined,
        run: { score: 1800, elapsedSeconds: 31.2, medal: "silver" },
        isNewBest: false
      })
    ).toBeUndefined();
  });

  it("celebrates a new personal best result", () => {
    expect(
      buildBestRunDelta({
        bestRun: { score: 2200, elapsedSeconds: 28.4, medal: "gold" },
        run: { score: 2200, elapsedSeconds: 28.4, medal: "gold" },
        isNewBest: true
      })
    ).toEqual({
      label: "PB delta",
      value: "New personal best",
      tone: "success"
    });
  });

  it("shows the score gap when the saved best is still ahead", () => {
    expect(
      buildBestRunDelta({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        run: { score: 3040, elapsedSeconds: 23.8, medal: "gold" },
        isNewBest: false
      })
    ).toEqual({
      label: "PB delta",
      value: "Need +250 score",
      tone: "chase"
    });
  });

  it("shows the time gap when the score is tied but the saved best is faster", () => {
    expect(
      buildBestRunDelta({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        run: { score: 3290, elapsedSeconds: 26.1, medal: "gold" },
        isNewBest: false
      })
    ).toEqual({
      label: "PB delta",
      value: "Need 1.4s faster",
      tone: "chase"
    });
  });

  it("recognizes an exact personal best match", () => {
    expect(
      buildBestRunDelta({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        run: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        isNewBest: false
      })
    ).toEqual({
      label: "PB delta",
      value: "Matched personal best",
      tone: "success"
    });
  });
});

describe("live personal best pace copy", () => {
  const ghostBestRun = {
    score: 3290,
    elapsedSeconds: 24.7,
    medal: "gold" as const,
    ghostTrail: [
      { x: 0, y: 0 },
      { x: 12, y: 8 }
    ]
  };

  it("stays hidden without a saved best or after the run has finished", () => {
    expect(buildLiveBestPace({ bestRun: undefined, elapsedSeconds: 12, status: "flying" })).toBeUndefined();
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        elapsedSeconds: 12,
        status: "delivered"
      })
    ).toBeUndefined();
  });

  it("shows time bank while the current run is ahead of the saved finish time", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        elapsedSeconds: 18.2,
        status: "flying"
      })
    ).toEqual({
      label: "PB pace",
      value: "6.5s bank",
      tone: "ahead"
    });
  });

  it("uses ghost chase copy when the saved best has a replay trail", () => {
    expect(
      buildLiveBestPace({
        bestRun: ghostBestRun,
        elapsedSeconds: 18.2,
        status: "flying"
      })
    ).toEqual({
      label: "Ghost chase",
      value: "6.5s ahead of ghost",
      tone: "ahead"
    });
  });

  it("uses ghost copy for live score leads and score gaps", () => {
    expect(
      buildLiveBestPace({
        bestRun: ghostBestRun,
        score: 3440,
        elapsedSeconds: 18.2,
        status: "flying"
      })
    ).toEqual({
      label: "Ghost chase",
      value: "+150 ghost lead",
      tone: "ahead"
    });
    expect(
      buildLiveBestPace({
        bestRun: ghostBestRun,
        score: 3040,
        elapsedSeconds: 27.1,
        status: "flying"
      })
    ).toEqual({
      label: "Ghost chase",
      value: "Need +250 vs ghost",
      tone: "behind"
    });
  });

  it("uses ghost clutch copy for live score leads near the dock", () => {
    expect(
      buildLiveBestPace({
        bestRun: ghostBestRun,
        score: 3440,
        elapsedSeconds: 22.4,
        targetDistance: 120,
        status: "flying"
      })
    ).toEqual({
      label: "Ghost clutch",
      value: "Defend ghost +150",
      tone: "clutch"
    });
  });

  it("prioritizes a live score lead over the saved finish time", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        score: 3440,
        elapsedSeconds: 18.2,
        status: "flying"
      })
    ).toEqual({
      label: "PB chase",
      value: "+150 score lead",
      tone: "ahead"
    });
  });

  it("turns a live score lead into a clutch defend cue near the dock", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        score: 3440,
        elapsedSeconds: 22.4,
        targetDistance: 120,
        status: "flying"
      })
    ).toEqual({
      label: "PB clutch",
      value: "Defend +150 into dock",
      tone: "clutch"
    });
  });

  it("shows overtime once the current run has passed the saved finish time", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        elapsedSeconds: 27.1,
        status: "paused"
      })
    ).toEqual({
      label: "PB pace",
      value: "2.4s over",
      tone: "behind"
    });
  });

  it("shows the live score gap once the run is behind the saved score and time", () => {
    expect(
      buildLiveBestPace({
        bestRun: { score: 3290, elapsedSeconds: 24.7, medal: "gold" },
        score: 3040,
        elapsedSeconds: 27.1,
        status: "flying"
      })
    ).toEqual({
      label: "PB chase",
      value: "Need +250 score",
      tone: "behind"
    });
  });
});

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
