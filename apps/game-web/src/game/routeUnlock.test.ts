import { describe, expect, it } from "vitest";
import { buildRouteUnlockAction } from "./routeUnlock";

describe("route unlock action", () => {
  it("turns a delivered clear target into a compact next-route action", () => {
    expect(
      buildRouteUnlockAction({
        status: "delivered",
        currentContractId: "first-light-delivery",
        routeBoardTarget: {
          label: "Next clear",
          value: "Clear Return Leg",
          tone: "clear",
          contractId: "return-leg"
        }
      })
    ).toEqual({
      label: "Next",
      value: "Return Leg",
      targetContractId: "return-leg",
      tone: "clear"
    });
  });

  it("does not show route unlocks for crashes or same-route targets", () => {
    expect(
      buildRouteUnlockAction({
        status: "crashed",
        currentContractId: "first-light-delivery",
        routeBoardTarget: {
          label: "Next clear",
          value: "Clear Return Leg",
          tone: "clear",
          contractId: "return-leg"
        }
      })
    ).toBeUndefined();

    expect(
      buildRouteUnlockAction({
        status: "delivered",
        currentContractId: "first-light-delivery",
        routeBoardTarget: {
          label: "Next clear",
          value: "Clear First Light Delivery",
          tone: "clear",
          contractId: "first-light-delivery"
        }
      })
    ).toBeUndefined();
  });

  it("keeps mastery, comet, and ghost targets out of the first-clear unlock action", () => {
    expect(
      buildRouteUnlockAction({
        status: "delivered",
        currentContractId: "first-light-delivery",
        routeBoardTarget: {
          label: "Comet chase",
          value: "Comet First Light Delivery",
          tone: "comet",
          contractId: "first-light-delivery"
        }
      })
    ).toBeUndefined();

    expect(
      buildRouteUnlockAction({
        status: "delivered",
        currentContractId: "first-light-delivery",
        routeBoardTarget: {
          label: "Board status",
          value: "Board mastered",
          tone: "complete"
        }
      })
    ).toBeUndefined();
  });
});
