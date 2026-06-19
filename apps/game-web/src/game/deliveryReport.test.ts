import { describe, expect, it } from "vitest";
import { buildShareableDeliveryReport } from "./deliveryReport";

describe("shareable delivery report", () => {
  it("formats delivered runs as a compact copyable courier receipt", () => {
    expect(
      buildShareableDeliveryReport({
        status: "delivered",
        contractTitle: "First Light Delivery",
        cargoName: "Bottled Starlight",
        score: 2400,
        elapsedSeconds: 31.26,
        cargoIntegrity: 0.874,
        medal: "gold",
        grade: "A",
        landingBonus: 300,
        url: "https://agent-axiom.github.io/astro-courier/"
      })
    ).toBe(
      [
        "Astro Courier delivery: First Light Delivery",
        "Bottled Starlight - 31.3s - 2400 pts - 87% cargo",
        "Dock: Perfect - Medal: Gold - Grade: A",
        "https://agent-axiom.github.io/astro-courier/"
      ].join("\n")
    );
  });

  it("formats failed runs without pretending the delivery succeeded", () => {
    expect(
      buildShareableDeliveryReport({
        status: "crashed",
        contractTitle: "Asteroid Sprint",
        cargoName: "Comet Ice",
        score: 390,
        elapsedSeconds: 9.84,
        cargoIntegrity: 0,
        medal: "none",
        grade: "F",
        landingBonus: 0,
        url: "https://agent-axiom.github.io/astro-courier/"
      })
    ).toBe(
      [
        "Astro Courier route failed: Asteroid Sprint",
        "Comet Ice - 9.8s - 390 pts - 0% cargo",
        "Dock: Failed - Medal: None - Grade: F",
        "https://agent-axiom.github.io/astro-courier/"
      ].join("\n")
    );
  });
});
