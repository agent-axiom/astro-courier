export type GameMusicManifest = {
  menu: string | null;
  gameplay: string[];
  volume: number;
};

const defaultMusicVolume = 0.36;

export function normalizeGameMusicManifest(input: unknown): GameMusicManifest {
  const manifest = isRecord(input) ? input : {};
  const menu = normalizePath(manifest.menu);
  const gameplay = Array.isArray(manifest.gameplay)
    ? manifest.gameplay.map((path) => normalizePath(path)).filter((path): path is string => Boolean(path))
    : [];
  const volume = typeof manifest.volume === "number" && Number.isFinite(manifest.volume) ? clamp(manifest.volume, 0, 1) : defaultMusicVolume;

  return {
    menu,
    gameplay,
    volume
  };
}

export function selectGameplayMusicTrack(manifest: Pick<GameMusicManifest, "gameplay">, random: () => number = Math.random): string | undefined {
  if (manifest.gameplay.length === 0) {
    return undefined;
  }

  const index = Math.min(manifest.gameplay.length - 1, Math.max(0, Math.floor(random() * manifest.gameplay.length)));
  return manifest.gameplay[index];
}

function normalizePath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const path = value.trim();
  return path.length > 0 ? path : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
