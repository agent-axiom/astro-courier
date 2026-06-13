import type { LandingGuidanceStatus, SimulationSnapshot, Vec2 } from "@astro-courier/shared";
import { Application, Container, Graphics } from "pixi.js";

export type AstroPixiRenderer = {
  mount(element: HTMLElement): Promise<void>;
  render(snapshot: SimulationSnapshot, trajectory: Vec2[]): void;
  destroy(): void;
};

type Star = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
};

export function createAstroPixiRenderer(): AstroPixiRenderer {
  return new PixiRenderer();
}

class PixiRenderer implements AstroPixiRenderer {
  private app?: Application;
  private mountElement?: HTMLElement;
  private readonly stageRoot = new Container();
  private readonly background = new Graphics();
  private readonly gravity = new Graphics();
  private readonly trajectory = new Graphics();
  private readonly guidance = new Graphics();
  private readonly world = new Graphics();
  private readonly hazards = new Graphics();
  private readonly ship = new Graphics();
  private readonly screenFx = new Graphics();
  private readonly stars: Star[] = createStars(140);
  private destroyed = false;

  async mount(element: HTMLElement): Promise<void> {
    this.mountElement = element;
    const app = new Application();
    await app.init({
      resizeTo: element,
      antialias: true,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    if (this.destroyed) {
      app.destroy();
      return;
    }

    this.app = app;
    element.replaceChildren(app.canvas);
    app.stage.addChild(this.stageRoot);
    this.stageRoot.addChild(
      this.background,
      this.gravity,
      this.trajectory,
      this.guidance,
      this.world,
      this.hazards,
      this.ship,
      this.screenFx
    );
  }

  render(snapshot: SimulationSnapshot, trajectory: Vec2[]): void {
    if (!this.app) return;

    const viewport = {
      width: this.app.renderer.width,
      height: this.app.renderer.height
    };
    const camera = snapshot.ship.position;
    const project = (point: Vec2): Vec2 => ({
      x: point.x - camera.x + viewport.width / 2,
      y: point.y - camera.y + viewport.height / 2
    });

    this.drawBackground(viewport, snapshot.tick);
    this.drawGravity(snapshot, project);
    this.drawTrajectory(trajectory, project, snapshot.status);
    this.drawGuidance(snapshot, project, viewport);
    this.drawWorld(snapshot, project);
    this.drawHazards(snapshot, project);
    this.drawShip(snapshot, project);
    this.drawScreenFx(snapshot, viewport);
  }

  destroy(): void {
    this.destroyed = true;
    this.app?.destroy();
    this.mountElement?.replaceChildren();
    this.app = undefined;
  }

  private drawBackground(viewport: { width: number; height: number }, tick: number): void {
    this.background.clear();
    this.background.rect(0, 0, viewport.width, viewport.height).fill(0x080a18);

    for (const star of this.stars) {
      const drift = tick * 0.018 * star.radius;
      const x = positiveModulo(star.x * viewport.width - drift, viewport.width);
      const y = positiveModulo(star.y * viewport.height + drift * 0.18, viewport.height);
      this.background.circle(x, y, star.radius).fill({ color: 0xffffff, alpha: star.alpha });
    }
  }

  private drawGravity(snapshot: SimulationSnapshot, project: (point: Vec2) => Vec2): void {
    this.gravity.clear();
    for (const source of snapshot.gravitySources) {
      const center = project(source.position);
      this.gravity
        .circle(center.x, center.y, source.influenceRadius)
        .stroke({ color: 0x6fb4ff, width: 1, alpha: 0.08 });
      this.gravity.circle(center.x, center.y, source.radius + 18).stroke({ color: 0x9ce8ff, width: 1, alpha: 0.2 });
    }
  }

  private drawTrajectory(trajectory: Vec2[], project: (point: Vec2) => Vec2, status: string): void {
    this.trajectory.clear();
    if (status !== "flying") return;

    for (let index = 0; index < trajectory.length; index += 1) {
      const point = project(trajectory[index]);
      const alpha = 0.18 + (index / Math.max(1, trajectory.length - 1)) * 0.48;
      this.trajectory.circle(point.x, point.y, 2.4).fill({ color: 0xf8e59a, alpha });
    }
  }

  private drawGuidance(
    snapshot: SimulationSnapshot,
    project: (point: Vec2) => Vec2,
    viewport: { width: number; height: number }
  ): void {
    this.guidance.clear();
    const target = snapshot.objectiveTarget;
    if (!target || snapshot.status !== "flying") return;

    const ship = project(snapshot.ship.position);
    const targetPoint = project(target.position);
    const color = guidanceColor(target.landingStatus, target.assistAvailable);
    const targetOnScreen =
      targetPoint.x >= 0 && targetPoint.x <= viewport.width && targetPoint.y >= 0 && targetPoint.y <= viewport.height;

    this.guidance.moveTo(ship.x, ship.y).lineTo(targetPoint.x, targetPoint.y).stroke({ color, width: 2, alpha: 0.22 });

    if (targetOnScreen) {
      this.guidance.circle(targetPoint.x, targetPoint.y, 34).stroke({ color, width: 2, alpha: 0.65 });
      this.guidance.circle(targetPoint.x, targetPoint.y, 5).fill({ color, alpha: 0.9 });
      return;
    }

    const clamped = clampToViewport(targetPoint, viewport, 28);
    const angle = Math.atan2(targetPoint.y - ship.y, targetPoint.x - ship.x);
    const nose = {
      x: clamped.x + Math.cos(angle) * 14,
      y: clamped.y + Math.sin(angle) * 14
    };
    const left = {
      x: clamped.x + Math.cos(angle + 2.5) * 10,
      y: clamped.y + Math.sin(angle + 2.5) * 10
    };
    const right = {
      x: clamped.x + Math.cos(angle - 2.5) * 10,
      y: clamped.y + Math.sin(angle - 2.5) * 10
    };
    this.guidance.moveTo(nose.x, nose.y).lineTo(left.x, left.y).lineTo(right.x, right.y).closePath().fill({
      color,
      alpha: 0.88
    });
  }

  private drawWorld(snapshot: SimulationSnapshot, project: (point: Vec2) => Vec2): void {
    this.world.clear();

    for (const source of snapshot.gravitySources) {
      const center = project(source.position);
      this.world.circle(center.x, center.y, source.radius + 8).fill({ color: 0x254a86, alpha: 0.45 });
      this.world.circle(center.x, center.y, source.radius).fill(0x66c8ff);
      this.world.circle(center.x - source.radius * 0.25, center.y - source.radius * 0.3, source.radius * 0.28).fill({
        color: 0xd7fbff,
        alpha: 0.35
      });
    }

    for (const pad of snapshot.landingPads) {
      const center = project(pad.position);
      const color = pad.role === "destination" ? 0xffd166 : pad.role === "pickup" ? 0x8ee6b8 : 0xa0c4ff;
      const width = pad.active ? 4 : 2;
      const alpha = pad.active ? 1 : 0.45;
      if (pad.active) {
        this.world.circle(center.x, center.y, pad.radius + 9).fill({ color, alpha: 0.12 });
      }
      this.world.circle(center.x, center.y, pad.radius).stroke({ color, width, alpha });
      this.world
        .moveTo(center.x, center.y)
        .lineTo(center.x + Math.cos(pad.normalAngle) * pad.radius, center.y + Math.sin(pad.normalAngle) * pad.radius)
        .stroke({ color, width: 2, alpha });
    }
  }

  private drawHazards(snapshot: SimulationSnapshot, project: (point: Vec2) => Vec2): void {
    this.hazards.clear();
    for (const hazard of snapshot.hazards) {
      const center = project(hazard.position);
      this.hazards.circle(center.x, center.y, hazard.radius).fill({ color: 0xff5c7a, alpha: 0.08 + hazard.severity * 0.12 });
      this.hazards.circle(center.x, center.y, hazard.radius).stroke({ color: 0xff7a90, width: 1, alpha: 0.4 });
      for (let index = 0; index < 8; index += 1) {
        const angle = (index / 8) * Math.PI * 2;
        const rock = {
          x: center.x + Math.cos(angle) * hazard.radius * 0.62,
          y: center.y + Math.sin(angle) * hazard.radius * 0.36
        };
        this.hazards.circle(rock.x, rock.y, 3 + (index % 3)).fill({ color: 0xb56576, alpha: 0.8 });
      }
    }
  }

  private drawShip(snapshot: SimulationSnapshot, project: (point: Vec2) => Vec2): void {
    this.ship.clear();
    const center = project(snapshot.ship.position);
    const angle = snapshot.ship.rotation;
    const nose = {
      x: center.x + Math.cos(angle) * 16,
      y: center.y + Math.sin(angle) * 16
    };
    const left = {
      x: center.x + Math.cos(angle + 2.45) * 12,
      y: center.y + Math.sin(angle + 2.45) * 12
    };
    const right = {
      x: center.x + Math.cos(angle - 2.45) * 12,
      y: center.y + Math.sin(angle - 2.45) * 12
    };
    const flame = {
      x: center.x - Math.cos(angle) * 18,
      y: center.y - Math.sin(angle) * 18
    };
    const speed = Math.hypot(snapshot.ship.velocity.x, snapshot.ship.velocity.y);

    this.ship.moveTo(nose.x, nose.y).lineTo(left.x, left.y).lineTo(right.x, right.y).closePath().fill(0xfff7d6);
    this.ship.moveTo(nose.x, nose.y).lineTo(left.x, left.y).lineTo(right.x, right.y).closePath().stroke({
      color: 0x2e2d4d,
      width: 2,
      alpha: 1
    });

    if (speed > 8 && snapshot.status === "flying") {
      this.ship.circle(flame.x, flame.y, Math.min(12, 4 + speed * 0.08)).fill({ color: 0xff9f1c, alpha: 0.55 });
    }
  }

  private drawScreenFx(snapshot: SimulationSnapshot, viewport: { width: number; height: number }): void {
    this.screenFx.clear();
    const fuelRatio = snapshot.ship.fuel / snapshot.ship.maxFuel;
    if (fuelRatio < 0.25 && snapshot.status === "flying") {
      this.screenFx.rect(0, 0, viewport.width, viewport.height).stroke({
        color: 0xff4d6d,
        width: 8,
        alpha: 0.18 + (0.25 - fuelRatio) * 0.7
      });
    }
  }
}

function createStars(count: number): Star[] {
  let seed = 42;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  return Array.from({ length: count }, () => ({
    x: next(),
    y: next(),
    radius: 0.6 + next() * 1.8,
    alpha: 0.25 + next() * 0.65
  }));
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function guidanceColor(status: LandingGuidanceStatus, assistAvailable: boolean): number {
  if (assistAvailable) return 0x7ce1ff;
  if (status === "ready") return 0x8ee6b8;
  if (status === "too-fast") return 0xff6f91;
  if (status === "misaligned") return 0xffd166;
  return 0xa0c4ff;
}

function clampToViewport(point: Vec2, viewport: { width: number; height: number }, inset: number): Vec2 {
  return {
    x: Math.min(viewport.width - inset, Math.max(inset, point.x)),
    y: Math.min(viewport.height - inset, Math.max(inset, point.y))
  };
}
