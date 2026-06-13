import { describe, expect, it } from "vitest";
import { getNextContractId } from "./contracts";

describe("contract rotation", () => {
  it("returns the next contract id and wraps at the end", () => {
    const contracts = [
      { id: "first-light-delivery" },
      { id: "return-leg" },
      { id: "asteroid-sprint" }
    ];

    expect(getNextContractId(contracts, "first-light-delivery")).toBe("return-leg");
    expect(getNextContractId(contracts, "asteroid-sprint")).toBe("first-light-delivery");
  });

  it("keeps the current contract when there is no safe next option", () => {
    expect(getNextContractId([{ id: "solo" }], "solo")).toBe("solo");
    expect(getNextContractId([], "missing")).toBe("missing");
    expect(getNextContractId([{ id: "known" }], "missing")).toBe("missing");
  });
});
