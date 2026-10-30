# Landing Page Design Requirements: Pianotopia · Musikhjältarna, "Variant D: Dov turkos"

> Design spec for implementing the Musikhjältarna landing page with Claude Code (Astro).
> Sources of truth:
> 1. **Stilguide, variant D** (colors and typography in sections 2.1 and 2.2 are exact values from the style guide).
> 2. The mobile hero screenshot of "Variant D, dov turkos" (layout, sizes and composition in section 3 are measured from the screenshot; adjust visually against it).

**Core principle (from the style guide):** dov turkos for buttons and accents, honungsguld for details and hand-drawn elements. All backgrounds are white or cream white. The strong colors come from the images (the mascots), never from the UI.

---

## 1. Product and tone

**Product:** Musikhjältarna by Pianotopia, a practice app where children practise piano fun, simply and independently *between* their piano lessons. It is positioned as a complement to the child's piano teacher, not a replacement.

**Audience:** Parents of children who take piano lessons (the buyer). Children are the end users and are represented through the mascots.

**Design personality**
- Warm, calm and trustworthy for parents: editorial serif headlines, generous whitespace, cream paper background.
- Playful for kids: 3D superhero mascots, hand-drawn doodles (sun rays, squiggle underline, curved arrow), handwritten speech notes.
- Premium but friendly: muted palette (dusky teal + honey gold), no gradients, no neon, no saturated colors in the UI chrome.

**Rule of thumb:** the UI is calm and grown-up; the illustrations bring the fun.

---

## 2. Design tokens

### 2.1 Colors (exact, from the style guide)

| Token | Swedish name | Hex | Usage |
|---|---|---|---|
| `--color-primary` | Dov turkos | `#3B7F80` | Buy buttons, main accent (e.g. accent words in headlines) |
| `--color-primary-dark` | Mörk turkos | `#2B6061` | Links, small turquoise text, CTA hover/pressed state |
| `--color-gold` | Honungsguld | `#D9A441` | Details, rings, stars, doodles (squiggles, rays, arrows) |
| `--color-gold-light` | Ljust guld | `#E9CF8E` | Borders on price boxes and icon tiles |
| `--color-gold-dark` | Mörkt guld | `#A97A1F` | Checkmarks and small icons |
| `--color-gold-brown` | Guldbrun | `#8C6416` | Small headings (eyebrows), handwritten text |
| `--color-ink` | Bläck | `#1E2A2B` | Headings and dark text |
| `--color-text` | Grå text | `#4F5A5B` | Body text |
| `--color-bg` | Krämvit | `#FDFAF4` | Page background, cards |
| `--color-white` | Vit | `#FFFFFF` | Sections, cards, button text |
| `--color-border` | Sandkant | `#EDE3CF` | Thin frames and divider lines |
| `--color-cream-warm` | Varm kräm | `#F6EEDC` | The arch behind Gilbert, image backgrounds |

```css
:root {
  --color-primary: #3B7F80;
  --color-primary-dark: #2B6061;
  --color-gold: #D9A441;
  --color-gold-light: #E9CF8E;
  --color-gold-dark: #A97A1F;
  --color-gold-brown: #8C6416;
  --color-ink: #1E2A2B;
  --color-text: #4F5A5B;
  --color-bg: #FDFAF4;
  --color-white: #FFFFFF;
  --color-border: #EDE3CF;
  --color-cream-warm: #F6EEDC;

  --shadow-card: 0 8px 24px rgba(30, 42, 43, 0.08);
}
```

**Contrast rules (WCAG)**

| Combination | Ratio (approx.) | Allowed for |
|---|---|---|
| White on Dov turkos `#3B7F80` | 4.6:1 | Button text (AA) |
| Dov turkos on Krämvit | 4.4:1 | **Large text only** (headline accents ≥ 24px) |
| Mörk turkos `#2B6061` on Krämvit | 6.5:1 | Links and small turquoise text |
| Grå text `#4F5A5B` on Krämvit | 6.9:1 | Body text |
| Guldbrun `#8C6416` on Krämvit | 5.1:1 | Eyebrows, handwritten text |
| Mörkt guld `#A97A1F` on Krämvit | 3.7:1 | Icons and checkmarks only, **not text** |
| Honungsguld / Ljust guld | below 3:1 | **Decorative only** (doodles, rings, borders) |

