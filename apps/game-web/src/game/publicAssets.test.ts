import { describe, expect, it } from "vitest";

import { resolvePublicAssetPath } from "./publicAssets";

describe("public asset paths", () => {
  it("keeps root builds on ordinary public asset URLs", () => {
    expect(resolvePublicAssetPath("images/astro-courier-cover.png", "/")).toBe("/images/astro-courier-cover.png");
    expect(resolvePublicAssetPath("/audio/manifest.json", "/")).toBe("/audio/manifest.json");
  });

  it("prefixes project-page builds with the deploy base", () => {
    expect(resolvePublicAssetPath("images/astro-courier-cover.png", "/astro-courier/")).toBe(
      "/astro-courier/images/astro-courier-cover.png"
    );
    expect(resolvePublicAssetPath("/audio/menu/menu.mp3", "/astro-courier/")).toBe("/astro-courier/audio/menu/menu.mp3");
  });

  it("leaves external and data URLs untouched", () => {
    expect(resolvePublicAssetPath("https://cdn.example.com/track.mp3", "/astro-courier/")).toBe("https://cdn.example.com/track.mp3");
    expect(resolvePublicAssetPath("data:audio/mp3;base64,abc", "/astro-courier/")).toBe("data:audio/mp3;base64,abc");
  });
});
