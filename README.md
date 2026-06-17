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

## Enemy Director Worker

The optional OpenAI enemy director runs as a Cloudflare Worker from `apps/enemy-director-worker`.
Deploy it with Wrangler:

```sh
corepack pnpm dlx wrangler login
corepack pnpm dlx wrangler deploy --config apps/enemy-director-worker/wrangler.toml
corepack pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/enemy-director-worker/wrangler.toml
```

After deploy, verify:

```sh
curl https://astro-courier-enemy-director.<your-subdomain>.workers.dev/health
```

Then set the GitHub repository variable `VITE_ENEMY_DIRECTOR_URL` to:

```text
https://astro-courier-enemy-director.<your-subdomain>.workers.dev/enemy-director
```