### 2.2 Typography (from the style guide)

All three fonts are free on Google Fonts. Self-host them in Astro (e.g. `@fontsource/dm-serif-display`, `@fontsource-variable/nunito-sans`, `@fontsource/caveat`) or use Astro's font API, with `font-display: swap`. Swedish characters (å, ä, ö) must render correctly.

| Role | Font | Weight | Notes |
|---|---|---|---|
| Headings | **DM Serif Display** | 400 (regular) | It only comes in 400; never fake-bold it (`font-synthesis: none`). Line height 1.05 to 1.1 |
| Body / UI | **Nunito Sans** | 400, 700, 800 | Body 400, buttons and eyebrows 800 |
| Handwriting | **Caveat** | 700 | Handwritten comments only, used sparingly, slightly rotated |

**Type scale (fluid, mobile → desktop)**

| Token | Font | Size | Weight | Line height | Other |
|---|---|---|---|---|---|
| `--text-h1` | DM Serif Display | 44 to 76px: `clamp(2.75rem, 1.8rem + 4.2vw, 4.75rem)` | 400 | 1.05 | letter-spacing -0.01em, color Bläck |
| `--text-h2` | DM Serif Display | 34 to 52px: `clamp(2.125rem, 1.6rem + 2.4vw, 3.25rem)` | 400 | 1.1 | color Bläck |
| `--text-h3` | DM Serif Display | 24 to 26px: `clamp(1.5rem, 1.45rem + 0.3vw, 1.625rem)` | 400 | 1.1 | color Bläck |
| `--text-lead` | Nunito Sans | 19 to 22px: `clamp(1.1875rem, 1.1rem + 0.5vw, 1.375rem)` | 400 | 1.6 | Hero intro only (measured from screenshot), color Grå text |
| `--text-body` | Nunito Sans | 17 to 18px: `clamp(1.0625rem, 1rem + 0.2vw, 1.125rem)` | 400 | 1.6 | color Grå text |
| `--text-button` | Nunito Sans | 19px (`1.1875rem`) | 800 | 1 | color Vit |
| `--text-eyebrow` | Nunito Sans | 15px (`0.9375rem`) | 800 | 1.3 | UPPERCASE, letter-spacing 0.08em, color Guldbrun |
| `--text-hand` | Caveat | 24 to 26px: `clamp(1.5rem, 1.45rem + 0.3vw, 1.625rem)` | 700 | 1.1 | color Guldbrun, rotate -3° to -6° |

**Eyebrow pattern:** small uppercase label above section headings, e.g. `PIANOTOPIA · MUSIKHJÄLTARNA`, with the parts separated by a middle dot (`·`).

### 2.3 Spacing, radius, layout

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96 px.
- Page horizontal padding: 24px on mobile, 32px on tablet, max content width 1200px on desktop.
- Vertical rhythm in the hero: headline → 32px → lead → 40px → CTA → 24px → trust line → 64px → illustration.
- Radius: `--radius-pill: 999px` (buttons), `--radius-card: 20px` (cards and badges), `--radius-tile: 12px` (icon tiles), `--radius-arch: 999px 999px 0 0` (arch top).
- Cards: background Vit or Krämvit, 1px border Sandkant, radius 20px.

> The style guide continues with a "Former och detaljer" (shapes and details) section that is not yet captured here. Values in 2.3 are measured from the screenshot until that section is added.

---

## 3. Hero section

### 3.1 Content (Swedish, use verbatim)

- **H1:** "Hjälpen mellan lektionerna som gör att barnet **kommer vidare.**"
  The last two words "kommer vidare." are the accent.
- **Lead:** "Musikhjältarna är ett övningsverktyg i en app där barnet övar roligt, enkelt och självständigt mellan pianolektionerna."
- **CTA:** "Köp · 79 kr/månad" followed by a right arrow icon.
- **Trust line:** checkmark + "Ett komplement till barnets pianolärare"
- **Mascot speech note:** "Hej! Jag är Gilbert G-klav"
- **Floating badge:** title "Nivå 2 klar!", subtitle "Veckans övning"

### 3.2 Headline

