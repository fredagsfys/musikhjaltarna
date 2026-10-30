# Musikhjältarna – Landing page

Offer page and purchase flow that test purchase intent for Musikhjältarna by Pianotopia, a practice app where children
practise piano in a fun, simple and independent way between their piano lessons.

The page follows the wireframe _Landing page MH-1_. See [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) (Swedish) for
messaging, structure, CTA ids and the measurement plan. The design is _Variant D, dov turkos_, see
[`landing-page-design-requirements.md`](landing-page-design-requirements.md). All copy marked _Lorem ipsum_ and all
images are placeholders.

## Stack

- [Astro 7](https://astro.build): static HTML, no JavaScript beyond small scripts for the purchase flow
- [Tailwind CSS 4](https://tailwindcss.com): design tokens in `src/styles/tokens.css`
- DM Serif Display, Nunito Sans and Caveat, self-hosted via Fontsource (no third-party font requests)
- SEO: canonical URLs, Open Graph/Twitter, JSON-LD (Organization, WebSite, Product/Offer), sitemap, `robots.txt`,
  `noindex` on the purchase flow
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) with static assets, a small API in `worker/` and a
  D1 database for leads

## Getting started

Requires Node.js `>= 22.23.4` (see `.nvmrc`).

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # type checks (site and Worker) + static build to dist/
npm run preview
```

Copy `.env.example` to `.env` to override:

| Variable   | Description                                                                              |
| ---------- | ---------------------------------------------------------------------------------------- |
| `SITE_URL` | Domain for canonical URLs, sitemap and Open Graph. Default: `https://musikhjaltarna.se`. |

`npm run dev` serves the site without the API. To test the whole purchase flow with storage locally, run
`npm run build && npx wrangler dev`, which runs the Worker against a local database.

## Structure

```
src/
  config/site.ts          Names, price, CTA ids, routes and the Web Analytics token
  components/sections/    The five sections of the offer page
  components/ui/          Design system components (buttons, headings, cards, avatars)
  components/doodles/     Hand-drawn SVG details (underline, stars, notes)
  components/seo/         Meta tags and JSON-LD
  assets/images/          Character art and photos, see the README there
  layouts/                Base, page and flow layouts
  lib/lead.ts             Submits purchase intent and opt-ins to the API
  pages/                  /, /kop/<section>, /kop/uppdatering, /kop/tack, /kop/nej-tack and info pages
  styles/tokens.css       Design tokens (colors, type scale, radii, motion)
worker/index.ts           API that stores leads in D1 (only /api/* runs it)
```

## Images

Put images in `src/assets/images/` using the names in [`src/assets/images/README.md`](src/assets/images/README.md).
Components pick them up automatically and Astro generates AVIF/WebP in the right sizes. Until then, placeholders show.

## Measurement

| Measurement point        | Measured as                                                                            | Where         |
| ------------------------ | -------------------------------------------------------------------------------------- | ------------- |
| Click on a buy button    | Page view of `/kop/hero`, `/kop/hjalpen`, `/kop/vardag`, `/kop/pedagog`, `/kop/avslut` | Web Analytics |
| Purchase intent (step 1) | Page view of `/kop/uppdatering`                                                        | Web Analytics |
| Yes to updates           | Page view of `/kop/tack`                                                               | Web Analytics |
| No thanks                | Page view of `/kop/nej-tack`                                                           | Web Analytics |
| Name and e-mail (leads)  | Row in the `leads` table, with the buy button's `cta_id`                               | Cloudflare D1 |

Each buy button leads to its own page, so Cloudflare Web Analytics counts clicks per section without cookies, custom
events or query strings. The beacon is added to every page in production builds (`site.webAnalyticsToken` in
`src/config/site.ts`), and the funnel shows in Cloudflare under Analytics & Logs → Web Analytics → _Top paths_.

Names and e-mail addresses are stored by a small API in [`worker/index.ts`](worker/index.ts) in the D1 database
`musikhjaltarna`. Purchase intent and update opt-ins are stored as separate rows. No cookies, IP addresses or user
agents are stored. Read leads in Cloudflare under Storage & Databases → D1 → `musikhjaltarna` → Console.

A row of type `updates_opt_in` only flags that the e-mail address wants updates, so the name and buy button are stored
once, on the purchase-intent row.

```sql
-- One row per person, with whether they want updates (1/0)
SELECT p.created_at, p.name, p.email, p.cta_id,
       EXISTS (SELECT 1 FROM leads o WHERE o.type = 'updates_opt_in' AND o.email = p.email) AS wants_updates
FROM leads p
WHERE p.type = 'purchase_intent'
ORDER BY p.created_at DESC;

-- Purchase intent per buy button
SELECT cta_id, COUNT(*) AS count FROM leads WHERE type = 'purchase_intent' GROUP BY cta_id;
```

## Deployment

The site runs on Cloudflare Workers, configured in [`wrangler.jsonc`](wrangler.jsonc). Pages are served as static
assets (`kop.html` as `/kop`, unknown paths get `404.html`). Only `/api/*` runs the Worker, which writes leads to the
D1 database `musikhjaltarna`. The table is created on first use.

Cloudflare settings (Workers Builds):

| Setting                      | Value                          |
| ---------------------------- | ------------------------------ |
| Build command                | `npm run build`                |
| Deploy command               | `npx wrangler deploy`          |
| Non-production branch deploy | `npx wrangler versions upload` |
| Environment variables        | `NODE_VERSION=24`              |

`name` in `wrangler.jsonc` must match the Worker name in Cloudflare. Test the config locally without logging in with
`npx wrangler deploy --dry-run` after a build.
