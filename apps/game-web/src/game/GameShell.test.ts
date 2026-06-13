import { describe, expect, it, vi } from "vitest";
import { GameShell } from "./GameShell";
import type { AstroPixiRenderer } from "@astro-courier/renderer-pixi";
import type { InputSource } from "./input";

describe("GameShell lifecycle", () => {
  it("does not publish HUD or start frames after being destroyed during async mount", async () => {
    let resolveMount: () => void = () => {};
    const renderer: AstroPixiRenderer = {
      mount: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveMount = resolve;
          })
      ),
      render: vi.fn(),
      destroy: vi.fn()
    };
    const input: InputSource = {
      attach: vi.fn(),
      detach: vi.fn(),
      commands: vi.fn(() => [])
    };
    const onHud = vi.fn();
    const requestAnimationFrameSpy = vi.fn(() => 7);
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrameSpy);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const shell = new GameShell({
      mount: {} as HTMLElement,
      onHud,
      renderer,
      input
    });
    const startPromise = shell.start();
    shell.destroy();

    resolveMount();
    await startPromise;

    expect(input.attach).not.toHaveBeenCalled();
    expect(onHud).not.toHaveBeenCalled();
    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();
  });
});
