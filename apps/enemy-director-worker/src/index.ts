export type EnemyDirectorEnv = {
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  ALLOWED_ORIGIN?: string;
};

export type EnemyDirectorWorker = {
  fetch(request: Request, env: EnemyDirectorEnv): Promise<Response>;
};

export type EnemyDirectorWorkerDeps = {
  fetchOpenAI?: (url: string, init: RequestInit) => Promise<Response>;
};

type EnemyDirectorQuality = "standard" | "cinematic";

type EnemyDirectorRequest = {
  quality: EnemyDirectorQuality;
  tick: number;
  objectivePhase: "pickup" | "delivery" | "complete";
  ship: {
    hp: number;
    position: Vec2;
    velocity: Vec2;
  };
  enemies: Array<{
    id: string;
    archetype?: "drone" | "fighter" | "brute";
    hp: number;
    position: Vec2;
    distance: number;
  }>;
};

type Vec2 = {
  x: number;
  y: number;
};

type EnemyDirectorPolicy = {
  aggression: number;
  flank: number;
  fireBias: number;
  retreatHp: number;
  focus: "cargo" | "player" | "objective";
};

const fallbackPolicy: EnemyDirectorPolicy = {
  aggression: 0.45,
  flank: 0,
  fireBias: 0.4,
  retreatHp: 28,
  focus: "cargo"
};

const defaultModel = "gpt-5.4-mini";

export function createEnemyDirectorWorker(deps: EnemyDirectorWorkerDeps = {}): EnemyDirectorWorker {
  const fetchOpenAI = deps.fetchOpenAI ?? ((url, init) => fetch(url, init));

  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const cors = corsHeaders(request, env);

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }

      if (url.pathname === "/health") {
        return json({ ok: true, service: "enemy-director" }, { status: 200, headers: cors });
      }

      if (url.pathname !== "/enemy-director") {
        return json({ error: "not_found" }, { status: 404, headers: cors });
      }

      if (request.method !== "POST") {
        return json({ error: "method_not_allowed" }, { status: 405, headers: cors });
      }

      const directorRequest = await readDirectorRequest(request);
      if (!directorRequest) {
        return json({ error: "invalid_director_request" }, { status: 400, headers: cors });
      }

      const policy = await requestOpenAIPolicy(fetchOpenAI, env, directorRequest);
      if (!policy) {
        return json({ mode: "fallback", policy: fallbackPolicy }, { status: 200, headers: cors });
      }

      return json({ mode: "openai", policy }, { status: 200, headers: cors });
    }
  };
}

async function readDirectorRequest(request: Request): Promise<EnemyDirectorRequest | undefined> {
  try {
    const body = (await request.json()) as unknown;
    if (!isDirectorRequest(body)) {
      return undefined;
    }
    return {
      ...body,
      quality: body.quality ?? "standard"
    };
  } catch {
    return undefined;
  }
}

function isDirectorRequest(value: unknown): value is EnemyDirectorRequest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as EnemyDirectorRequest;
  return (
    Number.isFinite(candidate.tick) &&
    (candidate.quality === undefined || candidate.quality === "standard" || candidate.quality === "cinematic") &&
    (candidate.objectivePhase === "pickup" || candidate.objectivePhase === "delivery" || candidate.objectivePhase === "complete") &&
    isShip(candidate.ship) &&
    Array.isArray(candidate.enemies) &&
    candidate.enemies.every(isEnemy)
  );
}

function isShip(value: unknown): value is EnemyDirectorRequest["ship"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as EnemyDirectorRequest["ship"];
  return Number.isFinite(candidate.hp) && isVec2(candidate.position) && isVec2(candidate.velocity);
}

function isEnemy(value: unknown): value is EnemyDirectorRequest["enemies"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as EnemyDirectorRequest["enemies"][number];
  return (
    typeof candidate.id === "string" &&
    (candidate.archetype === undefined ||
      candidate.archetype === "drone" ||
      candidate.archetype === "fighter" ||
      candidate.archetype === "brute") &&
    Number.isFinite(candidate.hp) &&
    Number.isFinite(candidate.distance) &&
    isVec2(candidate.position)
  );
}

