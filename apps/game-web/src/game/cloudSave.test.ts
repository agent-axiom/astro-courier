import { describe, expect, it, vi } from "vitest";
import {
  buildCloudProgressSnapshot,
  buildCloudSaveStatusLabel,
  createCloudSaveClient,
  readStoredCloudSaveSession,
  storeCloudSaveSession,
  writeCloudProgressToStorage
} from "./cloudSave";

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
          cloudCode: "AC-STAR-2026",
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
      cloudCode: "AC-STAR-2026",
      player: { id: "guest_123", displayName: "Courier", provider: "guest" }
    });
    expect(saved).toBe(true);
  });

  it("restores a guest session and progress through a cloud code", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://director.example/profile/restore");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({ cloudCode: "AC-STAR-2026" });
      return jsonResponse({
        token: "guest.restored.signature",
        cloudCode: "AC-STAR-2026",
        player: { id: "guest_123", displayName: "Courier", provider: "guest" },
        progress: {
          schemaVersion: 1,
          bestRunsByContract: {
            "first-light-delivery": { score: 1500, elapsedSeconds: 25, medal: "gold" }
          },
          unlockedContracts: ["first-light-delivery"],
          shipUpgrades: ["Boost Tune"],
          updatedAt: "2026-06-21T00:00:00.000Z"
        }
      });
    });
    const client = createCloudSaveClient("https://director.example", fetchImpl);

    await expect(client?.restoreSession("AC-STAR-2026")).resolves.toEqual({
      token: "guest.restored.signature",
      cloudCode: "AC-STAR-2026",
      player: { id: "guest_123", displayName: "Courier", provider: "guest" },
      progress: {
        schemaVersion: 1,
        bestRunsByContract: {
          "first-light-delivery": { score: 1500, elapsedSeconds: 25, medal: "gold" }
        },
        unlockedContracts: ["first-light-delivery"],
        shipUpgrades: ["Boost Tune"],
        updatedAt: "2026-06-21T00:00:00.000Z"
      }
    });
  });

  it("stores cloud sessions locally and writes restored best runs into game storage", () => {
    const storage = new MemoryStorage();
    const session = {
      token: "guest.token.signature",
      cloudCode: "AC-STAR-2026",
      player: { id: "guest_123", displayName: "Courier", provider: "guest" as const }
    };

    storeCloudSaveSession(storage, session);
    writeCloudProgressToStorage(storage, {
      schemaVersion: 1,
      bestRunsByContract: {
        "first-light-delivery": { score: 1500, elapsedSeconds: 25, medal: "gold" },
        broken: { score: "bad" }
      },
      unlockedContracts: ["first-light-delivery"],
      shipUpgrades: ["Boost Tune"],
      updatedAt: "2026-06-21T00:00:00.000Z"
    });

    expect(readStoredCloudSaveSession(storage)).toEqual(session);
    expect(storage.getItem("astro-courier:best-run:first-light-delivery")).toBe(
      JSON.stringify({ score: 1500, elapsedSeconds: 25, medal: "gold" })
    );
    expect(storage.getItem("astro-courier:best-run:broken")).toBeNull();
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

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
