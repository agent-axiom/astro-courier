import { describe, expect, it } from "vitest";
import { calculateContractPace } from "./pace";

const medalTimes = {
  bronze: 90,
  silver: 55,
  gold: 35
};

describe("contract pace", () => {
  it("tracks the active medal window and remaining seconds", () => {
    expect(calculateContractPace(12.25, medalTimes)).toEqual({
      tier: "gold",
      secondsRemaining: 22.75
    });
    expect(calculateContractPace(44, medalTimes)).toEqual({
      tier: "silver",
      secondsRemaining: 11
    });
    expect(calculateContractPace(72.6, medalTimes)).toEqual({
      tier: "bronze",
      secondsRemaining: 17.4
    });
  });

  it("reports overtime once medal pace has expired", () => {
    expect(calculateContractPace(94.1, medalTimes)).toEqual({
      tier: "overtime",
      secondsRemaining: 0
    });
  });
});
