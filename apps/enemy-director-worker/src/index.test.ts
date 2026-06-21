import { describe, expect, it, vi } from "vitest";
import { createEnemyDirectorWorker, type EnemyDirectorEnv } from "./index";

const endpoint = "https://director.example/enemy-director";

describe("enemy director worker", () => {
  it("answers health checks without touching OpenAI", async () => {
    const fetchOpenAI = vi.fn();
    const worker = createEnemyDirectorWorker({ fetchOpenAI });

    const response = await worker.fetch(new Request("https://director.example/health"), testEnv());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: "enemy-director" });
    expect(fetchOpenAI).not.toHaveBeenCalled();
  });

  it("handles CORS preflight for the GitHub Pages origin", async () => {
    const worker = createEnemyDirectorWorker();

    const response = await worker.fetch(
      new Request(endpoint, {
        method: "OPTIONS",
        headers: {
          Origin: "https://agent-axiom.github.io",
          "Access-Control-Request-Method": "POST"
        }
      }),
      testEnv()
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://agent-axiom.github.io");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("rejects malformed director requests before calling OpenAI", async () => {
    const fetchOpenAI = vi.fn();
    const worker = createEnemyDirectorWorker({ fetchOpenAI });

    const response = await worker.fetch(
      new Request(endpoint, {
        method: "POST",
        body: JSON.stringify({ ship: { hp: "full" } })
      }),
      testEnv()
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "invalid_director_request"
    });
    expect(fetchOpenAI).not.toHaveBeenCalled();
  });

  it("calls OpenAI Responses API and clamps structured director policy", async () => {
    const fetchOpenAI = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body.model).toBe("gpt-5.4-mini");
      expect(body.text.format.type).toBe("json_schema");
      expect(body.text.format.schema.properties.directive.required).toContain("tempo");
      expect(body.text.format.schema.properties.directive.required).toContain("modifier");
      expect(body.text.format.schema.properties.directive.required).toContain("scene");
      expect(body.text.format.schema.properties.directive.required).toContain("personality");
      expect(body.max_output_tokens).toBe(160);
      expect(JSON.parse(body.input[1].content)).toMatchObject({
        quality: "standard",
        enemies: [
          {
            archetype: "scout"
          }
        ]
      });
      expect(init.headers).toMatchObject({
        Authorization: "Bearer test-openai-key",
        "Content-Type": "application/json"
      });
      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            policy: {
              aggression: 3,
              flank: -2,
              fireBias: 2,
              retreatHp: 100,
              focus: "player"
            },
            directive: {
              formation: "pincer",
              missileDoctrine: "salvo",
              tempo: "spike",
              modifier: "ambush",
              scene: "siege",
              personality: "sniper",
              pressure: 3,
              hint: "wide pincer"
            }
          })
        }),
        { status: 200 }
      );
    });
    const worker = createEnemyDirectorWorker({ fetchOpenAI });

    const response = await worker.fetch(
      new Request(endpoint, {
        method: "POST",
        headers: { Origin: "https://agent-axiom.github.io" },
        body: JSON.stringify(validDirectorRequest())
      }),
      testEnv()
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      mode: "openai",
      policy: {
        aggression: 1,
        flank: -1,
        fireBias: 1,
        retreatHp: 78,
        focus: "player"
      },
      directive: {
        formation: "pincer",
        missileDoctrine: "salvo",
        tempo: "spike",
        modifier: "ambush",
        scene: "siege",
        personality: "sniper",
        pressure: 1,
        hint: "wide pincer"
      }
    });
  });

  it("uses a larger OpenAI budget and wider enemy slice for cinematic quality", async () => {
    const fetchOpenAI = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      const userState = JSON.parse(body.input[1].content);

      expect(body.max_output_tokens).toBe(260);
      expect(userState.quality).toBe("cinematic");
      expect(userState.enemies).toHaveLength(6);
      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            policy: {
              aggression: 0.72,
              flank: 0.35,
              fireBias: 0.62,
              retreatHp: 22,
              focus: "objective"
            },
            directive: {
              formation: "ambush",
              missileDoctrine: "single",
              tempo: "push",
              modifier: "heavyEscort",
              scene: "ambush",
              personality: "swarm",
              pressure: 0.66,
              hint: "ambush lane"
            }
          })
        }),
        { status: 200 }
      );
    });
    const worker = createEnemyDirectorWorker({ fetchOpenAI });

    const response = await worker.fetch(
      new Request(endpoint, {
        method: "POST",
        body: JSON.stringify({
          ...validDirectorRequest(),
          quality: "cinematic",
          enemies: Array.from({ length: 6 }, (_, index) => ({
            id: `enemy-${index}`,
            archetype: index === 5 ? "brute" : "drone",
            hp: 20,
            position: { x: 180 + index * 12, y: -10 },
            distance: 64 + index
          }))
        })
      }),
      testEnv()
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      mode: "openai",
      policy: {
        aggression: 0.72,
        flank: 0.35,
        fireBias: 0.62,
        retreatHp: 22,
        focus: "objective"
      },
      directive: {
        formation: "ambush",
        missileDoctrine: "single",
        tempo: "push",
        modifier: "heavyEscort",
        scene: "ambush",
        personality: "swarm",
        pressure: 0.66,
        hint: "ambush lane"
      }
    });
  });

  it("returns a local fallback policy when OpenAI is unavailable", async () => {
    const worker = createEnemyDirectorWorker({
      fetchOpenAI: vi.fn(async () => new Response("upstream unavailable", { status: 503 }))
    });

    const response = await worker.fetch(
      new Request(endpoint, {
        method: "POST",
        body: JSON.stringify(validDirectorRequest())
      }),
      testEnv()
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      mode: "fallback",
      policy: {
        aggression: 0.45,
        flank: 0,
        fireBias: 0.4,
        retreatHp: 28,
        focus: "cargo"
      },
      directive: {
        formation: "screen",
        missileDoctrine: "hold",
        tempo: "calm",
        modifier: "none",
        scene: "none",
        personality: "balanced",
        pressure: 0.4,
        hint: "screen"
      }
    });
  });

  it("issues a signed guest profile session", async () => {
    const db = new MemoryProfileDb();
    const worker = createEnemyDirectorWorker();

    const response = await worker.fetch(
      new Request("https://director.example/profile/session", {
        method: "POST",
        headers: { Origin: "https://agent-axiom.github.io", "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Pilot" })
      }),
      testEnv({ PROFILE_DB: db, PROFILE_TOKEN_SECRET: "profile-secret" })
    );

    const payload = (await response.json()) as {
      token?: string;
      cloudCode?: string;
      player?: { id: string; displayName: string; provider: string };
    };

    expect(response.status).toBe(200);
    expect(payload.token).toMatch(/^guest\./);
    expect(payload.cloudCode).toMatch(/^AC-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    expect(payload.player).toMatchObject({
      displayName: "Pilot",
      provider: "guest"
    });
    expect(payload.player?.id).toMatch(/^guest_/);
  });

  it("restores a guest profile session and progress by cloud code", async () => {
    const db = new MemoryProfileDb();
    const worker = createEnemyDirectorWorker();
    const env = testEnv({ PROFILE_DB: db, PROFILE_TOKEN_SECRET: "profile-secret" });
    const session = (await (
      await worker.fetch(
        new Request("https://director.example/profile/session", {
          method: "POST",
          body: JSON.stringify({ displayName: "Courier" })
        }),
        env
      )
    ).json()) as { token: string; cloudCode: string; player: { id: string } };
    await worker.fetch(
      new Request("https://director.example/profile/progress", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          schemaVersion: 1,
          bestRunsByContract: {
            "first-light-delivery": { score: 1200, elapsedSeconds: 31, medal: "gold" }
          },
          unlockedContracts: ["first-light-delivery"],
          shipUpgrades: ["Boost Tune"],
          updatedAt: "2026-06-21T00:00:00.000Z"
        })
      }),
      env
    );

    const restoreResponse = await worker.fetch(
      new Request("https://director.example/profile/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudCode: session.cloudCode.toLowerCase().replaceAll("-", " ") })
      }),
      env
    );
    const restored = (await restoreResponse.json()) as {
      token?: string;
      cloudCode?: string;
      player?: { id: string; displayName: string; provider: string };
      progress?: unknown;
    };

    expect(restoreResponse.status).toBe(200);
    expect(restored.token).toMatch(/^guest\./);
    expect(restored.cloudCode).toBe(session.cloudCode);
    expect(restored.player).toEqual({
      id: session.player.id,
      displayName: "Courier",
      provider: "guest"
    });
    expect(restored.progress).toEqual({
      schemaVersion: 1,
      bestRunsByContract: {
        "first-light-delivery": { score: 1200, elapsedSeconds: 31, medal: "gold" }
      },
      unlockedContracts: ["first-light-delivery"],
      shipUpgrades: ["Boost Tune"],
      updatedAt: "2026-06-21T00:00:00.000Z"
    });
  });

  it("saves and reads a cloud progress snapshot from D1", async () => {
    const db = new MemoryProfileDb();
    const worker = createEnemyDirectorWorker();
    const env = testEnv({ PROFILE_DB: db, PROFILE_TOKEN_SECRET: "profile-secret" });
    const session = (await (
      await worker.fetch(
        new Request("https://director.example/profile/session", {
          method: "POST",
          body: JSON.stringify({ displayName: "Courier" })
        }),
        env
      )
    ).json()) as { token: string; cloudCode: string; player: { id: string } };

    const saveResponse = await worker.fetch(
      new Request("https://director.example/profile/progress", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          schemaVersion: 1,
          bestRunsByContract: {
            "first-light-delivery": { score: 1200, medal: "gold" }
          },
          unlockedContracts: ["first-light-delivery", "return-leg"],
          shipUpgrades: ["boost-core"],
          updatedAt: "2026-06-21T00:00:00.000Z"
        })
      }),
      env
    );

    const readResponse = await worker.fetch(
      new Request("https://director.example/profile/progress", {
        headers: { Authorization: `Bearer ${session.token}` }
      }),
      env
    );

    expect(saveResponse.status).toBe(200);
    expect(await saveResponse.json()).toEqual({ ok: true, saved: true });
    expect(readResponse.status).toBe(200);
    expect(await readResponse.json()).toEqual({
      playerId: session.player.id,
      cloudCode: session.cloudCode,
      progress: {
        schemaVersion: 1,
        bestRunsByContract: {
          "first-light-delivery": { score: 1200, medal: "gold" }
        },
        unlockedContracts: ["first-light-delivery", "return-leg"],
        shipUpgrades: ["boost-core"],
        updatedAt: "2026-06-21T00:00:00.000Z"
      }
    });
  });

  it("returns a clear cloud-save unavailable response when D1 is not bound", async () => {
    const worker = createEnemyDirectorWorker();
    const response = await worker.fetch(
      new Request("https://director.example/profile/progress", {
        headers: { Authorization: "Bearer guest.invalid.signature" }
      }),
      testEnv({ PROFILE_TOKEN_SECRET: "profile-secret" })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "cloud_save_unavailable" });
  });
});

