import { describe, expect, it, vi } from "vitest";
import { GameShell } from "./GameShell";
import type { AstroPixiRenderer } from "@astro-courier/renderer-pixi";
import type { SimulationWorld } from "@astro-courier/simulation";
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
    expect(onHud.mock.calls[0]?.[0].targetAllowedSpeed).toBe(42);
    expect(onHud.mock.calls[0]?.[0].perfectDockReady).toBe(false);
    expect(onHud.mock.calls[0]?.[0].quickPickupSecondsRemaining).toBe(12);
    expect(onHud.mock.calls[0]?.[0].quickPickupBonus).toBe(180);
    expect(onHud.mock.calls[0]?.[0].fuelUsed).toBe(0);
    expect(onHud.mock.calls[0]?.[0].hazardSeverity).toBe(0.2);
    expect(input.commands).not.toHaveBeenCalled();
    expect(renderer.render).toHaveBeenCalled();
  });

  it("reuses contract option references between HUD publishes", async () => {
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
    const firstOptions = onHud.mock.calls[0]?.[0].contractOptions;
    frame(1167);

    expect(onHud.mock.calls.at(-1)?.[0].contractOptions).toBe(firstOptions);
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
    expect(onHud.mock.calls.at(-1)?.[0].quickPickupSecondsRemaining).toBeLessThan(12);
    expect(input.commands).toHaveBeenCalled();
  });

  it("can switch contracts while waiting in preflight mode", async () => {
    const { renderer, input } = createShellDoubles();
    const onHud = vi.fn();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 7));
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
    (shell as GameShell & { selectContract: (contractId: string) => void }).selectContract("return-leg");

    expect(onHud.mock.calls.at(-1)?.[0]).toMatchObject({
      status: "paused",
      contractId: "return-leg",
      contractTitle: "Return Leg",
      pickupLabel: "Tea Station Dock A",
      destinationLabel: "Luma North Pad",
      cargoName: "Bottled Starlight",
      targetDistance: 60,
      paceSecondsRemaining: 30
    });
    expect(onHud.mock.calls.at(-1)?.[0].contractOptions).toEqual([
      {
        id: "first-light-delivery",
        title: "First Light Delivery",
        briefing: "Run the standard Luma courier line. Load cleanly, protect the bottle, and dock with fuel to spare.",
        riskLabel: "Training Route",
        rewardLabel: "Clean delivery bonuses",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A",
        cargoName: "Bottled Starlight",
        cargoKind: "fragile",
        cargoFragility: 0.8,
        medalTimes: { bronze: 90, silver: 55, gold: 35 }
      },
      {
        id: "return-leg",
        title: "Return Leg",
        briefing: "Reverse the route under tighter timing. The station handoff is easy; the planet-side return is the test.",
        riskLabel: "Tight Timer",
        rewardLabel: "Gold pace pressure",
        pickupLabel: "Tea Station Dock A",
        destinationLabel: "Luma North Pad",
        cargoName: "Bottled Starlight",
        cargoKind: "fragile",
        cargoFragility: 0.8,
        medalTimes: { bronze: 80, silver: 48, gold: 30 }
      },
      {
        id: "asteroid-sprint",
        title: "Asteroid Sprint",
        briefing: "Thread the asteroid field with volatile comet ice, load fast, and bring the cargo home before the sprint window closes.",
        riskLabel: "Asteroid Field",
        rewardLabel: "Skim style bonuses",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A",
        cargoName: "Volatile Comet Ice",
        cargoKind: "unstable",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.45,
        medalTimes: { bronze: 70, silver: 42, gold: 24 }
      },
      {
        id: "gravity-slingshot",
        title: "Gravity Slingshot",
        briefing: "Enter above Luma with lateral speed, catch the north pad, then ride the gravity arc out to Tea Station.",
        riskLabel: "Gravity Entry",
        rewardLabel: "Gravity sling bonuses",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A",
        cargoName: "Bottled Starlight",
        cargoKind: "fragile",
        cargoFragility: 0.8,
        hazardSeverityMultiplier: 1.2,
        medalTimes: { bronze: 76, silver: 44, gold: 26 }
      },
      {
        id: "chain-relay",
        title: "Chain Relay",
        briefing: "Launch fast, skim the asteroid field, and carry the style chain all the way into Tea Station.",
        riskLabel: "Chain Timer",
        rewardLabel: "Chain finish bonuses",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A",
        cargoName: "Volatile Comet Ice",
        cargoKind: "unstable",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.3,
        medalTimes: { bronze: 64, silver: 38, gold: 22 }
      },
      {
        id: "last-drop-run",
        title: "Last Drop Run",
        briefing: "Carry midnight medicine on a lean tank. Load cleanly, coast hard, and dock with just enough fuel to make the dispatcher smile.",
        riskLabel: "Low Fuel",
        rewardLabel: "Last Drop bonuses",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A",
        cargoName: "Midnight Medicine",
        cargoKind: "time-sensitive",
        cargoFragility: 0.9,
        medalTimes: { bronze: 72, silver: 44, gold: 27 }
      }
    ]);
  });

  it("can switch contracts with a daily replay seed while waiting in preflight mode", async () => {
    const { renderer, input } = createShellDoubles();
    const onHud = vi.fn();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 7));
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
    shell.selectContract("asteroid-sprint", { replaySeed: "daily-2026-06-13-asteroid-sprint" });

    expect(onHud.mock.calls.at(-1)?.[0]).toMatchObject({
      status: "paused",
      contractId: "asteroid-sprint",
      replaySeed: "daily-2026-06-13-asteroid-sprint"
    });
    expect((shell as unknown as { world: SimulationWorld }).world.seed).toBe("daily-2026-06-13-asteroid-sprint");
  });

  it("can retarget the current paused contract to a daily replay seed", async () => {
    const { renderer, input } = createShellDoubles();
    const onHud = vi.fn();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 7));
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
    shell.setReplaySeed("daily-2026-06-13-first-light-delivery");

    expect(onHud.mock.calls.at(-1)?.[0]).toMatchObject({
      status: "paused",
      contractId: "first-light-delivery",
      replaySeed: "daily-2026-06-13-first-light-delivery"
    });
    expect((shell as unknown as { world: SimulationWorld }).world.seed).toBe("daily-2026-06-13-first-light-delivery");
  });

  it("publishes the gravity slingshot contract start profile", async () => {
    const { renderer, input } = createShellDoubles();
    const onHud = vi.fn();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 7));
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
    (shell as GameShell & { selectContract: (contractId: string) => void }).selectContract("gravity-slingshot");

    expect(onHud.mock.calls.at(-1)?.[0]).toMatchObject({
      status: "paused",
      contractId: "gravity-slingshot",
      contractTitle: "Gravity Slingshot",
      contractRiskLabel: "Gravity Entry",
      contractRewardLabel: "Gravity sling bonuses",
      paceSecondsRemaining: 26,
      hazardSeverityMultiplier: 1.2
    });
    expect(onHud.mock.calls.at(-1)?.[0].speed).toBeCloseTo(63.15, 2);
    expect(onHud.mock.calls.at(-1)?.[0].targetDistance).toBeCloseTo(196.82, 2);
  });

  it("publishes gravity sling opportunity telemetry inside the gravity pocket", async () => {
    const { renderer, input } = createShellDoubles();
    const onHud = vi.fn();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 7));
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
    (shell as GameShell & { selectContract: (contractId: string) => void }).selectContract("gravity-slingshot");
    const world = (shell as unknown as { world: SimulationWorld }).world;
    world.ship.position = { x: 0, y: -160 };
    world.ship.velocity = { x: 48, y: 0 };
    (shell as unknown as { publishHud: () => void }).publishHud();

    expect(onHud.mock.calls.at(-1)?.[0]).toMatchObject({
      gravitySlingDistance: 160,
      gravitySlingReady: false,
      gravitySlingSpeedThreshold: 54,
      gravitySlingStyleBonus: 240
    });
  });

  it("publishes predicted hazard trajectory risk before current proximity", async () => {
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
      input
    });

    await shell.start();
    const world = (shell as unknown as { world: SimulationWorld }).world;
    world.ship.position = { x: 230, y: -230 };
    world.ship.velocity = { x: 0, y: 58 };
    world.ship.rotation = Math.PI / 2;
    world.ship.targetRotation = Math.PI / 2;

    frame(1167);

    expect(onHud.mock.calls.at(-1)?.[0].hazardDangerLevel).toBeUndefined();
    expect(onHud.mock.calls.at(-1)?.[0].trajectoryRiskLevel).toBe("inside");
    expect(onHud.mock.calls.at(-1)?.[0].trajectoryRiskSeconds).toBeGreaterThan(0);
  });

  it("publishes contract-specific briefing copy for preflight selection", async () => {
    const { renderer, input } = createShellDoubles();
    const onHud = vi.fn();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 7));
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
    (shell as GameShell & { selectContract: (contractId: string) => void }).selectContract("asteroid-sprint");

    expect(onHud.mock.calls.at(-1)?.[0]).toMatchObject({
      contractId: "asteroid-sprint",
      contractTitle: "Asteroid Sprint",
      contractBriefing: "Thread the asteroid field with volatile comet ice, load fast, and bring the cargo home before the sprint window closes.",
      cargoName: "Volatile Comet Ice",
      cargoKind: "unstable",
      cargoFragility: 1,
      hazardSeverityMultiplier: 1.45
    });
    expect(onHud.mock.calls.at(-1)?.[0].contractOptions).toContainEqual(
      expect.objectContaining({
        id: "asteroid-sprint",
        briefing: "Thread the asteroid field with volatile comet ice, load fast, and bring the cargo home before the sprint window closes.",
        cargoKind: "unstable",
        cargoFragility: 1,
        hazardSeverityMultiplier: 1.45
      })
    );
  });

  it("publishes contract risk and reward labels for preflight selection", async () => {
    const { renderer, input } = createShellDoubles();
    const onHud = vi.fn();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 7));
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
    (shell as GameShell & { selectContract: (contractId: string) => void }).selectContract("asteroid-sprint");

    expect(onHud.mock.calls.at(-1)?.[0]).toMatchObject({
      contractId: "asteroid-sprint",
      contractRiskLabel: "Asteroid Field",
      contractRewardLabel: "Skim style bonuses"
    });
    expect(onHud.mock.calls.at(-1)?.[0].contractOptions).toContainEqual(
      expect.objectContaining({
        id: "asteroid-sprint",
        riskLabel: "Asteroid Field",
        rewardLabel: "Skim style bonuses"
      })
    );
  });

  it("keeps transient simulation milestones visible for the HUD publish frame", async () => {
    let commandCalls = 0;
    const { renderer, input } = createShellDoubles({
      commands: () => {
        commandCalls += 1;
        return commandCalls === 1 ? [{ type: "BOOST" }] : [];
      }
    });
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
      input
    });

    await shell.start();
    frame(1167);

    expect(onHud.mock.calls.at(-1)?.[0].lastMilestone).toBe("Boost Burn");
    expect(onHud.mock.calls.at(-1)?.[0].boostCooldownSeconds).toBeGreaterThan(0);
  });

  it("keeps transient style awards visible with the milestone", async () => {
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
      input
    });

    await shell.start();
    const world = (shell as unknown as { world: SimulationWorld }).world;
    world.ship.position = { x: 0, y: -74 };
    world.ship.velocity = { x: 1, y: 3 };
    world.ship.rotation = -Math.PI / 2;
    world.ship.targetRotation = -Math.PI / 2;
    (shell as unknown as { hudTimer: number }).hudTimer = 0.1;

    frame(1017);

    expect(onHud.mock.calls.at(-1)?.[0].lastMilestone).toBe("Quick Pickup");
    expect(onHud.mock.calls.at(-1)?.[0].lastStyleAward).toBe(180);
  });

  it("publishes manual brake usage for live finesse guidance", async () => {
    const { renderer, input } = createShellDoubles({
      commands: () => [{ type: "BRAKE", amount: 0.4 }]
    });
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
      input
    });

    await shell.start();
    frame(1167);

    expect(onHud.mock.calls.at(-1)?.[0].manualBrakeUsed).toBe(true);
  });

  it("executes queued commands once on the next simulation frame", async () => {
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
      input
    });

    await shell.start();
    shell.queueCommand({ type: "BOOST" });
    frame(1167);
    const fuelAfterBoost = onHud.mock.calls.at(-1)?.[0].fuel;
    frame(1267);
    const fuelAfterNextFrame = onHud.mock.calls.at(-1)?.[0].fuel;

    expect(onHud.mock.calls.at(-2)?.[0].lastMilestone).toBe("Boost Burn");
    expect(fuelAfterBoost).toBeLessThan(100);
    expect(onHud.mock.calls.at(-2)?.[0].fuelUsed).toBeGreaterThan(0);
    expect(fuelAfterNextFrame).toBe(fuelAfterBoost);
  });

  it("publishes the live replay command count during flight", async () => {
    let commandCalls = 0;
    const { renderer, input } = createShellDoubles({
      commands: () => {
        commandCalls += 1;
        return commandCalls === 1 ? [{ type: "THRUST", amount: 1 }] : [];
      }
    });
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
      input
    });

    await shell.start();
    frame(1167);

    expect(onHud.mock.calls.at(-1)?.[0].replayFrameCount).toBe(1);
  });

  it("passes a saved personal-best ghost trail to the renderer", async () => {
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
    const ghostTrail = [
      { x: 180, y: 20 },
      { x: 240, y: -20 },
      { x: 420, y: -140 }
    ];

    const shell = new GameShell({
      mount: {} as HTMLElement,
      onHud,
      renderer,
      input,
      initialPaused: true
    });

    await shell.start();
    (shell as unknown as { setGhostTrail: (trail: typeof ghostTrail) => void }).setGhostTrail(ghostTrail);
    frame(1017);

    expect(renderer.render).toHaveBeenCalled();
    expect((renderer.render as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[2]).toEqual(ghostTrail);
  });

  it("publishes a sampled live route trail in the HUD", async () => {
    const { renderer, input } = createShellDoubles({
      commands: () => [{ type: "THRUST", amount: 1 }]
    });
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
      input
    });

    await shell.start();
    frame(1367);

    const trail = onHud.mock.calls.at(-1)?.[0].runTrail;
    expect(trail?.length).toBeGreaterThan(1);
    expect(trail?.[0]).toEqual({ x: 180, y: 20 });
    expect(trail?.at(-1)?.x).not.toBe(180);
  });

  it("publishes a deterministic replay fingerprint for terminal runs", async () => {
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
      input
    });

    await shell.start();
    shell.queueCommand({ type: "BOOST" });
    frame(1167);
    const world = (shell as unknown as { world: SimulationWorld }).world;
    world.status = "delivered";
    world.objectivePhase = "complete";
    (shell as unknown as { publishHud: () => void }).publishHud();

    expect(onHud.mock.calls.at(-1)?.[0].replayChecksum).toMatch(/^rc-[a-f0-9]{12}$/);
  });
});

function createShellDoubles(options?: { mount?: AstroPixiRenderer["mount"]; commands?: InputSource["commands"] }) {
  const renderer: AstroPixiRenderer = {
    mount: vi.fn(options?.mount ?? (() => Promise.resolve())),
    render: vi.fn(),
    destroy: vi.fn()
  };
  const input: InputSource = {
    attach: vi.fn(),
    detach: vi.fn(),
    commands: vi.fn(options?.commands ?? (() => []))
  };

  return { renderer, input };
}
