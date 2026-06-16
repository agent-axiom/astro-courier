# Astro Courier Music

Use this folder for MP3 music that should be served by the web app.

Suggested layout:

- `menu/menu.mp3`
- `gameplay/flight-01.mp3`
- `gameplay/flight-02.mp3`

After adding files, update `manifest.json`:

```json
{
  "menu": "/audio/menu/menu.mp3",
  "gameplay": ["/audio/gameplay/flight-01.mp3", "/audio/gameplay/flight-02.mp3"],
  "volume": 0.36
}
```

Leave `menu` as `null` and `gameplay` empty until MP3 assets are ready.
