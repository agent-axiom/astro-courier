import { describe, expect, it, vi } from "vitest";

import { createGameMusicController } from "./gameMusic";

describe("game music controller", () => {
  it("plays menu music from the public manifest", async () => {
    const tracks: FakeMusicTrack[] = [];
    const controller = createGameMusicController({
      fetchJson: vi.fn(async () => ({
        menu: "/audio/menu/menu.mp3",
        gameplay: ["/audio/gameplay/flight-a.mp3"],
        volume: 0.5
      })),
      createAudio: (src) => {
        const track = new FakeMusicTrack(src);
        tracks.push(track);
        return track as unknown as HTMLAudioElement;
      }
    });

    await controller.playMenu();

    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.src).toBe("/audio/menu/menu.mp3");
    expect(tracks[0]?.loop).toBe(true);
    expect(tracks[0]?.volume).toBe(0.5);
    expect(tracks[0]?.play).toHaveBeenCalledTimes(1);
  });

  it("switches to a random gameplay track when a level starts", async () => {
    const tracks: FakeMusicTrack[] = [];
    const controller = createGameMusicController({
      random: () => 0.8,
      fetchJson: vi.fn(async () => ({
        menu: "/audio/menu/menu.mp3",
        gameplay: ["/audio/gameplay/flight-a.mp3", "/audio/gameplay/flight-b.mp3"]
      })),
      createAudio: (src) => {
        const track = new FakeMusicTrack(src);
        tracks.push(track);
        return track as unknown as HTMLAudioElement;
      }
    });

    await controller.playMenu();
    await controller.playGameplay();

    expect(tracks[0]?.pause).toHaveBeenCalledTimes(1);
    expect(tracks[1]?.src).toBe("/audio/gameplay/flight-b.mp3");
    expect(tracks[1]?.play).toHaveBeenCalledTimes(1);
  });

  it("can force a new random gameplay track for a fresh level start", async () => {
    const tracks: FakeMusicTrack[] = [];
    const random = vi.fn(() => 0);
    const controller = createGameMusicController({
      random,
      fetchJson: vi.fn(async () => ({
        gameplay: ["/audio/gameplay/flight-a.mp3", "/audio/gameplay/flight-b.mp3"]
      })),
      createAudio: (src) => {
        const track = new FakeMusicTrack(src);
        tracks.push(track);
        return track as unknown as HTMLAudioElement;
      }
    });

    await controller.playGameplay();
    random.mockReturnValue(0.8);
    await controller.playGameplay({ forceNewTrack: true });

    expect(tracks).toHaveLength(2);
    expect(tracks[0]?.src).toBe("/audio/gameplay/flight-a.mp3");
    expect(tracks[1]?.src).toBe("/audio/gameplay/flight-b.mp3");
    expect(tracks[0]?.pause).toHaveBeenCalledTimes(1);
    expect(tracks[1]?.play).toHaveBeenCalledTimes(1);
  });

  it("does not repeat the current gameplay track on a forced fresh level start", async () => {
    const tracks: FakeMusicTrack[] = [];
    const random = vi.fn(() => 0);
    const controller = createGameMusicController({
      random,
      fetchJson: vi.fn(async () => ({
        gameplay: ["/audio/gameplay/flight-a.mp3", "/audio/gameplay/flight-b.mp3", "/audio/gameplay/flight-c.mp3"]
      })),
      createAudio: (src) => {
        const track = new FakeMusicTrack(src);
        tracks.push(track);
        return track as unknown as HTMLAudioElement;
      }
    });

    await controller.playGameplay();
    await controller.playGameplay({ forceNewTrack: true });

    expect(tracks).toHaveLength(2);
    expect(tracks[0]?.src).toBe("/audio/gameplay/flight-a.mp3");
    expect(tracks[1]?.src).toBe("/audio/gameplay/flight-b.mp3");
    expect(tracks[0]?.pause).toHaveBeenCalledTimes(1);
  });

  it("keeps a single gameplay track playable when there are no alternatives", async () => {
    const tracks: FakeMusicTrack[] = [];
    const controller = createGameMusicController({
      random: () => 0,
      fetchJson: vi.fn(async () => ({
        gameplay: ["/audio/gameplay/flight-a.mp3"]
      })),
      createAudio: (src) => {
        const track = new FakeMusicTrack(src);
        tracks.push(track);
        return track as unknown as HTMLAudioElement;
      }
    });

    await controller.playGameplay();
    await controller.playGameplay({ forceNewTrack: true });

    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.play).toHaveBeenCalledTimes(2);
  });

  it("pauses menu music even when gameplay tracks are not configured yet", async () => {
    const tracks: FakeMusicTrack[] = [];
    const controller = createGameMusicController({
      fetchJson: vi.fn(async () => ({
        menu: "/audio/menu/menu.mp3",
        gameplay: []
      })),
      createAudio: (src) => {
        const track = new FakeMusicTrack(src);
        tracks.push(track);
        return track as unknown as HTMLAudioElement;
      }
    });

    await controller.playMenu();
    await controller.playGameplay({ forceNewTrack: true });

    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.pause).toHaveBeenCalledTimes(1);
  });

  it("keeps music silent when muted", async () => {
    const tracks: FakeMusicTrack[] = [];
    const controller = createGameMusicController({
      fetchJson: vi.fn(async () => ({
        menu: "/audio/menu/menu.mp3"
      })),
      createAudio: (src) => {
        const track = new FakeMusicTrack(src);
        tracks.push(track);
        return track as unknown as HTMLAudioElement;
      }
    });

    controller.setMuted(true);
    await controller.playMenu();

    expect(tracks[0]?.muted).toBe(true);
    expect(tracks[0]?.play).not.toHaveBeenCalled();
  });
});

class FakeMusicTrack {
  loop = false;
  muted = false;
  preload = "";
  currentTime = 0;
  volume = 1;
  play = vi.fn(async () => undefined);
  pause = vi.fn();

  constructor(public src: string) {}
}
