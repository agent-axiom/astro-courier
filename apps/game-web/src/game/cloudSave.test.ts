import { describe, expect, it, vi } from "vitest";
import { buildCloudProgressSnapshot, buildCloudSaveStatusLabel, createCloudSaveClient } from "./cloudSave";

describe("cloud save", () => {
  it("builds a compact progress snapshot from local best runs", () => {
    expect(
      buildCloudProgressSnapshot({
        bestRunsByContract: {
          "first-light-delivery": { score: 1200, elapsedSeconds: 28, medal: "gold" },
          "return-leg": undefined
        },
        unlockedContracts: ["first-light-delivery"],
        shipUpgrades: ["Boost I"],
        now: new Date("2026-06-21T00:00:00.000Z")
      })
    ).toEqual({
      schemaVersion: 1,
      bestRunsByContract: {
        "first-light-delivery": { score: 1200, elapsedSeconds: 28, medal: "gold" }
      },
      unlockedContracts: ["first-light-delivery"],
      shipUpgrades: ["Boost I"],
      updatedAt: "2026-06-21T00:00:00.000Z"
    });
  });

  it("creates a guest session and saves progress through the profile API", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/profile/session")) {
        expect(init?.method).toBe("POST");
        return jsonResponse({
          token: "guest.token.signature",
          player: { id: "guest_123", displayName: "Courier", provider: "guest" }
        });
      }
      expect(url).toBe("https://director.example/profile/progress");
      expect(init?.method).toBe("PUT");
      expect(init?.headers).toMatchObject({
        Authorization: "Bearer guest.token.signature",
        "Content-Type": "application/json"
      });
      return jsonResponse({ ok: true, saved: true });
    });
    const client = createCloudSaveClient("https://director.example/enemy-director", fetchImpl);
    const session = await client?.createGuestSession("Courier");

    const saved = await client?.saveProgress(session!, {
      schemaVersion: 1,
      bestRunsByContract: {},
      unlockedContracts: [],
      shipUpgrades: [],
      updatedAt: "2026-06-21T00:00:00.000Z"
    });

    expect(session).toEqual({
      token: "guest.token.signature",
      player: { id: "guest_123", displayName: "Courier", provider: "guest" }
    });
    expect(saved).toBe(true);
  });

  it("stays disabled when no profile API endpoint is configured", () => {
    expect(createCloudSaveClient(undefined)).toBeUndefined();
    expect(buildCloudSaveStatusLabel({ mode: "disabled" })).toEqual({ label: "Cloud", value: "Local only", tone: "idle" });
  });

  it("labels profile sync without implying a full account login", () => {
    expect(buildCloudSaveStatusLabel({ mode: "idle" })).toEqual({ label: "Cloud", value: "Cloud save", tone: "idle" });
    expect(buildCloudSaveStatusLabel({ mode: "error" })).toEqual({ label: "Cloud", value: "Cloud off", tone: "error" });
  });
});

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
