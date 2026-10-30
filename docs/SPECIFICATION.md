# Pianotopia – Landing page (erbjudande-sida) – Specifikation

> Källa: `Landing page MH-1.pdf` (wireframe, © Humanize 2026 med ensamrätt).
> Status: **Arbetsutkast – budskap och struktur före färdig copy.**
> Rubrikerna är arbetsförslag och layouten visar principen. Vi ska enas om budskap, innehåll och ordning.

## Syfte

Sidan är ett **erbjudandetest** (s.k. "fake door"). Den presenterar Pianotopia som en betald
prenumeration för **79 kr/månad** och mäter verklig köpavsikt innan tjänsten finns. Inget köp
genomförs och ingen betalning sker. Efter köpsteget får besökaren veta att tjänsten är under
utveckling och kan välja att hålla sig uppdaterad.

**Erbjudandet:** Ett övningsverktyg i en app där barnet övar roligt, enkelt och självständigt mellan
pianolektionerna. Ett komplement till barnets pianolärare.

**Huvudlöfte:** Barnets framsteg. Bibehållet intresse är en följd av framstegen.

---

## Budskapshierarki

| #   | Sektion              | Koppling till programförklaringen och budskapen                                                                                                                                        |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Löftet och tjänsten  | Barnet kommer vidare mellan lektionerna. Kort konkretisering av appen och erbjudandet för 79 kr/månad. Bibehållet intresse ligger nära som önskad följd.                               |
| 2   | Konkretisera hjälpen | Visar hur roliga och enkla pedagogiska övningar stödjer barnet att komma igång, öva självständigt och göra framsteg på sina villkor.                                                   |
| 3   | Värdet i vardagen    | Samlar familjens förutsättningar: korta övningsstunder, föräldern behöver inte kunna spela och ska inte behöva driva på hela tiden. Här hör också tryggheten i att kunna stötta hemma. |
| 4   | Bygg förtroende      | Förankrar hjälpen i Suzannas kompetens, kulturskolans mål och mening samt rollen som komplement till lärarledd undervisning.                                                           |
| 5   | Samla erbjudandet    | Samlar vad kunden får, priset och praktiska förutsättningar inför köpbeslutet.                                                                                                         |

---

## Del A – Erbjudande-sidan (`/`)

Samtliga köpknappar har texten **"Köp · 79 kr/månad"** och leder till **samma köpsteg** (`/kop`).
Varje knapp har ett eget CTA-ID så att det går att mäta vilken sektion som konverterar.

### Sektion 1 – Hero: Löftet och tjänsten

**Layout:** Två kolumner. Text till vänster, bild till höger.

| Element             | Innehåll                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Varumärke           | `P I A N O T O P I A` (spärrad text)                                                                  |
| Rubrik (H1)         | Hjälpen mellan lektionerna som gör att barnet kommer vidare.                                          |
| Ingress             | Ett övningsverktyg i en app där barnet övar roligt, enkelt och självständigt mellan pianolektionerna. |
| Pris                | 79 kr/månad                                                                                           |
| CTA                 | Köp · 79 kr/månad, **CTA-ID: `kop_hero`**                                                             |
| Bild (platshållare) | Barnet använder appen vid pianot                                                                      |
| Bildtext            | Ett komplement till barnets pianolärare                                                               |

**Anteckningar:**

- Barnets framsteg är huvudlöftet.
- Förklara direkt vad tjänsten är.
- Bibehållet intresse är en följd av framstegen.

### Sektion 2 – Konkretisera hjälpen

**Layout:** Tre steg i rad med pilar emellan till vänster. Exempelbild till höger.

| Element                 | Innehåll                                     |
| ----------------------- | -------------------------------------------- |
| Rubrik (H2)             | Så fungerar övningen                         |
| Steg 1 (bild + etikett) | Kom igång                                    |
| Steg 2 (bild + etikett) | Öva självständigt                            |
| Steg 3 (bild + etikett) | Kom vidare                                   |
| Brödtext                | _Lorem ipsum (platshållare)_                 |
| Bild (platshållare)     | Exempel på övning i appen                    |
| CTA                     | Köp · 79 kr/månad, **CTA-ID: `kop_hjalpen`** |

**Anteckningar:**

- Visa hur barnet använder verktyget hemma.
- Innehåll och exempel preciseras före produktion.

### Sektion 3 – Värdet i vardagen

**Layout:** Tre runda ikoner med etiketter i rad. Brödtext och CTA under.

| Element         | Innehåll                                    |
| --------------- | ------------------------------------------- |
| Rubrik (H2)     | Framsteg som ryms i vardagen                |
| Fördel 1 (ikon) | Roligt och enkelt att öva                   |
| Fördel 2 (ikon) | Kräver lite tid                             |
| Fördel 3 (ikon) | Föräldern behöver inte kunna spela          |
| Brödtext        | _Lorem ipsum (platshållare)_                |
| CTA             | Köp · 79 kr/månad, **CTA-ID: `kop_vardag`** |

**Anteckningar:**

- Knyt självständig övning till framsteg och bibehållet intresse.
- Visa hur hjälpen passar ett fullt vardagsschema.

### Sektion 4 – Bygg förtroende

**Layout:** Porträtt till vänster med bildtext. Text, länk och CTA till höger.