function testEnv(overrides: Partial<EnemyDirectorEnv> = {}): EnemyDirectorEnv {
  return {
    OPENAI_API_KEY: "test-openai-key",
    OPENAI_MODEL: "gpt-5.4-mini",
    ALLOWED_ORIGIN: "https://agent-axiom.github.io",
    ...overrides
  };
}

class MemoryProfileDb {
  private rows = new Map<
    string,
    {
      player_id: string;
      cloud_code: string | null;
      display_name: string | null;
      progress_json: string;
      updated_at: string;
    }
  >();
  private query = "";
  private args: unknown[] = [];

  prepare(query: string): this {
    const statement = new MemoryProfileDb();
    statement.rows = this.rows;
    statement.query = query;
    return statement as this;
  }

  bind(...args: unknown[]): this {
    this.args = args;
    return this;
  }

  async first<T>(): Promise<T | null> {
    if (this.query.includes("WHERE cloud_code")) {
      const cloudCode = String(this.args[0]);
      const row = Array.from(this.rows.values()).find((candidate) => candidate.cloud_code === cloudCode);
      return row ? (row as T) : null;
    }
    if (this.query.includes("WHERE player_id")) {
      const playerId = String(this.args[0]);
      return (this.rows.get(playerId) as T | undefined) ?? null;
    }
    return null;
  }

