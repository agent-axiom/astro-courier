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
        const result = normalizeDirectorResult(payload);
        if (!result) {
          return undefined;
        }
        return result;
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

function normalizeDirectorResult(value: unknown): EnemyDirectorResult | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const candidate = value as EnemyDirectorResult;
  if (
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
    (candidate.directive.tempo === undefined ||
      candidate.directive.tempo === "calm" ||
      candidate.directive.tempo === "push" ||
      candidate.directive.tempo === "spike") &&
    Number.isFinite(candidate.directive.pressure)
  ) {
    return {
      ...candidate,
      directive: {
        ...candidate.directive,
        tempo: candidate.directive.tempo ?? "calm",
        modifier: normalizeModifier(candidate.directive.modifier),
        scene: normalizeScene(candidate.directive.scene),
        personality: normalizePersonality(candidate.directive.personality),
        runBeat: normalizeRunBeat(candidate.directive.runBeat)
      }
    };
  }
  return undefined;
}

function normalizeModifier(value: unknown): EnemyDirectorDirective["modifier"] {
  return value === "ambush" || value === "lowFuel" || value === "heavyEscort" || value === "meteorBurst" || value === "quietLane" ? value : "none";
}

function normalizeScene(value: unknown): EnemyDirectorDirective["scene"] {
  return value === "ambush" || value === "pursuit" || value === "siege" || value === "recovery" || value === "none" ? value : "none";
}

function normalizePersonality(value: unknown): EnemyDirectorDirective["personality"] {
  return value === "aggressive" || value === "cautious" || value === "swarm" || value === "sniper" || value === "balanced"
    ? value
    : "balanced";
}

function normalizeRunBeat(value: unknown): EnemyDirectorDirective["runBeat"] {
  return value === "bonusWindow" || value === "reinforcement" || value === "recovery" || value === "shortcut" || value === "none" ? value : "none";
}

function distanceBetween(left: Vec2, right: Vec2): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
