import { describe, expect, it } from "vitest";
import { buildMissionHook } from "./missionHook";

describe("mission hook presentation", () => {
  it("turns smuggler and evac hooks into compact preflight copy", () => {
    expect(
      buildMissionHook({
        id: "smuggler-scan-run",
        title: "Smuggler Scan Run",
        missionHook: "smuggler",
        riskLabel: "Scanner Net"
      })
    ).toEqual({
      label: "Hook",
      value: "Stay cold",
      detail: "Scanner Net",
      tone: "stealth"
    });

    expect(
      buildMissionHook({
        id: "evacuation-window",
        title: "Evacuation Window",
        missionHook: "evac",
        riskLabel: "Rescue Clock"
      })
    ).toEqual({
      label: "Hook",
      value: "Extract fast",
      detail: "Rescue Clock",
      tone: "rescue"
    });
  });

  it("keeps ordinary contracts quiet", () => {
    expect(
      buildMissionHook({
        id: "first-light-delivery",
        title: "First Light Delivery",
        riskLabel: "Training Route"
      })
    ).toBeUndefined();
  });
});