function isVec2(value: unknown): value is Vec2 {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Vec2;
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y);
}

async function requestOpenAIPolicy(
  fetchOpenAI: (url: string, init: RequestInit) => Promise<Response>,
  env: EnemyDirectorEnv,
  directorRequest: EnemyDirectorRequest
): Promise<EnemyDirectorPolicy | undefined> {
  if (!env.OPENAI_API_KEY) {
    return undefined;
  }

  const response = await fetchOpenAI("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildOpenAIRequest(env.OPENAI_MODEL ?? defaultModel, directorRequest))
  });

  if (!response.ok) {
    return undefined;
  }

  try {
    const payload = (await response.json()) as unknown;
    const outputText = extractOutputText(payload);
    if (!outputText) {
      return undefined;
    }
    return clampPolicy(JSON.parse(outputText) as Partial<EnemyDirectorPolicy>);
  } catch {
    return undefined;
  }
}

function buildOpenAIRequest(model: string, directorRequest: EnemyDirectorRequest) {
  const quality = directorRequest.quality;
  const enemyLimit = quality === "cinematic" ? 8 : 4;
  const maxOutputTokens = quality === "cinematic" ? 220 : 120;
  return {
    model,
    max_output_tokens: maxOutputTokens,
    input: [
      {
        role: "system",
        content:
          quality === "cinematic"
            ? "You are the Astro Courier enemy director. Return only compact JSON. Coordinate varied enemy archetypes for cinematic pressure, readable flanks, and fair recoveries."
            : "You are the Astro Courier enemy director. Return only compact JSON. Tune enemies for fun pressure, not unfair hits."
      },
      {
        role: "user",
        content: JSON.stringify({
          quality,
          tick: directorRequest.tick,
          phase: directorRequest.objectivePhase,
          ship: directorRequest.ship,
          enemies: directorRequest.enemies.slice(0, enemyLimit)
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "enemy_director_policy",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["aggression", "flank", "fireBias", "retreatHp", "focus"],
          properties: {
            aggression: { type: "number", minimum: 0, maximum: 1 },
            flank: { type: "number", minimum: -1, maximum: 1 },
            fireBias: { type: "number", minimum: 0, maximum: 1 },
            retreatHp: { type: "number", minimum: 0, maximum: 78 },
            focus: { type: "string", enum: ["cargo", "player", "objective"] }
          }
        }
      }
    }
  };
}

function extractOutputText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const response = payload as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        text?: unknown;
      }>;
    }>;
  };
  if (typeof response.output_text === "string") {
    return response.output_text;
  }
  const text = response.output?.flatMap((entry) => entry.content ?? []).find((content) => typeof content.text === "string")?.text;
  return typeof text === "string" ? text : undefined;
}

function clampPolicy(policy: Partial<EnemyDirectorPolicy>): EnemyDirectorPolicy {
  return {
    aggression: clampNumber(policy.aggression, 0, 1, fallbackPolicy.aggression),
    flank: clampNumber(policy.flank, -1, 1, fallbackPolicy.flank),
    fireBias: clampNumber(policy.fireBias, 0, 1, fallbackPolicy.fireBias),
    retreatHp: clampNumber(policy.retreatHp, 0, 78, fallbackPolicy.retreatHp),
    focus: policy.focus === "player" || policy.focus === "objective" || policy.focus === "cargo" ? policy.focus : fallbackPolicy.focus
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Number(value))) : fallback;
}

function corsHeaders(request: Request, env: EnemyDirectorEnv): Headers {
  const headers = new Headers();
  const requestOrigin = request.headers.get("Origin");
  const allowedOrigin = env.ALLOWED_ORIGIN ?? "*";
  headers.set("Access-Control-Allow-Origin", requestOrigin && allowedOrigin !== "*" ? allowedOrigin : allowedOrigin);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Vary", "Origin");
  return headers;
}

function json(value: unknown, init: { status: number; headers: Headers }): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), {
    status: init.status,
    headers
  });
}

export default createEnemyDirectorWorker();
