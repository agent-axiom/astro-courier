import { describe, expect, it } from "vitest";

import { normalizeGameMusicManifest, selectGameplayMusicTrack } from "./music";

describe("game music manifest", () => {
  it("normalizes menu and gameplay MP3 paths from the public audio manifest", () => {
    expect(
      normalizeGameMusicManifest({
        menu: "/audio/menu/menu.mp3",
        gameplay: ["/audio/gameplay/flight-a.mp3", "", 17, "/audio/gameplay/flight-b.mp3"],
        volume: 1.4
      })
    ).toEqual({
      menu: "/audio/menu/menu.mp3",
      gameplay: ["/audio/gameplay/flight-a.mp3", "/audio/gameplay/flight-b.mp3"],
      volume: 1
    });
  });

  it("keeps music optional until MP3 assets are provided", () => {
    expect(normalizeGameMusicManifest({})).toEqual({
      menu: null,
      gameplay: [],
      volume: 0.36
    });
  });

  it("selects one gameplay track for a level start", () => {
    const manifest = normalizeGameMusicManifest({
      gameplay: ["/audio/gameplay/flight-a.mp3", "/audio/gameplay/flight-b.mp3", "/audio/gameplay/flight-c.mp3"]
    });

    expect(selectGameplayMusicTrack(manifest, () => 0.67)).toBe("/audio/gameplay/flight-c.mp3");
  });

  it("avoids immediately repeating the previous gameplay track when alternatives exist", () => {
    const manifest = normalizeGameMusicManifest({
      gameplay: ["/audio/gameplay/flight-a.mp3", "/audio/gameplay/flight-b.mp3", "/audio/gameplay/flight-c.mp3"]
    });

    expect(selectGameplayMusicTrack(manifest, () => 0, "/audio/gameplay/flight-a.mp3")).toBe("/audio/gameplay/flight-b.mp3");
    expect(selectGameplayMusicTrack(manifest, () => 0.99, "/audio/gameplay/flight-a.mp3")).toBe("/audio/gameplay/flight-c.mp3");
  });
});
