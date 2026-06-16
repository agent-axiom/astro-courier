import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("responsive game layout CSS", () => {
  it("uses a wider two-column preflight briefing on desktop viewports", () => {
    expect(styles).toContain("@media (min-width: 900px)");
    expect(styles).toContain("width: min(860px, calc(100vw - 48px));");
    expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(styles).toContain("grid-column: 1 / -1;");
  });

  it("frames result coach cards with tone-aware post-run emphasis", () => {
    expect(styles).toMatch(/\.result-coach[\s\S]*\{[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.1\);/);
    expect(styles).toMatch(/\.result-coach-danger\s*\{[\s\S]*border-color: rgba\(255, 111, 145, 0\.36\);/);
    expect(styles).toMatch(/\.result-coach-success\s*\{[\s\S]*box-shadow: 0 0 24px rgba\(142, 230, 184, 0\.1\);/);
  });

  it("defines a compact focused result overlay for crash lessons", () => {
    expect(styles).toContain(".result-overlay-focused");
    expect(styles).toMatch(/\.result-overlay-focused[\s\S]*width: min\(340px, calc\(100vw - 32px\)\);/);
    expect(styles).toMatch(/\.result-overlay-focused \.result-coach[\s\S]*grid-template-columns: 18px 1fr;/);
  });

  it("defines a lighter focused live run panel", () => {
    expect(styles).toContain(".run-panel-focused");
    expect(styles).toMatch(/\.run-panel-focused[\s\S]*width: min\(260px, calc\(100vw - 32px\)\);/);
    expect(styles).toMatch(/\.run-panel-focused \.radio-message[\s\S]*display: none;/);
  });

  it("defines compact active-flight metrics without text labels", () => {
    expect(styles).toMatch(/\.top-hud-compact \.metric[\s\S]*grid-template-columns: 18px auto;/);
    expect(styles).toMatch(/\.top-hud-compact \.metric strong[\s\S]*min-width: 0;/);
  });

  it("defines a focused preflight mode that trims route-selection text", () => {
    expect(styles).toContain(".preflight-overlay-focused");
    expect(styles).toMatch(/\.preflight-overlay-focused[\s\S]*width: min\(420px, calc\(100vw - 32px\)\);/);
    expect(styles).toMatch(/\.preflight-overlay-focused \.contract-option-hook[\s\S]*display: none;/);
    expect(styles).toMatch(/\.preflight-overlay-focused \.contract-option-traits[\s\S]*display: none;/);
  });

  it("defines an icon-only first launch control primer", () => {
    expect(styles).toContain(".control-primer");
    expect(styles).toMatch(/\.control-primer[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
    expect(styles).toMatch(/\.control-primer span[\s\S]*aspect-ratio: 1;/);
  });

  it("defines a dedicated fuel-clutch screen feedback accent", () => {
    expect(styles).toContain(".screen-feedback-accent-fuel");
    expect(styles).toContain("screen-feedback-fuel-surge");
  });

  it("defines a dedicated route tempo screen feedback accent", () => {
    expect(styles).toContain(".screen-feedback-accent-tempo");
    expect(styles).toContain("screen-feedback-tempo-sweep");
  });

  it("defines a dedicated clutch tone for low-fuel style targets", () => {
    expect(styles).toContain(".style-target-clutch");
  });

  it("defines a dedicated brake stress control tone", () => {
    expect(styles).toContain(".brake-button-stress");
    expect(styles).toContain("rgba(255, 111, 145");
  });

  it("defines a dedicated dry-fuel boost control tone", () => {
    expect(styles).toContain(".boost-button-fuel");
    expect(styles).toContain("rgba(255, 111, 145");
  });

  it("defines tone-aware route tempo HUD chips", () => {
    expect(styles).toContain(".tempo-chip");
    expect(styles).toContain(".tempo-chip-flow");
    expect(styles).toContain(".tempo-chip-clutch");
    expect(styles).toContain(".tempo-chip-danger");
  });

  it("defines a dedicated soft-dock guidance tone", () => {
    expect(styles).toContain(".guidance-soft");
    expect(styles).toContain("rgba(142, 230, 184");
  });

  it("defines context-aware touch flight pad tones", () => {
    expect(styles).toContain(".touch-flight-pad-precision");
    expect(styles).toContain(".touch-flight-pad-danger");
    expect(styles).toContain(".touch-flight-pad-opportunity");
    expect(styles).toContain("rgba(142, 230, 184");
    expect(styles).toContain("rgba(255, 111, 145");
    expect(styles).toContain("rgba(255, 209, 102");
  });

  it("shows touch flight controls on narrow mobile layouts even without coarse pointer media", () => {
    expect(styles).toMatch(
      /@media \(max-width: 760px\)[\s\S]*\.touch-flight-pad-active,[\s\S]*\.touch-flight-pad-precision,[\s\S]*\.touch-flight-pad-danger,[\s\S]*\.touch-flight-pad-opportunity[\s\S]*\{[\s\S]*display: grid;/
    );
  });

  it("defines tone-aware route tempo action chips", () => {
    expect(styles).toContain(".tempo-action-chip");
    expect(styles).toContain(".tempo-action-flow");
    expect(styles).toContain(".tempo-action-clutch");
    expect(styles).toContain(".tempo-action-danger");
  });

  it("defines ambient route tempo shell states", () => {
    expect(styles).toContain(".app-route-tempo-flow::before");
    expect(styles).toContain(".app-route-tempo-clutch::before");
    expect(styles).toContain(".app-route-tempo-danger::before");
    expect(styles).toContain("route-tempo-flow");
  });

  it("defines tone-aware result tempo recap chips", () => {
    expect(styles).toContain(".result-tempo-recap");
    expect(styles).toContain(".result-tempo-flow");
    expect(styles).toContain(".result-tempo-clutch");
    expect(styles).toContain(".result-tempo-danger");
  });

  it("defines a lightweight style chain meter overlay", () => {
    expect(styles).toContain(".style-chain-meter");
    expect(styles).toContain(".style-chain-meter-fresh");
    expect(styles).toContain(".style-chain-meter-urgent");
    expect(styles).toContain("--style-chain-meter-progress");
    expect(styles).toContain(".style-chain-meter-pip-active");
  });
});
