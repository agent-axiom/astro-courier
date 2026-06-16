import { normalizeGameMusicManifest, selectGameplayMusicTrack, type GameMusicManifest } from "./music";

export type GameMusicController = {
  loadManifest: () => Promise<void>;
  playMenu: () => Promise<void>;
  playGameplay: () => Promise<void>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  destroy: () => void;
};

export type GameMusicControllerOptions = {
  manifestUrl?: string;
  random?: () => number;
  createAudio?: (src: string) => HTMLAudioElement | undefined;
  fetchJson?: (url: string) => Promise<unknown>;
};

type MusicMode = "idle" | "menu" | "gameplay";

const defaultManifestUrl = "/audio/manifest.json";

export function createGameMusicController(options: GameMusicControllerOptions = {}): GameMusicController {
  const manifestUrl = options.manifestUrl ?? defaultManifestUrl;
  const random = options.random ?? Math.random;
  const createAudio = options.createAudio ?? createBrowserAudio;
  const fetchJson = options.fetchJson ?? fetchManifestJson;
  let manifest = normalizeGameMusicManifest({});
  let manifestPromise: Promise<void> | undefined;
  let menuAudio: HTMLAudioElement | undefined;
  let gameplayAudio: HTMLAudioElement | undefined;
  let gameplaySrc: string | undefined;
  let mode: MusicMode = "idle";
  let muted = false;

  const loadManifest = async () => {
    manifestPromise ??= fetchJson(manifestUrl)
      .then((json) => {
        manifest = normalizeGameMusicManifest(json);
        syncTrack(menuAudio, true);
        syncTrack(gameplayAudio, true);
      })
      .catch(() => {
        manifest = normalizeGameMusicManifest({});
      });

    return manifestPromise;
  };

  return {
    loadManifest,
    async playMenu() {
      await loadManifest();
      if (!manifest.menu) {
        return;
      }

      pauseTrack(gameplayAudio);
      mode = "menu";
      if (!menuAudio || menuAudio.src !== resolveAudioSrc(manifest.menu)) {
        menuAudio = createTrack(manifest.menu, true);
      }
      await playTrack(menuAudio, muted);
    },
    async playGameplay() {
      await loadManifest();
      const wasGameplay = mode === "gameplay";
      const nextGameplaySrc = wasGameplay && gameplaySrc ? gameplaySrc : selectGameplayMusicTrack(manifest, random);
      if (!nextGameplaySrc) {
        return;
      }

      pauseTrack(menuAudio);
      mode = "gameplay";
      if (!gameplayAudio || gameplaySrc !== nextGameplaySrc) {
        gameplaySrc = nextGameplaySrc;
        gameplayAudio = createTrack(nextGameplaySrc, true);
      } else if (!wasGameplay) {
        resetTrack(gameplayAudio);
      }
      await playTrack(gameplayAudio, muted);
    },
    stop() {
      mode = "idle";
      stopTrack(menuAudio);
      stopTrack(gameplayAudio);
      gameplaySrc = undefined;
    },
    setMuted(nextMuted) {
      muted = nextMuted;
      syncTrack(menuAudio, false);
      syncTrack(gameplayAudio, false);
    },
    destroy() {
      mode = "idle";
      pauseTrack(menuAudio);
      pauseTrack(gameplayAudio);
      menuAudio = undefined;
      gameplayAudio = undefined;
      gameplaySrc = undefined;
    }
  };

  function createTrack(src: string, loop: boolean): HTMLAudioElement | undefined {
    const audio = createAudio(src);
    if (!audio) {
      return undefined;
    }

    audio.loop = loop;
    audio.preload = "auto";
    syncTrack(audio, false);
    return audio;
  }

  function syncTrack(audio: HTMLAudioElement | undefined, preservePlayback: boolean): void {
    if (!audio) {
      return;
    }

    audio.volume = manifest.volume;
    audio.muted = muted;
    if (!preservePlayback && muted) {
      return;
    }
  }
}

async function playTrack(audio: HTMLAudioElement | undefined, muted: boolean): Promise<void> {
  if (!audio || muted) {
    return;
  }

  try {
    await audio.play();
  } catch {
    // Browser autoplay rules can reject music before a user gesture.
  }
}

function pauseTrack(audio: HTMLAudioElement | undefined): void {
  if (!audio) {
    return;
  }

  audio.pause();
}

function stopTrack(audio: HTMLAudioElement | undefined): void {
  pauseTrack(audio);
  resetTrack(audio);
}

function resetTrack(audio: HTMLAudioElement | undefined): void {
  if (!audio) {
    return;
  }

  try {
    audio.currentTime = 0;
  } catch {
    // Some browsers can reject seeking before metadata has loaded.
  }
}

function createBrowserAudio(src: string): HTMLAudioElement | undefined {
  if (typeof Audio === "undefined") {
    return undefined;
  }

  return new Audio(src);
}

function resolveAudioSrc(src: string): string {
  if (typeof document === "undefined") {
    return src;
  }

  const probe = document.createElement("audio");
  probe.src = src;
  return probe.src;
}

async function fetchManifestJson(url: string): Promise<unknown> {
  if (typeof fetch !== "function") {
    return {};
  }

  const response = await fetch(url, { cache: "no-cache" });
  return response.ok ? response.json() : {};
}
