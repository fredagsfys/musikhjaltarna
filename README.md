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

| Variabel   | Beskrivning                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| `SITE_URL` | Domän för canonical, sitemap och Open Graph. Standard: `https://musikhjaltarna.se`. |

`npm run dev` visar sajten men har inget mät-API. För att testa hela flödet med mätning lokalt:
`npm run build && npx wrangler dev`, som kör Workern mot en lokal databas.

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

Allt lagras i en egen databas (Cloudflare D1, `musikhjaltarna`) via ett litet API i [`worker/index.ts`](worker/index.ts):
händelser i tabellen `events`, namn och e-post i `leads`. Köpavsikt och uppdateringsintresse sparas som separata rader.
Inga cookies, IP-adresser eller webbläsaruppgifter sparas, och personuppgifter skickas aldrig som händelser.

Resultat läses i Cloudflare under Storage & Databases → D1 → `musikhjaltarna` → Console, eller med
`npx wrangler d1 execute musikhjaltarna --remote --command "<SQL>"` efter `npx wrangler login`:

```sql
-- Klick och köpavsikt per köpknapp
SELECT cta_id, event, COUNT(*) AS antal FROM events
WHERE event IN ('cta_click', 'purchase_intent') GROUP BY cta_id, event ORDER BY cta_id;

-- Hela tratten
SELECT event, COUNT(*) AS antal FROM events GROUP BY event;

-- Leads
SELECT created_at, type, name, email, cta_id FROM leads ORDER BY created_at DESC;
```

## Driftsättning

Sajten driftsätts på Cloudflare Workers, konfigurerat i [`wrangler.jsonc`](wrangler.jsonc). Sidorna serveras som
statiska filer (`kop.html` som `/kop`, okända adresser får `404.html`). Bara `/api/*` körs av Workern, som skriver till
D1-databasen. Databasen skapas automatiskt vid första deployen och tabellerna vid första anropet.

Inställningar i Cloudflare (Workers Builds):

| Inställning                  | Värde                          |
| ---------------------------- | ------------------------------ |
| Build command                | `npm run build`                |
| Deploy command               | `npx wrangler deploy`          |
| Non-production branch deploy | `npx wrangler versions upload` |
| Miljövariabler               | `NODE_VERSION=24`              |

`name` i `wrangler.jsonc` måste vara samma som Workerns namn i Cloudflare. Testa lokalt utan att logga in med
`npx wrangler deploy --dry-run` efter en build.
