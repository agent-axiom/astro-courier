# Astro Courier

![Astro Courier cover](apps/game-web/public/images/astro-courier-cover.png)

Astro Courier is a lightweight space delivery arcade game. The web build lives in `apps/game-web`.
The same cover art is shown in the preflight launch menu before each flight.

## Run Locally

```sh
corepack pnpm --filter @astro-courier/game-web dev
```

## Publish

The production game is deployed with GitHub Pages from `.github/workflows/deploy-pages.yml`.
After the workflow is enabled and `main` is pushed, the public URL is:

https://agent-axiom.github.io/astro-courier/
