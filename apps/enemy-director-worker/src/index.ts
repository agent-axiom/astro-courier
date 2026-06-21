export type EnemyDirectorEnv = {
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  ALLOWED_ORIGIN?: string;
  PROFILE_TOKEN_SECRET?: string;
  PROFILE_DB?: D1DatabaseBinding;
};

export type EnemyDirectorWorker = {
  fetch(request: Request, env: EnemyDirectorEnv): Promise<Response>;
};

export type EnemyDirectorWorkerDeps = {
  fetchOpenAI?: (url: string, init: RequestInit) => Promise<Response>;
};

type D1DatabaseBinding = {
  prepare(query: string): D1PreparedStatementBinding;
};

type D1PreparedStatementBinding = {
  bind(...values: unknown[]): D1PreparedStatementBinding;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ success?: boolean }>;
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
    archetype?: "drone" | "fighter" | "brute" | "sentinel" | "guardian" | "missileBoat";
    hp: number;
    position: Vec2;
    distance: number;
  }>;
};

type Vec2 = {
  x: number;
  y: number;
};

type ProfileSessionPayload = {
  sub: string;
  provider: "guest";
  displayName: string;
  cloudCode?: string;
  issuedAt: number;
};

type ProfileProgressSnapshot = {
  schemaVersion: 1;
  bestRunsByContract: Record<string, unknown>;
  unlockedContracts: string[];
  shipUpgrades: string[];
  updatedAt: string;
};

type EnemyDirectorPolicy = {
  aggression: number;
  flank: number;
  fireBias: number;
  retreatHp: number;
  focus: "cargo" | "player" | "objective";
};

type EnemyDirectorDirective = {
  formation: "screen" | "pincer" | "ambush" | "retreat";
  missileDoctrine: "hold" | "single" | "salvo";
  tempo: "calm" | "push" | "spike";
  pressure: number;
  hint?: string;
};

type EnemyDirectorBrain = {
  policy: EnemyDirectorPolicy;
  directive: EnemyDirectorDirective;
};

const fallbackPolicy: EnemyDirectorPolicy = {
  aggression: 0.45,
  flank: 0,
  fireBias: 0.4,
  retreatHp: 28,
  focus: "cargo"
};

const fallbackDirective: EnemyDirectorDirective = {
  formation: "screen",
  missileDoctrine: "hold",
  tempo: "calm",
  pressure: 0.4,
  hint: "screen"
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

      if (url.pathname === "/profile/session") {
        return handleProfileSession(request, env, cors);
      }

      if (url.pathname === "/profile/restore") {
        return handleProfileRestore(request, env, cors);
      }

      if (url.pathname === "/profile/progress") {
        return handleProfileProgress(request, env, cors);
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

      const brain = await requestOpenAIPolicy(fetchOpenAI, env, directorRequest);
      if (!brain) {
        return json({ mode: "fallback", policy: fallbackPolicy, directive: fallbackDirective }, { status: 200, headers: cors });
      }

      return json({ mode: "openai", policy: brain.policy, directive: brain.directive }, { status: 200, headers: cors });
    }
  };
}

async function handleProfileSession(request: Request, env: EnemyDirectorEnv, cors: Headers): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, { status: 405, headers: cors });
  }
  if (!env.PROFILE_TOKEN_SECRET) {
    return json({ error: "profile_auth_unavailable" }, { status: 503, headers: cors });
  }
  if (!env.PROFILE_DB) {
    return json({ error: "cloud_save_unavailable" }, { status: 503, headers: cors });
  }

  const body = await readJsonObject(request);
  const displayName = sanitizeDisplayName(typeof body?.displayName === "string" ? body.displayName : "Courier");
  const cloudCode = await createCloudProfile(env.PROFILE_DB, displayName);
  const payload: ProfileSessionPayload = {
    sub: cloudCode.playerId,
    provider: "guest",
    displayName,
    cloudCode: cloudCode.code,
    issuedAt: Date.now()
  };
  const token = await signProfileToken(payload, env.PROFILE_TOKEN_SECRET);

  return json(
    {
      token,
      cloudCode: payload.cloudCode,
      player: {
        id: payload.sub,
        displayName: payload.displayName,
        provider: payload.provider
      }
    },
    { status: 200, headers: cors }
  );
}

