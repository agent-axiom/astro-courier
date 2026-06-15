import { describe, expect, it } from "vitest";
import { resolveRunHotkeyAction, isBlockedRunHotkeyTarget } from "./runHotkeys";

describe("run shell hotkeys", () => {
  it("launches from preflight with Enter", () => {
    expect(resolveRunHotkeyAction({ code: "Enter", preflightOpen: true, resultOpen: false })).toBe("launch");
    expect(resolveRunHotkeyAction({ code: "Enter", preflightOpen: false, resultOpen: false })).toBeUndefined();
  });

  it("launches from preflight with Space without affecting live or result screens", () => {
    expect(resolveRunHotkeyAction({ code: "Space", preflightOpen: true, resultOpen: false })).toBe("launch");
    expect(resolveRunHotkeyAction({ code: "Space", preflightOpen: false, resultOpen: false, canTogglePause: true })).toBeUndefined();
    expect(resolveRunHotkeyAction({ code: "Space", preflightOpen: false, resultOpen: true })).toBeUndefined();
  });

  it("maps result overlay hotkeys to fast retry actions", () => {
    expect(resolveRunHotkeyAction({ code: "KeyR", preflightOpen: false, resultOpen: true })).toBe("restart-run");
    expect(resolveRunHotkeyAction({ code: "KeyB", preflightOpen: false, resultOpen: true })).toBe("restart-briefing");
    expect(resolveRunHotkeyAction({ code: "KeyR", preflightOpen: false, resultOpen: false })).toBeUndefined();
  });

  it("toggles pause from live routes with Escape or P", () => {
    expect(resolveRunHotkeyAction({ code: "Escape", preflightOpen: false, resultOpen: false, canTogglePause: true })).toBe(
      "toggle-pause"
    );
    expect(resolveRunHotkeyAction({ code: "KeyP", preflightOpen: false, resultOpen: false, canTogglePause: true })).toBe("toggle-pause");
    expect(resolveRunHotkeyAction({ code: "KeyP", preflightOpen: true, resultOpen: false, canTogglePause: true })).toBeUndefined();
    expect(resolveRunHotkeyAction({ code: "Escape", preflightOpen: false, resultOpen: true, canTogglePause: true })).toBeUndefined();
    expect(resolveRunHotkeyAction({ code: "KeyP", preflightOpen: false, resultOpen: false, canTogglePause: false })).toBeUndefined();
  });

  it("ignores modified, repeated, composed, or focused-control keypresses", () => {
    expect(resolveRunHotkeyAction({ code: "Enter", preflightOpen: true, resultOpen: false, altKey: true })).toBeUndefined();
    expect(resolveRunHotkeyAction({ code: "KeyR", preflightOpen: false, resultOpen: true, repeat: true })).toBeUndefined();
    expect(resolveRunHotkeyAction({ code: "KeyB", preflightOpen: false, resultOpen: true, isComposing: true })).toBeUndefined();
    expect(
      resolveRunHotkeyAction({
        code: "KeyP",
        preflightOpen: false,
        resultOpen: false,
        canTogglePause: true,
        ctrlKey: true
      })
    ).toBeUndefined();
    expect(
      resolveRunHotkeyAction({
        code: "KeyR",
        preflightOpen: false,
        resultOpen: true,
        target: { tagName: "input" }
      })
    ).toBeUndefined();
    expect(
      resolveRunHotkeyAction({
        code: "Enter",
        preflightOpen: true,
        resultOpen: false,
        target: { tagName: "button" }
      })
    ).toBeUndefined();
  });

  it("detects focused targets that should keep native keyboard behavior", () => {
    expect(isBlockedRunHotkeyTarget({ tagName: "TEXTAREA" })).toBe(true);
    expect(isBlockedRunHotkeyTarget({ tagName: "select" })).toBe(true);
    expect(isBlockedRunHotkeyTarget({ tagName: "button" })).toBe(true);
    expect(isBlockedRunHotkeyTarget({ tagName: "a" })).toBe(true);
    expect(isBlockedRunHotkeyTarget({ isContentEditable: true })).toBe(true);
    expect(isBlockedRunHotkeyTarget({ tagName: "div" })).toBe(false);
    expect(isBlockedRunHotkeyTarget(null)).toBe(false);
  });
});
