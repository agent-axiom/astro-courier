import { bestRunStorageKey, type BestRun } from "./bestRun";

export type CloudProgressSnapshot = {
  schemaVersion: 1;
  bestRunsByContract: Record<string, unknown>;
  unlockedContracts: string[];
  shipUpgrades: string[];
  updatedAt: string;
};

export type CloudSaveSession = {
  token: string;
  cloudCode: string;
  player: {
    id: string;
    displayName: string;
    provider: "guest";
  };
};

export type CloudSaveRestore = CloudSaveSession & {
  progress?: CloudProgressSnapshot;
};

export type CloudSaveStatus =
  | { mode: "disabled" }
  | { mode: "idle" }
  | { mode: "syncing" }
  | { mode: "synced"; displayName: string }
  | { mode: "error" };

export type CloudSaveStatusLabel = {
  label: "Cloud";
  value: string;
  tone: "idle" | "syncing" | "synced" | "error";
};

export type CloudSaveClient = {
  createGuestSession(displayName: string): Promise<CloudSaveSession | undefined>;
  saveProgress(session: CloudSaveSession, progress: CloudProgressSnapshot): Promise<boolean>;
  loadProgress(session: CloudSaveSession): Promise<CloudProgressSnapshot | undefined>;
  restoreSession(cloudCode: string): Promise<CloudSaveRestore | undefined>;
};

type FetchCloudSave = (url: string, init?: RequestInit) => Promise<Response>;
type CloudSaveStorage = Pick<Storage, "getItem" | "setItem">;

export const CLOUD_SAVE_SESSION_STORAGE_KEY = "astro-courier:cloud-session";

export function createCloudSaveClient(profileApiUrl: string | undefined, fetchImpl?: FetchCloudSave): CloudSaveClient | undefined {
  const endpoint = normalizeProfileApiUrl(profileApiUrl);
  if (!endpoint) {
    return undefined;
  }
  const cloudFetch = fetchImpl ?? ((url, init) => fetch(url, init));

  return {
    async createGuestSession(displayName) {
      const response = await cloudFetch(`${endpoint}/profile/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName })
      });
      if (!response.ok) {
        return undefined;
      }
      const payload = (await response.json()) as Partial<CloudSaveSession>;
      return isCloudSaveSession(payload) ? payload : undefined;
    },
    async saveProgress(session, progress) {
      const response = await cloudFetch(`${endpoint}/profile/progress`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(progress)
      });
      return response.ok;
    },
    async loadProgress(session) {
      const response = await cloudFetch(`${endpoint}/profile/progress`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (!response.ok) {
        return undefined;
      }
      const payload = (await response.json()) as { progress?: unknown };
      return isCloudProgressSnapshot(payload.progress) ? payload.progress : undefined;
    },
    async restoreSession(cloudCode) {
      const response = await cloudFetch(`${endpoint}/profile/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudCode })
      });
      if (!response.ok) {
        return undefined;
      }
      const payload = (await response.json()) as Partial<CloudSaveRestore>;
      const progress = payload.progress;
      if (!isCloudSaveSession(payload)) {
        return undefined;
      }
      return {
        token: payload.token,
        cloudCode: payload.cloudCode,
        player: payload.player,
        ...(isCloudProgressSnapshot(progress) ? { progress } : {})
      };
    }
  };
}

export function buildCloudProgressSnapshot(input: {
  bestRunsByContract: Record<string, unknown>;
  unlockedContracts: string[];
  shipUpgrades: string[];
  now?: Date;
}): CloudProgressSnapshot {
  return {
    schemaVersion: 1,
    bestRunsByContract: Object.fromEntries(Object.entries(input.bestRunsByContract).filter(([, value]) => value !== undefined)),
    unlockedContracts: [...input.unlockedContracts],
    shipUpgrades: [...input.shipUpgrades],
    updatedAt: (input.now ?? new Date()).toISOString()
  };
}

export function buildCloudSaveStatusLabel(status: CloudSaveStatus): CloudSaveStatusLabel {
  if (status.mode === "disabled") {
    return { label: "Cloud", value: "Local only", tone: "idle" };
  }
  if (status.mode === "syncing") {
    return { label: "Cloud", value: "Syncing", tone: "syncing" };
  }
  if (status.mode === "synced") {
    return { label: "Cloud", value: status.displayName, tone: "synced" };
  }
  if (status.mode === "error") {
    return { label: "Cloud", value: "Cloud off", tone: "error" };
  }
  return { label: "Cloud", value: "Cloud save", tone: "idle" };
}

export function storeCloudSaveSession(storage: CloudSaveStorage, session: CloudSaveSession): void {
  storage.setItem(CLOUD_SAVE_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function readStoredCloudSaveSession(storage: CloudSaveStorage): CloudSaveSession | undefined {
  const raw = storage.getItem(CLOUD_SAVE_SESSION_STORAGE_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isCloudSaveSession(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function writeCloudProgressToStorage(storage: CloudSaveStorage, progress: CloudProgressSnapshot): number {
  let written = 0;
  for (const [contractId, value] of Object.entries(progress.bestRunsByContract)) {
    if (isBestRun(value)) {
      storage.setItem(bestRunStorageKey(contractId), JSON.stringify(value));
      written += 1;
    }
  }
  return written;
}

function normalizeProfileApiUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/enemy-director\/?$/u, "").replace(/\/$/u, "");
}

function isCloudSaveSession(value: unknown): value is CloudSaveSession {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as CloudSaveSession;
  return (
    typeof candidate.token === "string" &&
    typeof candidate.cloudCode === "string" &&
    candidate.player !== undefined &&
    typeof candidate.player.id === "string" &&
    typeof candidate.player.displayName === "string" &&
    candidate.player.provider === "guest"
  );
}

function isBestRun(value: unknown): value is BestRun {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<BestRun>;
  return (
    typeof candidate.score === "number" &&
    typeof candidate.elapsedSeconds === "number" &&
    (candidate.medal === "none" ||
      candidate.medal === "bronze" ||
      candidate.medal === "silver" ||
      candidate.medal === "gold" ||
      candidate.medal === "comet")
  );
}

function isCloudProgressSnapshot(value: unknown): value is CloudProgressSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as CloudProgressSnapshot;
  return (
    candidate.schemaVersion === 1 &&
    candidate.bestRunsByContract !== undefined &&
    typeof candidate.bestRunsByContract === "object" &&
    Array.isArray(candidate.unlockedContracts) &&
    Array.isArray(candidate.shipUpgrades) &&
    typeof candidate.updatedAt === "string"
  );
}