  async run(): Promise<{ success: boolean }> {
    if (this.query.includes("INSERT INTO player_progress")) {
      const playerId = String(this.args[0]);
      const hasCloudCode = this.args.length >= 5;
      if (hasCloudCode) {
        const cloudCode = this.args[1] === null ? null : String(this.args[1]);
        const displayName = this.args[2] === null ? null : String(this.args[2]);
        const progressJson = String(this.args[3]);
        const updatedAt = String(this.args[4]);
        if (cloudCode && Array.from(this.rows.values()).some((row) => row.cloud_code === cloudCode && row.player_id !== playerId)) {
          throw new Error("UNIQUE constraint failed: player_progress.cloud_code");
        }
        this.rows.set(playerId, {
          player_id: playerId,
          cloud_code: cloudCode ?? this.rows.get(playerId)?.cloud_code ?? null,
          display_name: displayName,
          progress_json: progressJson,
          updated_at: updatedAt
        });
      } else {
        const progressJson = String(this.args[1]);
        const updatedAt = String(this.args[2]);
        this.rows.set(playerId, {
          player_id: playerId,
          cloud_code: this.rows.get(playerId)?.cloud_code ?? null,
          display_name: this.rows.get(playerId)?.display_name ?? null,
          progress_json: progressJson,
          updated_at: updatedAt
        });
      }
    }
    return { success: true };
  }
}

function validDirectorRequest() {
  return {
    tick: 120,
    objectivePhase: "delivery",
    ship: {
      hp: 82,
      position: { x: 120, y: -30 },
      velocity: { x: 8, y: 2 }
    },
    enemies: [
      {
        id: "interceptor-a",
        archetype: "scout",
        hp: 40,
        position: { x: 180, y: -10 },
        distance: 64
      }
    ]
  };
}