- Left aligned, `--text-h1`, DM Serif Display 400, color Bläck.
- The accent phrase "kommer vidare." is Dov turkos (large text, so contrast is fine).
- Under the accent phrase: a **hand-drawn squiggle underline** in Honungsguld.
  - Inline SVG path (slightly wavy and uneven, as if drawn with a marker), stroke 4 to 5px, `stroke-linecap: round`, no fill.
  - Spans the full width of the accent phrase and extends a few px past both ends.
  - Positioned absolutely under the text (wrap the accent in `<span class="accent">` with `position: relative`) so it follows the text when it wraps.
  - `aria-hidden="true"`.

### 3.3 Lead paragraph

- `--text-lead`, Grå text, max width ~34ch on desktop.

### 3.4 Primary CTA button

- Pill shape, background Dov turkos, text Vit, `--text-button` (Nunito Sans 19px / 800).
- Content: label, middle dot (`·`), price, then an arrow icon (→, 24px, 2px stroke) with ~16px gap.
- Height ~60px on mobile (min 56px), horizontal padding ~32px. **Not full width**: it sizes to its content.
- States:
  - Hover: background Mörk turkos, arrow nudges 4px right (200ms ease-out).
  - Active: scale 0.98.
  - Focus visible: 3px outline in Mörkt guld with 3px offset.
- Flat. No shadow, no gradient.

### 3.5 Trust line

- Checkmark icon (stroke tick, ~22px, 2.5px stroke) in Mörkt guld, 16px gap to text.
- Text: Nunito Sans 17 to 18px, weight 700, color Bläck.
- Reusable as a `<ul>` of several trust points further down the page.

### 3.6 Hero illustration composition

Layered, from back to front:

1. **Arch:** tall arch (rounded top, straight sides), fill Varm kräm, thin 2px outline in Ljust guld. Width ~85% of the column, centered.
2. **Sun rays:** 7 to 9 short hand-drawn strokes radiating above the arch, slightly irregular in length and angle. Inline SVG, Honungsguld, ~4px stroke, round caps.
3. **Mascot:** Gilbert G-klav (frog superhero, red mask, blue suit with "MH" emblem, red cape) as a transparent WebP/AVIF, centered in front of the arch, overlapping the top of the outline.
4. **Handwritten speech note:** "Hej! Jag är Gilbert G-klav", `--text-hand` (Caveat 700, Guldbrun), rotated -4° to -6°, top right of the mascot.
5. **Doodle arrow:** hand-drawn curved arrow from the speech note to the mascot's head. SVG, Guldbrun, ~3px stroke, round caps, open arrowhead.
6. **Floating achievement badge** (lower left, overlapping arch and mascot):
   - Card: Vit, radius 20px, 1px border Sandkant, `--shadow-card`, padding 16 to 20px.
   - Left: icon tile 56 to 64px, radius 12px, 2px border Ljust guld, star icon filled Honungsguld.
   - Right: title "Nivå 2 klar!" (Nunito Sans 800, Bläck), subtitle "Veckans övning" (Nunito Sans 400, Grå text).
   - Visual only, not a button.
7. **Decorative star:** small outlined 5-point star in Honungsguld, lower right of the arch.
8. **Secondary character avatar:** circle image (~120 to 140px) with a 4 to 6px Honungsguld ring, bottom right, partly cropped by the arch or viewport edge. Shows another mascot (girl with music notes), hinting at a cast of characters.

Illustration rules:
- All doodles share one hand-drawn, marker-like style: round caps, slightly imperfect curves, consistent stroke widths.
- Decorative elements are `aria-hidden="true"`. The mascot has a meaningful `alt`, e.g. `alt="Gilbert G-klav, Musikhjältarnas grodhjälte"`.
- Elements may bleed off the right edge on mobile, but the page must never scroll horizontally (`overflow-x: clip` on the hero).

### 3.7 Responsive behaviour

- **Mobile (<768px):** single column exactly as in the screenshot: text first, illustration below.
- **Tablet (768 to 1023px):** single column, larger type, illustration max width ~560px, centered.
- **Desktop (≥1024px):** two columns (≈ 55/45). Text left, vertically centered; illustration right, top aligned with the headline. Hero `min-height: 85svh`.

---

## 4. Motion

Subtle and optional. Everything is disabled under `prefers-reduced-motion: reduce`.

