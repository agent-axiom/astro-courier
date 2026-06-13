import { describe, expect, it, vi } from "vitest";
import { GameShell } from "./GameShell";
import type { AstroPixiRenderer } from "@astro-courier/renderer-pixi";
import type { InputSource } from "./input";

describe("GameShell lifecycle", () => {
  it("does not publish HUD or start frames after being destroyed during async mount", async () => {
    let resolveMount: () => void = () => undefined;
    const { renderer, input } = createShellDoubles({
      mount: () =>
        new Promise<void>((resolve) => {
          resolveMount = resolve;
        })
    });
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

  it("publishes a paused HUD and ignores player commands when started in preflight mode", async () => {
    const { renderer, input } = createShellDoubles();
    const onHud = vi.fn();
    let frame: FrameRequestCallback = () => 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frame = callback;
        return 7;
      })
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(performance, "now").mockReturnValue(1000);

    const shell = new GameShell({
      mount: {} as HTMLElement,
      onHud,
      renderer,
      input,
      initialPaused: true
    });

    await shell.start();
    frame(1167);

    expect(onHud.mock.calls[0]?.[0].status).toBe("paused");
    expect(onHud.mock.calls[0]?.[0].paceTier).toBe("gold");
    expect(onHud.mock.calls[0]?.[0].paceSecondsRemaining).toBe(35);
    expect(input.commands).not.toHaveBeenCalled();
    expect(renderer.render).toHaveBeenCalled();
  });

  it("can launch from preflight mode into flight", async () => {
    const { renderer, input } = createShellDoubles();
    const onHud = vi.fn();
    let frame: FrameRequestCallback = () => 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frame = callback;
        return 7;
      })
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(performance, "now").mockReturnValue(1000);

    const shell = new GameShell({
      mount: {} as HTMLElement,
      onHud,
      renderer,
      input,
      initialPaused: true
    });

    await shell.start();
    shell.setPaused(false);
    frame(1167);

    expect(onHud.mock.calls.at(-1)?.[0].status).toBe("flying");
    expect(onHud.mock.calls.at(-1)?.[0].elapsedSeconds).toBeGreaterThan(0);
    expect(onHud.mock.calls.at(-1)?.[0].paceSecondsRemaining).toBeLessThan(35);
    expect(input.commands).toHaveBeenCalled();
  });
});

function createShellDoubles(options?: { mount?: AstroPixiRenderer["mount"] }) {
  const renderer: AstroPixiRenderer = {
    mount: vi.fn(options?.mount ?? (() => Promise.resolve())),
    render: vi.fn(),
    destroy: vi.fn()
  };
  const input: InputSource = {
    attach: vi.fn(),
    detach: vi.fn(),
    commands: vi.fn(() => [])
  };

  return { renderer, input };
}
