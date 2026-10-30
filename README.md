# Pianotopia – Landing page

Erbjudande-sida och köpflöde för att testa köpavsikt för Pianotopia, ett övningsverktyg i en app där barnet övar
roligt, enkelt och självständigt mellan pianolektionerna.

Sidan följer wireframen _Landing page MH-1_. Se [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) för budskap,
struktur, CTA-ID:n och mätplan. Designen är _Variant D, dov turkos_, se [`landing-page-design-requirements.md`](landing-page-design-requirements.md). All copy
markerad med _Lorem ipsum_ och alla bilder är platshållare.

## Stack

- [Astro 7](https://astro.build): statisk HTML, inget JavaScript utöver små skript för köpflödet och mätning
- [Tailwind CSS 4](https://tailwindcss.com): designtokens i `src/styles/global.css`
- DM Serif Display, Nunito Sans och Caveat, självhostade via Fontsource (inga externa anrop)
- SEO: canonical-URL:er, Open Graph/Twitter, JSON-LD (Organization, WebSite, Product/Offer), sitemap, `robots.txt`,
  `noindex` på köpflödet

## Kom igång

Kräver Node.js `>= 22.23.4` (se `.nvmrc`).

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # typkontroll + statisk build till dist/
npm run preview
```

Kopiera `.env.example` till `.env` och fyll i:

| Variabel               | Beskrivning                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `SITE_URL`             | Slutlig domän. Används för canonical, sitemap och Open Graph.                                |
| `PUBLIC_LEAD_ENDPOINT` | Tar emot formulärdata som JSON (POST). Om den saknas loggas inskicken i webbläsarens konsol. |

## Struktur

```
src/
  config/site.ts          Namn, pris, CTA-ID:n och rutter
  components/sections/    De fem sektionerna på erbjudande-sidan
  components/ui/          Designsystemets komponenter (knappar, rubriker, maskot, märken)
  components/doodles/     Handritade SVG-detaljer (understrykning, stjärnor, noter)
  assets/images/          Karaktärsbilder och foton, se README där
  components/seo/         Meta-taggar och JSON-LD
  layouts/                Base-, Page- och Flow-layout
  lib/analytics.ts        Händelser till dataLayer/Plausible
  lib/lead.ts             Lagring och inskick av köpavsikt och opt-in
  pages/                  /, /kop, /kop/uppdatering, /kop/tack och informationssidor
```

## Bilder

Lägg bilderna i `src/assets/images/` med namnen i [`src/assets/images/README.md`](src/assets/images/README.md).
Komponenterna hittar dem automatiskt och Astro skapar AVIF/WebP i rätt storlekar. Tills dess visas platshållare.

## Mätning

| Event             | När                              |
| ----------------- | -------------------------------- |
| `cta_click`       | Klick på köpknapp (`cta_id`)     |
| `purchase_intent` | Steg 1 skickas in (`cta_id`)     |
| `updates_opt_in`  | "Ja, jag vill hållas uppdaterad" |
| `updates_decline` | "Nej tack"                       |

Händelserna skickas till `window.dataLayer` och till Plausible om det är installerat. Personuppgifter skickas aldrig
till analysverktyget, bara till `PUBLIC_LEAD_ENDPOINT`.

## Driftsättning

Sajten driftsätts som statiska filer på Cloudflare Workers, konfigurerat i [`wrangler.jsonc`](wrangler.jsonc).
Ingen Worker-kod behövs. Sidorna byggs som `kop.html` och serveras som `/kop`, och okända adresser får `404.html`.

Inställningar i Cloudflare (Workers Builds):

| Inställning                  | Värde                                                 |
| ---------------------------- | ----------------------------------------------------- |
| Build command                | `npm run build`                                       |
| Deploy command               | `npx wrangler deploy`                                 |
| Non-production branch deploy | `npx wrangler versions upload`                        |
| Miljövariabler               | `NODE_VERSION=24`, `SITE_URL`, `PUBLIC_LEAD_ENDPOINT` |

`name` i `wrangler.jsonc` måste vara samma som Workerns namn i Cloudflare. Testa lokalt utan att logga in med
`npx wrangler deploy --dry-run` efter en build.