| Element                 | Innehåll                                     |
| ----------------------- | -------------------------------------------- |
| Rubrik (H2)             | Pedagogen bakom tjänsten                     |
| Porträtt (platshållare) | Suzanna, pianopedagog                        |
| Brödtext                | _Lorem ipsum (platshållare)_                 |
| Länk                    | Läs mer om Pianotopia                        |
| CTA                     | Köp · 79 kr/månad, **CTA-ID: `kop_pedagog`** |

**Anteckningar:**

- Pianotopia är avsändaren. Suzanna står bakom den pedagogiska grunden.
- Kunden köper en prenumeration på tjänsten.

### Sektion 5 – Samla erbjudandet

**Layout:** Rubrik, beskrivning och pris överst. Tre informationsrutor i rad. CTA under. Sidfot sist.

| Element     | Innehåll                                                  |
| ----------- | --------------------------------------------------------- |
| Rubrik (H2) | Din prenumeration                                         |
| Beskrivning | Övningsverktyg i appen för hjälp mellan pianolektionerna. |
| Pris        | 79 kr/månad                                               |
| Ruta 1      | Vad som ingår                                             |
| Ruta 2      | Praktiska förutsättningar                                 |
| Ruta 3      | Abonnemangsvillkor                                        |
| CTA         | Köp · 79 kr/månad, **CTA-ID: `kop_avslut`**               |
| Sidfot      | Pianotopia · Kontakt · Villkor · Integritet               |

**Anteckningar:**

- Bekräfta innehåll och pris.
- Besvara kvarvarande frågor.
- Samtliga köpknappar leder till samma köpsteg.

---

## Del B – Köpflödet

Köpflödet ska inte indexeras av sökmotorer (`noindex`).

### Steg 1 – Fånga fördjupad köpavsikt (`/kop`)

| Element       | Innehåll                                  |
| ------------- | ----------------------------------------- |
| Varumärke     | PIANOTOPIA                                |
| Rubrik        | Hjälpen mellan pianolektionerna           |
| Underrubrik   | Prenumeration på övningsverktyget i appen |
| Pris          | 79 kr/månad                               |
| Fält          | Namn, E-post                              |
| Primär knapp  | Gå vidare till betalning                  |
| Sekundär länk | Tillbaka till erbjudandet                 |

**Anteckningar:**

- Bekräfta samma erbjudande och pris.
- Be endast om namn och e-post.
- Registrera när uppgifterna skickas in.

**Mätpunkt:** `köpintention` (event: `purchase_intent`). Registreras med CTA-ID för den knapp som ledde hit.

### Steg 2 – Förklara och erbjud nästa steg (`/kop/uppdatering`)

| Element       | Innehåll                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Rubrik        | Pianotopia är ännu inte redo för leverans                                                         |
| Text          | Tjänsten är under utveckling. Inget köp har genomförts och ingen betalning har skett.             |
| Rubrik        | Vill du hålla dig uppdaterad?                                                                     |
| Text          | Det kan handla om early bird-erbjudande. Eller att bli inbjuden att testa tidigt innan lansering. |
| Primär knapp  | Ja, jag vill hållas uppdaterad                                                                    |
| Sekundär länk | Nej tack                                                                                          |

**Anteckningar:**

- Visa beskedet direkt efter köpsteget.
- Kräver ett separat aktivt val.

**Mätpunkt:** `ja till information` (event: `updates_opt_in`).

### Steg 3 – Gör fortsättningen tydlig (`/kop/tack`, `/kop/nej-tack`)

| Element | Innehåll                                                   |
| ------- | ---------------------------------------------------------- |
| Rubrik  | Tack för ditt intresse!                                    |
| Text    | Vi skickar mer information till den e-postadress du angav. |

**Anteckningar:**

- Bekräfta vad personen har valt och vad som händer härnäst.
- Köpavsikt och uppdateringsintresse redovisas var för sig.

---

## Mätplan

| Event             | När                                       | Data                      |
| ----------------- | ----------------------------------------- | ------------------------- |
| `cta_click`       | Klick på någon köpknapp                   | `cta_id`                  |
| `purchase_intent` | Steg 1 skickas in                         | `cta_id`, `name`, `email` |
| `updates_opt_in`  | "Ja, jag vill hållas uppdaterad" i steg 2 | `email`                   |
| `updates_decline` | "Nej tack" i steg 2                       | –                         |

Köpavsikt (`purchase_intent`) och uppdateringsintresse (`updates_opt_in`) lagras och redovisas var för sig.

---

## Öppna frågor

1. ~~**"Nej tack" i steg 2.**~~ Löst i designfilen (variant D): leder till en egen bekräftelse, `/kop/nej-tack`.
2. **Samtycke och GDPR.** Namn och e-post samlas in i steg 1, innan besökaren får veta att tjänsten inte finns. Vi behöver bestämma rättslig grund, informationstext och hur länge uppgifterna sparas. Uppgifter från dem som säger "Nej tack" bör troligen raderas.
3. **Lagring av leads.** Vilket verktyg tar emot formulärdata (t.ex. egen endpoint, Formspree, HubSpot, Brevo)?
4. **Analysverktyg.** Vilket verktyg ska användas (t.ex. Plausible, GA4, PostHog)?
5. **Domän.** Slutlig domän för canonical-URL:er och sitemap.
6. **Undersidor.** Kontakt, Villkor, Integritet och "Om Pianotopia" behöver innehåll.
