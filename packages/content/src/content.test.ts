import { describe, expect, it } from "vitest";
import starterRoute from "../data/systems/starter-route.json";
import { systemSchema, validateSystemContent } from "./index";

describe("content schemas", () => {
  it("validates the starter route content bundle", () => {
    const parsed = validateSystemContent(starterRoute);

    expect(parsed.id).toBe("starter-route");
    expect(parsed.contracts[0]?.id).toBe("first-light-delivery");
    expect(parsed.contracts.map((contract) => contract.id)).toContain("return-leg");
    expect(parsed.planets[0]?.landingPads[0]?.allowedApproachSpeed).toBeGreaterThan(0);
  });

  it("rejects invalid gravity and landing thresholds", () => {
    const result = systemSchema.safeParse({
      ...starterRoute,
      planets: [
        {
          ...starterRoute.planets[0],
          gravityMass: -1,
          landingPads: [
            {
              ...starterRoute.planets[0].landingPads[0],
              allowedApproachSpeed: 0
            }
          ]
        }
      ]
    });

    if (result.success) {
      throw new Error("Expected invalid content to fail validation");
    }

    const issuePaths = result.error.issues.map((issue) => issue.path.join("."));
    expect(issuePaths).toContain("planets.0.gravityMass");
    expect(issuePaths).toContain("planets.0.landingPads.0.allowedApproachSpeed");
  });
});