async function handleProfileRestore(request: Request, env: EnemyDirectorEnv, cors: Headers): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, { status: 405, headers: cors });
  }
  if (!env.PROFILE_TOKEN_SECRET) {
    return json({ error: "profile_auth_unavailable" }, { status: 503, headers: cors });
  }
  if (!env.PROFILE_DB) {
    return json({ error: "cloud_save_unavailable" }, { status: 503, headers: cors });
  }

  const body = await readJsonObject(request);
  const cloudCode = normalizeCloudCode(typeof body?.cloudCode === "string" ? body.cloudCode : "");
  if (!cloudCode) {
    return json({ error: "invalid_cloud_code" }, { status: 400, headers: cors });
  }

  const row = await env.PROFILE_DB.prepare(
    "SELECT player_id, cloud_code, display_name, progress_json FROM player_progress WHERE cloud_code = ?"
  )
    .bind(cloudCode)
    .first<{
      player_id: string;
      cloud_code: string;
      display_name: string | null;
      progress_json: string;
    }>();

  if (!row) {
    return json({ error: "cloud_code_not_found" }, { status: 404, headers: cors });
  }

  const displayName = sanitizeDisplayName(row.display_name ?? "Courier");
  const payload: ProfileSessionPayload = {
    sub: row.player_id,
    provider: "guest",
    displayName,
    cloudCode: row.cloud_code,
    issuedAt: Date.now()
  };
  const token = await signProfileToken(payload, env.PROFILE_TOKEN_SECRET);

  return json(
    {
      token,
      cloudCode: row.cloud_code,
      player: {
        id: row.player_id,
        displayName,
        provider: "guest"
      },
      progress: JSON.parse(row.progress_json)
    },
    { status: 200, headers: cors }
  );
}

async function handleProfileProgress(request: Request, env: EnemyDirectorEnv, cors: Headers): Promise<Response> {
  if (request.method !== "GET" && request.method !== "PUT") {
    return json({ error: "method_not_allowed" }, { status: 405, headers: cors });
  }
  if (!env.PROFILE_DB) {
    return json({ error: "cloud_save_unavailable" }, { status: 503, headers: cors });
  }

  const session = await readProfileSession(request, env);
  if (!session) {
    return json({ error: "unauthorized" }, { status: 401, headers: cors });
  }

  if (request.method === "GET") {
    const row = await env.PROFILE_DB.prepare("SELECT progress_json, cloud_code FROM player_progress WHERE player_id = ?").bind(session.sub).first<{
      progress_json: string;
      cloud_code: string | null;
    }>();
    return json(
      {
        playerId: session.sub,
        cloudCode: row?.cloud_code ?? session.cloudCode,
        progress: row ? JSON.parse(row.progress_json) : undefined
      },
      { status: 200, headers: cors }
    );
  }

  const progress = await readProfileProgress(request);
  if (!progress) {
    return json({ error: "invalid_progress" }, { status: 400, headers: cors });
  }
  await env.PROFILE_DB.prepare(
    "INSERT INTO player_progress (player_id, cloud_code, display_name, progress_json, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(player_id) DO UPDATE SET cloud_code = COALESCE(player_progress.cloud_code, excluded.cloud_code), display_name = excluded.display_name, progress_json = excluded.progress_json, updated_at = excluded.updated_at"
  )
    .bind(session.sub, session.cloudCode ?? null, session.displayName, JSON.stringify(progress), progress.updatedAt)
    .run();

  return json({ ok: true, saved: true }, { status: 200, headers: cors });
}

