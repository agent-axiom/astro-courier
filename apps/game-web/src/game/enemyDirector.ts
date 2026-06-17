import type { EnemyDirectorPolicy, ObjectivePhase, SimulationSnapshot, Vec2 } from "@astro-courier/shared";

export type EnemyDirectorMode = "openai" | "fallback";

export type EnemyDirectorResult = {
  mode: EnemyDirectorMode;
  policy: EnemyDirectorPolicy;
};

export type EnemyDirectorRequest = {
  tick: number;
  objectivePhase: ObjectivePhase;
  ship: {
    hp: number;
    position: Vec2;
    velocity: Vec2;
  };
  enemies: Array<{
    id: string;
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
  fetchImpl: FetchDirector = (target, init) => fetch(target, init)
): EnemyDirectorClient | undefined {
  const endpoint = url?.trim();
  if (!endpoint) {
    return undefined;
  }

  return {
    async requestPolicy(snapshot) {
      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(buildEnemyDirectorRequest(snapshot))
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

export function buildEnemyDirectorRequest(snapshot: SimulationSnapshot): EnemyDirectorRequest {
  return {
    tick: snapshot.tick,
    objectivePhase: snapshot.objectivePhase,
    ship: {
      hp: snapshot.ship.hp,
      position: { ...snapshot.ship.position },
      velocity: { ...snapshot.ship.velocity }
    },
    enemies: snapshot.enemies.map((enemy) => ({
      id: enemy.id,
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
    Number.isFinite(candidate.policy.aggression) &&
    Number.isFinite(candidate.policy.flank) &&
    Number.isFinite(candidate.policy.fireBias) &&
    Number.isFinite(candidate.policy.retreatHp) &&
    (candidate.policy.focus === "cargo" || candidate.policy.focus === "player" || candidate.policy.focus === "objective")
  );
}

function distanceBetween(left: Vec2, right: Vec2): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
