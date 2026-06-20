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
      expect(body.max_output_tokens).toBe(120);
      expect(JSON.parse(body.input[1].content)).toMatchObject({
        quality: "standard",
        enemies: [
          {
            archetype: "fighter"
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
            aggression: 3,
            flank: -2,
            fireBias: 2,
            retreatHp: 100,
            focus: "player"
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
      }
    });
  });

  it("uses a larger OpenAI budget and wider enemy slice for cinematic quality", async () => {
    const fetchOpenAI = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      const userState = JSON.parse(body.input[1].content);

      expect(body.max_output_tokens).toBe(220);
      expect(userState.quality).toBe("cinematic");
      expect(userState.enemies).toHaveLength(6);
      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            aggression: 0.72,
            flank: 0.35,
            fireBias: 0.62,
            retreatHp: 22,
            focus: "objective"
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
      }
    });
  });
});

function testEnv(): EnemyDirectorEnv {
  return {
    OPENAI_API_KEY: "test-openai-key",
    OPENAI_MODEL: "gpt-5.4-mini",
    ALLOWED_ORIGIN: "https://agent-axiom.github.io"
  };
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
        archetype: "fighter",
        hp: 40,
        position: { x: 180, y: -10 },
        distance: 64
      }
    ]
  };
}
