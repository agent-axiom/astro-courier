import type { EnemyDirectorDirective, EnemyDirectorPolicy, ObjectivePhase, SimulationSnapshot, Vec2 } from "@astro-courier/shared";

export type EnemyDirectorMode = "openai" | "fallback";
export type EnemyDirectorQuality = "standard" | "cinematic";

export type EnemyDirectorResult = {
  mode: EnemyDirectorMode;
  policy: EnemyDirectorPolicy;
  directive: EnemyDirectorDirective;
};

export type EnemyDirectorRequest = {
  quality: EnemyDirectorQuality;
  tick: number;
  objectivePhase: ObjectivePhase;
  ship: {
    hp: number;
    position: Vec2;
    velocity: Vec2;
  };
  enemies: Array<{
    id: string;
    archetype: SimulationSnapshot["enemies"][number]["archetype"];
    hp: number;
    position: Vec2;
    distance: number;
  }>;
};

export type EnemyDirectorClient = {
  requestPolicy(snapshot: SimulationSnapshot): Promise<EnemyDirectorResult | undefined>;
};

type FetchDirector = (url: string, init: RequestInit) => Promise<Response>;

export function createEnemyDirectorClient(
  url: string | undefined,
  fetchImpl?: FetchDirector,
  quality: EnemyDirectorQuality = "standard"
): EnemyDirectorClient | undefined {
  const endpoint = url?.trim();
  if (!endpoint) {
    return undefined;
  }
  const directorFetch = fetchImpl ?? ((target: string, init: RequestInit) => fetch(target, init));

  return {
    async requestPolicy(snapshot) {
      try {
        const response = await directorFetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(buildEnemyDirectorRequest(snapshot, quality))
        });
        if (!response.ok) {
          return undefined;
        }
        const payload = (await response.json()) as Partial<EnemyDirectorResult>;
        if (!isDirectorResult(payload)) {
          return undefined;
        }
        return payload;
      } catch {
        return undefined;
      }
    }
  };
}

export function buildEnemyDirectorRequest(snapshot: SimulationSnapshot, quality: EnemyDirectorQuality = "standard"): EnemyDirectorRequest {
  return {
    quality,
    tick: snapshot.tick,
    objectivePhase: snapshot.objectivePhase,
    ship: {
      hp: snapshot.ship.hp,
      position: { ...snapshot.ship.position },
      velocity: { ...snapshot.ship.velocity }
    },
    enemies: snapshot.enemies.map((enemy) => ({
      id: enemy.id,
      archetype: enemy.archetype,
      hp: enemy.hp,
      position: { ...enemy.position },
      distance: round(distanceBetween(snapshot.ship.position, enemy.position), 3)
    }))
  };
}

function isDirectorResult(value: unknown): value is EnemyDirectorResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as EnemyDirectorResult;
  return (
    (candidate.mode === "openai" || candidate.mode === "fallback") &&
    candidate.policy !== undefined &&
    candidate.directive !== undefined &&
    Number.isFinite(candidate.policy.aggression) &&
    Number.isFinite(candidate.policy.flank) &&
    Number.isFinite(candidate.policy.fireBias) &&
    Number.isFinite(candidate.policy.retreatHp) &&
    (candidate.policy.focus === "cargo" || candidate.policy.focus === "player" || candidate.policy.focus === "objective") &&
    (candidate.directive.formation === "screen" ||
      candidate.directive.formation === "pincer" ||
      candidate.directive.formation === "ambush" ||
      candidate.directive.formation === "retreat") &&
    (candidate.directive.missileDoctrine === "hold" ||
      candidate.directive.missileDoctrine === "single" ||
      candidate.directive.missileDoctrine === "salvo") &&
    Number.isFinite(candidate.directive.pressure)
  );
}

function distanceBetween(left: Vec2, right: Vec2): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