async function createCloudProfile(db: D1DatabaseBinding, displayName: string): Promise<{ playerId: string; code: string }> {
  const progress = emptyProgressSnapshot();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const playerId = `guest_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
    const code = generateCloudCode();
    try {
      await db
        .prepare("INSERT INTO player_progress (player_id, cloud_code, display_name, progress_json, updated_at) VALUES (?, ?, ?, ?, ?)")
        .bind(playerId, code, displayName, JSON.stringify(progress), progress.updatedAt)
        .run();
      return { playerId, code };
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }
    }
  }
  throw new Error("cloud_code_generation_failed");
}

function emptyProgressSnapshot(): ProfileProgressSnapshot {
  return {
    schemaVersion: 1,
    bestRunsByContract: {},
    unlockedContracts: [],
    shipUpgrades: [],
    updatedAt: new Date().toISOString()
  };
}

async function readJsonObject(request: Request): Promise<Record<string, unknown> | undefined> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

async function readProfileProgress(request: Request): Promise<ProfileProgressSnapshot | undefined> {
  const body = await readJsonObject(request);
  if (!body || body.schemaVersion !== 1 || !body.bestRunsByContract || typeof body.bestRunsByContract !== "object") {
    return undefined;
  }
  if (!Array.isArray(body.unlockedContracts) || !Array.isArray(body.shipUpgrades) || typeof body.updatedAt !== "string") {
    return undefined;
  }
  const progress: ProfileProgressSnapshot = {
    schemaVersion: 1,
    bestRunsByContract: body.bestRunsByContract as Record<string, unknown>,
    unlockedContracts: body.unlockedContracts.filter((value): value is string => typeof value === "string"),
    shipUpgrades: body.shipUpgrades.filter((value): value is string => typeof value === "string"),
    updatedAt: body.updatedAt
  };
  return JSON.stringify(progress).length <= 32_000 ? progress : undefined;
}

async function readProfileSession(request: Request, env: EnemyDirectorEnv): Promise<ProfileSessionPayload | undefined> {
  const authorization = request.headers.get("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  if (!token || !env.PROFILE_TOKEN_SECRET) {
    return undefined;
  }
  return verifyProfileToken(token, env.PROFILE_TOKEN_SECRET);
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
      candidate.archetype === "brute" ||
      candidate.archetype === "sentinel" ||
      candidate.archetype === "guardian" ||
      candidate.archetype === "missileBoat") &&
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
): Promise<EnemyDirectorBrain | undefined> {
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
    const parsed = JSON.parse(outputText) as Partial<EnemyDirectorBrain> & Partial<EnemyDirectorPolicy>;
    if (parsed.policy) {
      return {
        policy: clampPolicy(parsed.policy),
        directive: clampDirective(parsed.directive)
      };
    }
    return {
      policy: clampPolicy(parsed),
      directive: fallbackDirective
    };
  } catch {
    return undefined;
  }
}

function buildOpenAIRequest(model: string, directorRequest: EnemyDirectorRequest) {
  const quality = directorRequest.quality;
  const enemyLimit = quality === "cinematic" ? 8 : 4;
  const maxOutputTokens = quality === "cinematic" ? 260 : 160;
  return {
    model,
    max_output_tokens: maxOutputTokens,
    input: [
      {
        role: "system",
        content:
          quality === "cinematic"
            ? "You are the Astro Courier enemy director. Return only compact JSON. Coordinate varied enemy archetypes, readable flanks, fair recoveries, and tempo beats: calm, push, or spike."
            : "You are the Astro Courier enemy director. Return only compact JSON. Tune enemies for fun pressure, not unfair hits. Use tempo calm, push, or spike."
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
          required: ["policy", "directive"],
          properties: {
            policy: {
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
            },
            directive: {
              type: "object",
              additionalProperties: false,
              required: ["formation", "missileDoctrine", "tempo", "pressure", "hint"],
              properties: {
                formation: { type: "string", enum: ["screen", "pincer", "ambush", "retreat"] },
                missileDoctrine: { type: "string", enum: ["hold", "single", "salvo"] },
                tempo: { type: "string", enum: ["calm", "push", "spike"] },
                pressure: { type: "number", minimum: 0, maximum: 1 },
                hint: { type: "string", maxLength: 32 }
              }
            }
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

function clampDirective(directive: Partial<EnemyDirectorDirective> | undefined): EnemyDirectorDirective {
  return {
    formation:
      directive?.formation === "pincer" || directive?.formation === "ambush" || directive?.formation === "retreat" || directive?.formation === "screen"
        ? directive.formation
        : fallbackDirective.formation,
    missileDoctrine:
      directive?.missileDoctrine === "single" || directive?.missileDoctrine === "salvo" || directive?.missileDoctrine === "hold"
        ? directive.missileDoctrine
        : fallbackDirective.missileDoctrine,
    tempo:
      directive?.tempo === "push" || directive?.tempo === "spike" || directive?.tempo === "calm" ? directive.tempo : fallbackDirective.tempo,
    pressure: clampNumber(directive?.pressure, 0, 1, fallbackDirective.pressure),
    hint: typeof directive?.hint === "string" && directive.hint.trim() ? directive.hint.trim().slice(0, 32) : fallbackDirective.hint
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Number(value))) : fallback;
}

async function signProfileToken(payload: ProfileSessionPayload, secret: string): Promise<string> {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacSha256(`guest.${encodedPayload}`, secret);
  return `guest.${encodedPayload}.${signature}`;
}

async function verifyProfileToken(token: string, secret: string): Promise<ProfileSessionPayload | undefined> {
  const [prefix, encodedPayload, signature] = token.split(".");
  if (prefix !== "guest" || !encodedPayload || !signature) {
    return undefined;
  }
  const expectedSignature = await hmacSha256(`${prefix}.${encodedPayload}`, secret);
  if (!constantTimeEqual(signature, expectedSignature)) {
    return undefined;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as ProfileSessionPayload;
    return payload.provider === "guest" && typeof payload.sub === "string" ? payload : undefined;
  } catch {
    return undefined;
  }
}

async function hmacSha256(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function sanitizeDisplayName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.slice(0, 24) || "Courier";
}

const cloudCodeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateCloudCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const characters = Array.from(bytes, (byte) => cloudCodeAlphabet[byte % cloudCodeAlphabet.length]).join("");
  return `AC-${characters.slice(0, 4)}-${characters.slice(4)}`;
}

function normalizeCloudCode(value: string): string | undefined {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/gu, "");
  const withoutPrefix = compact.startsWith("AC") ? compact.slice(2) : compact;
  if (!/^[2-9A-HJ-NP-Z]{8}$/u.test(withoutPrefix)) {
    return undefined;
  }
  return `AC-${withoutPrefix.slice(0, 4)}-${withoutPrefix.slice(4)}`;
}

function base64UrlEncode(value: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function corsHeaders(request: Request, env: EnemyDirectorEnv): Headers {
  const headers = new Headers();
  const requestOrigin = request.headers.get("Origin");
  const allowedOrigin = env.ALLOWED_ORIGIN ?? "*";
  headers.set("Access-Control-Allow-Origin", requestOrigin && allowedOrigin !== "*" ? allowedOrigin : allowedOrigin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
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
