# Musikhjältarna – Landing page

Offer page and purchase flow that test purchase intent for Musikhjältarna by Pianotopia, a practice app where children
practise piano in a fun, simple and independent way between their piano lessons.

The page follows the wireframe _Landing page MH-1_. See [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) (Swedish) for
messaging, structure, CTA ids and the measurement plan. The design is _Variant D, dov turkos_, see
[`landing-page-design-requirements.md`](landing-page-design-requirements.md). All copy marked _Lorem ipsum_ and all
images are placeholders.

| Document                                                 | For                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`docs/EDITING.md`](docs/EDITING.md) (Swedish)           | Editors: changing texts, the price, links and images without code           |
| [`docs/ADMIN.md`](docs/ADMIN.md)                         | Administrators: access, registrations, export, deletion, platform and costs |
| [`docs/FUNCTION-CHECK.md`](docs/FUNCTION-CHECK.md)       | The recorded acceptance check from technical brief A                        |
| [`docs/BRIEF-A-BENCHMARK.md`](docs/BRIEF-A-BENCHMARK.md) | How the build meets technical brief A, requirement by requirement           |

## Stack

- [Astro 7](https://astro.build): static HTML, no JavaScript beyond small scripts for the purchase flow
- [Tailwind CSS 4](https://tailwindcss.com): design tokens in `src/styles/tokens.css`
- DM Serif Display, Nunito Sans and Caveat, self-hosted via Fontsource (no third-party font requests)
- SEO: canonical URLs, Open Graph/Twitter, JSON-LD (Organization, WebSite, Product/Offer), sitemap, `robots.txt`,
  `noindex` on the purchase flow
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) with static assets, a small API in `worker/` and a
  D1 database for registrations
- [Playwright](https://playwright.dev) acceptance tests in Chrome and Safari (WebKit), desktop and mobile

## Getting started

Requires Node.js `>= 22.23.4` (see `.nvmrc`).

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # type checks (site and Worker) + static build to dist/
npm run preview
npm run test:e2e   # acceptance tests against wrangler dev (run `npx playwright install chromium webkit` once)
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
  content/copy.yaml       All texts, the price and links (edited by Humanize and Suzanna, see docs/EDITING.md)
  content/copy.ts         Loads and validates copy.yaml at build time
  config/site.ts          Fixed section and CTA ids, routes, names and technical settings
  components/sections/    The five sections of the offer page
  components/ui/          Design system components (buttons, headings, cards, avatars)
  components/doodles/     Hand-drawn SVG details (underline, stars, notes)
  components/seo/         Meta tags and JSON-LD
  assets/images/          Character art and photos, see the README there
  layouts/                Base, page and flow layouts
  lib/registration.ts     Submits registrations and update choices to the API
  pages/                  /, /kop/<section>, /kop/uppdatering, /kop/tack, /kop/nej-tack and info pages
  styles/tokens.css       Design tokens (colors, type scale, radii, motion)
worker/index.ts           API that stores registrations in D1 (only /api/* runs it)
scripts/                  Export and deletion of registrations (see docs/ADMIN.md)
tests/                    Acceptance tests for brief A §9
```

Content and behaviour are separated: fixed ids (`sektion_*`, `kop_*`, `uppdatering_*`), routes and logic live in code,
so editing `copy.yaml` cannot change them. An invalid `copy.yaml` fails the build with a message naming the key.

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
| Registration and choice  | Row in `registrations`, with the buy button's `cta_id` and `update_status`             | Cloudflare D1 |

Each buy button leads to its own page, so Cloudflare Web Analytics counts clicks per section without cookies, custom
events or query strings. The beacon is added to every page in production builds (`site.webAnalyticsToken` in
`src/config/site.ts`), and the funnel shows in Cloudflare under Analytics & Logs → Web Analytics → _Top paths_.

Each submission of the purchase form is one row in `registrations` (see [`docs/ADMIN.md`](docs/ADMIN.md)). Its
`update_status` starts as `inget_val` and becomes `ja` or `nej` on the same row. Retries, double clicks and resubmits
reuse the registration id, so they never create duplicates. Internal tests are flagged with `is_test` when the session
starts on a page opened with `?test`. No cookies, IP addresses or user agents are stored.

```sql
-- Funnel by buy button, excluding tests
SELECT cta_id, COUNT(*) AS registrations,
       SUM(update_status = 'ja') AS ja, SUM(update_status = 'nej') AS nej, SUM(update_status = 'inget_val') AS inget_val
FROM registrations WHERE is_test = 0 GROUP BY cta_id;
```

## Deployment

The site runs on Cloudflare Workers, configured in [`wrangler.jsonc`](wrangler.jsonc). Pages are served as static
assets (`kop.html` as `/kop`, unknown paths get `404.html`). Only `/api/*` runs the Worker, which writes registrations
to the D1 database `musikhjaltarna`. The table is created on first use. GitHub Actions type-checks, builds and
format-checks every push and pull request.

Cloudflare settings (Workers Builds):

| Setting                      | Value                  |
| ---------------------------- | ---------------------- |
| Build command                | `npm run build`        |
| Deploy command               | `npx wrangler deploy`  |
| Non-production branch deploy | `npx wrangler preview` |
| Environment variables        | `NODE_VERSION=24`      |

Branch previews use their own D1 database, `musikhjaltarna-preview` (the `previews` block in `wrangler.jsonc`), so
submissions in a preview never reach real registrations. `name` in `wrangler.jsonc` must match the Worker name in
Cloudflare. Test the config locally without logging in with
`npx wrangler deploy --dry-run` after a build.