- Squiggle underline draws itself on load (`stroke-dasharray` / `stroke-dashoffset`, 700ms ease-out, 300ms delay).
- Sun rays fade and scale in with a small stagger (40ms per ray).
- Floating badge idles slowly (translateY ±4px, 4s ease-in-out, infinite).
- Mascot pops in once (scale 0.95 → 1, opacity 0 → 1, 500ms).
- No parallax, no scroll-jacking, no autoplaying sound.

---

## 5. Components (reusable for the rest of the page)

| Component | Description |
|---|---|
| `Button` | Variants: `primary` (Dov turkos pill, white text), `secondary` (transparent, 2px Dov turkos border, Mörk turkos text), `link` (Mörk turkos text + arrow). |
| `Eyebrow` | Uppercase Nunito Sans 15px / 800, letter-spacing 0.08em, Guldbrun. |
| `AccentHeading` | DM Serif Display heading where one phrase is Dov turkos with the Honungsguld squiggle underline. Max once per section. |
| `TrustList` | Mörkt guld checkmark + Bläck text rows. |
| `Card` | Vit or Krämvit, 1px Sandkant border, radius 20px. |
| `PriceBox` | Card variant with 2px Ljust guld border. |
| `AchievementBadge` | White floating card with Ljust guld icon tile, title and subtitle. |
| `MascotStage` | Arch + rays + mascot + optional speech note and arrow. Accepts any character image. |
| `CharacterAvatar` | Circle image with Honungsguld ring. |
| `Doodle` | SVG set: squiggle, rays, curved arrow, star, sparkle. Colored via `currentColor`. |
| `SpeechNote` | Rotated Caveat text in Guldbrun. |

Suggested sections below the hero (confirm with content): how it works (3 steps), meet the heroes (character avatars), for parents / for teachers, pricing (79 kr/månad), FAQ, final CTA. Backgrounds alternate only between Krämvit and Vit, separated by whitespace or a 1px Sandkant line; Varm kräm is reserved for image backgrounds and the arch.

---

## 6. Implementation notes for Claude Code (Astro)

- Static output (`output: 'static'`), deployed to Cloudflare Workers static assets. No server adapter needed.
- Mobile first: build and verify at 390px, then 768px and 1280px.
- All tokens live in one global stylesheet (`src/styles/tokens.css`) as CSS custom properties, or in the Tailwind theme if Tailwind is used, mapped 1:1 to section 2. No hard-coded hex values in components.
- Doodles are inline SVG Astro components, not raster images.
- Mascot images go through `astro:assets` (`<Image />` / `<Picture />`) for WebP/AVIF, explicit width/height to avoid layout shift. The hero mascot uses `loading="eager"` and `fetchpriority="high"`; everything else is lazy loaded.
- Semantic structure: one `<h1>`, the CTA is a real `<a>`, trust points are a `<ul>`.
- `lang="sv"` on `<html>`. Prices follow Swedish formatting ("79 kr/månad").
- Performance targets: LCP < 2.5s on mid-range mobile, CLS < 0.05, preload only the H1 font and Nunito Sans.

---

## 7. Do and don't

**Do**
- Keep all backgrounds Krämvit or Vit, with lots of whitespace around headline and CTA.
- Let the mascots be the only saturated color on screen.
- Use Dov turkos for the single most important action and one accent phrase per section.
- Keep all doodles in Honungsguld with consistent strokes.

**Don't**
- Use colored or dark section backgrounds, gradients, glassmorphism or heavy shadows.
- Use pure black text or bold/synthesized DM Serif Display.
- Use Honungsguld, Ljust guld or Mörkt guld for text.
- Make the CTA full width on mobile or center-align the hero text.
- Use Caveat for anything longer than a short phrase.

---

## 8. Acceptance criteria

- [ ] At 390px width, the hero matches the reference screenshot in hierarchy, colors, spacing and composition.
- [ ] Every color in the build is one of the 12 tokens in section 2.1.
- [ ] Fonts are DM Serif Display 400, Nunito Sans 400/700/800 and Caveat 700, self-hosted.
- [ ] The squiggle underline follows the accent phrase when the text wraps differently.
- [ ] All text meets the contrast rules in 2.1; the CTA has visible hover, active and focus states.
- [ ] No horizontal scroll at any width from 320px to 1920px.
- [ ] All motion is disabled under `prefers-reduced-motion`.
- [ ] Lighthouse mobile: Accessibility ≥ 95, Performance ≥ 90.
