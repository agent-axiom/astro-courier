import { describe, expect, it } from "vitest";
import { buildPauseOverlayPresentation } from "./pauseOverlay";

describe("pause overlay", () => {
  it("presents a focused live-route pause state with run stats and actions", () => {
    expect(
      buildPauseOverlayPresentation({
        status: "paused",
        preflightOpen: false,
        resultOpen: false,
        contractTitle: "Insurance Event",
        elapsedSeconds: 9.84,
        score: 29,
        cargoIntegrity: 1
      })
    ).toEqual({
      title: "Route Paused",
      detail: "Insurance Event",
      stats: [
        { label: "Time", value: "9.8s" },
        { label: "Score", value: "29" },
        { label: "Cargo", value: "100%" }
      ],
      actions: [
        { id: "resume", icon: "play", label: "Resume", tone: "primary" },
        { id: "restart", icon: "restart", label: "Restart", tone: "secondary" },
        { id: "briefing", icon: "route", label: "Briefing", tone: "secondary" }
      ]
    });
  });

  it("stays hidden while briefing, result, or normal flight owns the screen", () => {
    const base = {
      contractTitle: "Insurance Event",
      elapsedSeconds: 9.84,
      score: 29,
      cargoIntegrity: 1
    };

    expect(buildPauseOverlayPresentation({ ...base, status: "paused", preflightOpen: true, resultOpen: false })).toBeUndefined();
    expect(buildPauseOverlayPresentation({ ...base, status: "paused", preflightOpen: false, resultOpen: true })).toBeUndefined();
    expect(buildPauseOverlayPresentation({ ...base, status: "flying", preflightOpen: false, resultOpen: false })).toBeUndefined();
    expect(buildPauseOverlayPresentation({ ...base, status: "crashed", preflightOpen: false, resultOpen: true })).toBeUndefined();
  });
});
