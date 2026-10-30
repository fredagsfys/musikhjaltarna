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

`npm run dev` visar sajten utan API. För att testa hela köpflödet med lagring lokalt:
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

| Mätpunkt                | Mäts som                                                                                | Var           |
| ----------------------- | --------------------------------------------------------------------------------------- | ------------- |
| Klick på köpknapp       | Sidvisning av `/kop/hero`, `/kop/hjalpen`, `/kop/vardag`, `/kop/pedagog`, `/kop/avslut` | Web Analytics |
| Köpavsikt (steg 1)      | Sidvisning av `/kop/uppdatering`                                                        | Web Analytics |
| Ja till information     | Sidvisning av `/kop/tack`                                                               | Web Analytics |
| Nej tack                | Sidvisning av `/kop/nej-tack`                                                           | Web Analytics |
| Namn och e-post (leads) | Rad i tabellen `leads`, med köpknappens `cta_id`                                        | Cloudflare D1 |

Varje köpknapp leder till en egen sida, så att Cloudflare Web Analytics kan räkna klick per sektion utan cookies, egna
händelser eller query strings. Mätskriptet läggs in i alla sidor i produktionsbygget (`site.webAnalyticsToken` i
`src/config/site.ts`), och tratten syns i Cloudflare under Analytics & Logs → Web Analytics → _Top paths_.

Namn och e-post sparas av ett litet API i [`worker/index.ts`](worker/index.ts) i D1-databasen `musikhjaltarna`.
Köpavsikt och uppdateringsintresse sparas som separata rader. Inga cookies, IP-adresser eller webbläsaruppgifter sparas.
Leads läses i Cloudflare under Storage & Databases → D1 → `musikhjaltarna` → Console:

En rad med typen `updates_opt_in` markerar bara att e-postadressen vill ha uppdateringar, så namn och köpknapp
lagras en gång, på raden för köpavsikt.

```sql
-- En rad per person, med om personen vill ha uppdateringar (1/0)
SELECT p.created_at, p.name, p.email, p.cta_id,
       EXISTS (SELECT 1 FROM leads o WHERE o.type = 'updates_opt_in' AND o.email = p.email) AS vill_ha_uppdateringar
FROM leads p
WHERE p.type = 'purchase_intent'
ORDER BY p.created_at DESC;

-- Köpavsikt per köpknapp
SELECT cta_id, COUNT(*) AS antal FROM leads WHERE type = 'purchase_intent' GROUP BY cta_id;
```

## Driftsättning

Sajten driftsätts på Cloudflare Workers, konfigurerat i [`wrangler.jsonc`](wrangler.jsonc). Sidorna serveras som
statiska filer (`kop.html` som `/kop`, okända adresser får `404.html`). Bara `/api/*` körs av Workern, som skriver
leads till D1-databasen `musikhjaltarna`. Tabellen skapas vid första anropet.

Inställningar i Cloudflare (Workers Builds):

| Inställning                  | Värde                          |
| ---------------------------- | ------------------------------ |
| Build command                | `npm run build`                |
| Deploy command               | `npx wrangler deploy`          |
| Non-production branch deploy | `npx wrangler versions upload` |
| Miljövariabler               | `NODE_VERSION=24`              |

`name` i `wrangler.jsonc` måste vara samma som Workerns namn i Cloudflare. Testa lokalt utan att logga in med
`npx wrangler deploy --dry-run` efter en build.
