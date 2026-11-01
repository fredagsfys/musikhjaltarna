# Benchmark: Brief A – Teknisk produktionsbrief

How much of _Pianotopia Musikhjältarna – A. Teknisk produktionsbrief_ the current build fulfils.

- **Assessed:** 2026-11-01, against `main` at `83c13f7`, plus the live site at https://musikhjaltarna.se.
- **Method:** every requirement in the brief is checked against the code. Behaviour marked "tested" was run in headless
  Chrome against `wrangler dev` with a local D1, or against the live site.
- **Scoring:** ✅ fulfilled = 1, 🟡 partly = ½, ❌ missing = 0.
- The brief itself (PDF) is not committed; it is client material.

## Summary

**Overall: 58.5 of 92 points, about 64%.** 41 ✅, 35 🟡, 16 ❌.

| Section of the brief              |  Items |     ✅ |     🟡 |     ❌ |    Score |       % |
| --------------------------------- | -----: | -----: | -----: | -----: | -------: | ------: |
| 1. What to build                  |      6 |      4 |      1 |      1 |      4.5 |     75% |
| 2. Visitor flow                   |      8 |      3 |      3 |      2 |      4.5 |     56% |
| 3. Offer page structure           |      9 |      6 |      2 |      1 |      7.0 |     78% |
| 4. Purchase step                  |     15 |      6 |      7 |      2 |      9.5 |     63% |
| 5. Status and update choice       |     14 |      8 |      3 |      3 |      9.5 |     68% |
| 6. Confirmation and ending        |      4 |      3 |      1 |      0 |      3.5 |     88% |
| 7. Stored data                    |     12 |      3 |      6 |      3 |      6.0 |     50% |
| 8. Editing and technical function |      8 |      4 |      3 |      1 |      5.5 |     69% |
| 9. Delivery and acceptance        |     16 |      4 |      9 |      3 |      8.5 |     53% |
| **Total**                         | **92** | **41** | **35** | **16** | **58.5** | **64%** |

**In short:** the page, the design, the flow's pages and copy, the CTA ids and the hosting are in place and live. The
biggest gaps are in **how registrations are stored**:

- The brief wants **one registration per submission** with an update status (`inget_val` / `ja` / `nej`), a choice
  time, an information version and a test flag. Today an opt-in is a separate row, "nej" is not stored at all, and
  "no choice" cannot be told apart from "nej".
- **Failed saves are not handled.** The visitor moves on even if storing failed, with no error and no retry.
- **Fixed ids are missing.** The section ids `sektion_*` and the element ids (`kop_namn`, `uppdatering_ja`, …) are not
  in the markup.
- **Content can't be edited without a developer.** Humanize and Suzanna have no way to change copy, images or links
  without one.

## 1. What to build

| Requirement                                                    | Status | Evidence                                                          | Gap                                                               |
| -------------------------------------------------------------- | :----: | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Offer page: five sections in fixed order, one buy button each  |   ✅   | `src/pages/index.astro`, `src/components/sections/*`              | –                                                                 |
| Purchase step: offer summary and form for name and e-mail      |   ✅   | `src/pages/kop/[...cta].astro`                                    | –                                                                 |
| Status and update choice (yes/no)                              |   ✅   | `src/pages/kop/uppdatering.astro`                                 | Storing the choice: see §5 and §7                                 |
| Confirmation after yes, simple ending after no                 |   ✅   | `src/pages/kop/tack.astro`, `src/pages/kop/nej-tack.astro`        | –                                                                 |
| Secure storage, access and export of registrations and choices |   🟡   | D1 database `musikhjaltarna` via `worker/index.ts`                | No CSV export; "nej" not stored                                   |
| Text, images and links editable after delivery                 |   ❌   | Copy lives in `.astro` components; images in `src/assets/images/` | Needs a developer and a deploy; no editor-friendly content source |

## 2. Visitor flow

| Requirement                                                                      | Status | Evidence                                                 | Gap                                                                               |
| -------------------------------------------------------------------------------- | :----: | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Buy button opens the purchase step in the same tab                               |   ✅   | Plain links to `/kop/<section>`                          | –                                                                                 |
| Back from the purchase step shows the offer page at the previous scroll position |   🟡   | The browser back button restores scroll                  | The "Tillbaka till erbjudandet" link goes to `/` (top), not the previous position |
| Valid form: data saved, then status shown                                        |   🟡   | Tested: lead stored, then `/kop/uppdatering`             | Step 2 is shown even when saving fails (`catch` → continue)                       |
| Invalid data: error shown, input kept                                            |   ✅   | Tested: empty submit shows the error, inputs keep values | –                                                                                 |
| Yes: choice saved on the **same registration**, then confirmation                |   🟡   | Opt-in stored and confirmation shown                     | Stored as a separate row linked only by e-mail, not on the same registration      |
| No: "nej" saved, simple ending shown                                             |   ❌   | Ending shown (`/kop/nej-tack`)                           | "nej" is not stored at all                                                        |
| Leaving without choosing keeps status "inget val"                                |   ❌   | –                                                        | No status field; "no choice" and "nej" look identical                             |
| Each step technically identifiable and works with the back button                |   ✅   | Each step is its own URL                                 | –                                                                                 |

## 3. Offer page structure

| Requirement                                                                                                       | Status | Evidence                                                                | Gap                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | :----: | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Fixed section ids `sektion_hero`, `sektion_hjalpen`, `sektion_vardag`, `sektion_pedagog`, `sektion_prenumeration` |   ❌   | Current ids: `hero`, `sa-fungerar-det`, `vardagen`, `pedagogen`, `pris` | Rename (and update the header's anchor links)                                        |
| Buy button ids `kop_hero`, `kop_hjalpen`, `kop_vardag`, `kop_pedagog`, `kop_avslut`                               |   ✅   | `data-cta-id` on every button, verified on the live page                | –                                                                                    |
| All buy buttons lead to the same purchase step with the same visible text                                         |   ✅   | Same step rendered under `/kop/<section>`; text "Köp · 79 kr/månad"     | –                                                                                    |
| Which buy button was used follows to the purchase step                                                            |   ✅   | Path per button; `cta_id` stored with the lead (tested)                 | –                                                                                    |
| Price and period per the editorial material                                                                       |   ✅   | Single source `site.offer` in `src/config/site.ts`                      | –                                                                                    |
| Same section order on mobile and desktop                                                                          |   ✅   | Single-column flow, same DOM order                                      | –                                                                                    |
| Text and images fit the screen without horizontal scroll                                                          |   ✅   | Checked at 320, 390, 768, 1024 and 1280 px                              | –                                                                                    |
| Footer: Pianotopia as sender, contact route, links to terms and privacy                                           |   🟡   | `src/components/SiteFooter.astro`                                       | Contact, terms and privacy pages hold placeholder text                               |
| Links to Pianotopia's regular website, same tab, per wireframe                                                    |   🟡   | "Läs mer om Pianotopia" and the footer link exist                       | They go to an internal placeholder page (`/om-pianotopia`), not Pianotopia's website |

## 4. Purchase step

| Element / requirement                                                       | Status | Evidence                                                                                 | Gap                                            |
| --------------------------------------------------------------------------- | :----: | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `kop_sammanfattning`: summary of the service and 79 kr/månad                |   🟡   | Summary and price box present                                                            | Fixed id missing                               |
| `kop_namn`: required full-name field                                        |   🟡   | `name="name"`, required, validated                                                       | Fixed id missing                               |
| `kop_epost`: required e-mail field                                          |   🟡   | `name="email"`, `type="email"`, validated                                                | Fixed id missing                               |
| `kop_skicka`: "Gå vidare till betalning"                                    |   🟡   | Submit button with that text                                                             | Fixed id missing                               |
| `kop_tillbaka`: back to the offer page                                      |   🟡   | Link present                                                                             | Fixed id missing; goes to top of page (see §2) |
| `kop_integritet`: personal-data info and link to the privacy text           |   ❌   | –                                                                                        | Not in the form                                |
| Visible labels above the fields                                             |   ✅   | `<label>` above each input                                                               | –                                              |
| Autofill and e-mail keyboard on mobile                                      |   ✅   | `autocomplete="name"/"email"`, `inputmode="email"`                                       | –                                              |
| Accept names with Swedish characters, spaces and hyphens                    |   ✅   | No character restriction client or server side                                           | –                                              |
| Required fields and e-mail format checked in the browser **and** on receipt |   ✅   | Client script and `worker/index.ts` validate both; server rejects bad data (tested, 400) | –                                              |
| Concrete error message at the affected field                                |   🟡   | Fields get `aria-invalid`; one shared message below the fields                           | Per-field messages                             |
| Input kept on error                                                         |   ✅   | Tested                                                                                   | –                                              |
| Show that sending is in progress and prevent repeat submits                 |   🟡   | Button is disabled during submit                                                         | No visible "sending…" state                    |
| Show the next step only after the save succeeded                            |   ❌   | `catch` logs and continues                                                               | Show an error and a retry instead              |
| No passwords, payment details or data about the child                       |   ✅   | Name and e-mail only                                                                     | –                                              |

## 5. Status and update choice

| Element / requirement                                                   | Status | Evidence                                                  | Gap                              |
| ----------------------------------------------------------------------- | :----: | --------------------------------------------------------- | -------------------------------- |
| Message: the service is under development and not yet available         |   ✅   | `uppdatering.astro`                                       | –                                |
| States that no purchase, payment **or subscription start** has happened |   🟡   | "Inget köp har genomförts och ingen betalning har skett." | Subscription start not mentioned |
| Question whether the person wants updates                               |   ✅   | "Vill du hålla dig uppdaterad?"                           | –                                |
| Explanation: launch, early bird, early testing                          |   ✅   | Early bird and testing before launch mentioned            | –                                |
| Separate yes and no choices                                             |   ✅   | Button and link                                           | –                                |
| `uppdatering_ja`                                                        |   🟡   | Present as `id="opt-in"`                                  | Fixed id                         |
| `uppdatering_nej`                                                       |   🟡   | Present as `id="decline"`                                 | Fixed id                         |
| No choice preselected                                                   |   ✅   | –                                                         | –                                |
| Name and e-mail not asked again                                         |   ✅   | Carried in session storage from step 1                    | –                                |
| Ja, nej and inget val as separate statuses                              |   ❌   | –                                                         | Needs a status field (see §7)    |
| Purchase registration kept regardless of the choice                     |   ✅   | The purchase-intent row is never changed or deleted       | –                                |
| Confirmation after yes only once the choice is saved                    |   ❌   | `catch` logs and continues to `/kop/tack`                 | Wait for success                 |
| Technical error: message and option to retry                            |   ❌   | –                                                         | Error state and retry            |
| No promise of a specific discount, test spot or access date             |   ✅   | "Det kan handla om…"                                      | –                                |

## 6. Confirmation and ending

| Requirement                                                       | Status | Evidence                           | Gap                          |
| ----------------------------------------------------------------- | :----: | ---------------------------------- | ---------------------------- |
| After yes: confirmation that information goes to the given e-mail |   ✅   | `tack.astro` shows the address     | –                            |
| After no: simple ending, not registered for updates               |   ✅   | `nej-tack.astro`; no opt-in stored | –                            |
| Both may link to Pianotopia's regular website                     |   🟡   | Link back to the offer page        | Link to Pianotopia's website |
| No automatic confirmation e-mail in the base scope                |   ✅   | None sent                          | –                            |

## 7. Stored data

| Field / requirement                                           | Status | Evidence                                                | Gap                                                                |
| ------------------------------------------------------------- | :----: | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Unique registration id per purchase registration              |   🟡   | `leads.id` (autoincrement)                              | The opt-in is a second row instead of a status on the registration |
| Name and e-mail                                               |   ✅   | `leads.name`, `leads.email`                             | –                                                                  |
| Time of successful registration                               |   ✅   | `leads.created_at`                                      | –                                                                  |
| Update status `inget_val` / `ja` / `nej`, default `inget_val` |   ❌   | –                                                       | Status column                                                      |
| Time of the update choice                                     |   🟡   | Only implicitly for yes (the opt-in row's `created_at`) | Explicit column, also for nej                                      |
| Version of the update information at yes                      |   ❌   | –                                                       | Column plus a version constant in the copy                         |
| Test registration flag                                        |   ❌   | –                                                       | Column, e.g. set from a `?test=1` path or internal e-mail domain   |
| No duplicates from double click, reload or network retries    |   🟡   | Submit button disabled                                  | No idempotency key; a retried request can create a second row      |
| Name and e-mail never in URLs or analytics events             |   ✅   | POST body only; Web Analytics records page views only   | –                                                                  |
| CSV export including update status                            |   🟡   | Queries in the README (D1 console)                      | No CSV export or documented export command                         |
| Access only for designated administrators                     |   🟡   | Data sits in the owner's Cloudflare account             | Admin roles for the client not set up or documented                |
| Documented how data is exported and deleted                   |   🟡   | Read queries in the README                              | Deletion and export steps not documented                           |

## 8. Editing and technical function

| Requirement                                                                                                                              | Status | Evidence                                                                       | Gap                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------- | :----: | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Humanize and Suzanna can change texts, images, alt texts, offer and price, practical info, terms, privacy, flow texts and external links |   ❌   | Content is in code (`.astro`, `site.ts`)                                       | Content files or a headless CMS editors can use without a developer |
| Content changes don't change fixed ids or break function and tracking                                                                    |   🟡   | CTA ids and logic are separate from copy                                       | Copy and ids live in the same files, so editors work in code        |
| Price updated consistently everywhere                                                                                                    |   ✅   | Only in `site.offer`; no hard-coded price elsewhere                            | –                                                                   |
| HTTPS                                                                                                                                    |   ✅   | Valid certificate; HTTP and `www` redirect to `https://musikhjaltarna.se`      | –                                                                   |
| Keyboard use and clear focus indication                                                                                                  |   ✅   | Real links and buttons, 3px focus outline, skip link                           | –                                                                   |
| Readable texts and clear form errors                                                                                                     |   🟡   | Contrast per the style guide                                                   | Errors not per field (see §4)                                       |
| Optimised images, no layout shift while loading                                                                                          |   ✅   | `astro:assets` `<Picture>` (AVIF/WebP), fixed aspect ratios, self-hosted fonts | –                                                                   |
| Works in current Safari, Chrome and the Facebook and Instagram in-app browsers                                                           |   🟡   | Tested in Chrome                                                               | Safari and in-app browsers not tested                               |

## 9. Delivery and acceptance

### Deliverables

| Deliverable                                               | Status | Evidence                              | Gap                                                 |
| --------------------------------------------------------- | :----: | ------------------------------------- | --------------------------------------------------- |
| Published page and working flow                           |   ✅   | https://musikhjaltarna.se             | –                                                   |
| Administrator access to the agreed systems                |   🟡   | GitHub repo, Cloudflare account       | Client access not set up                            |
| Short guide for editing, export and deletion              |   🟡   | Developer README                      | Guide for non-developers; export and deletion steps |
| Documentation of platform, integrations and running costs |   🟡   | README covers platform and deployment | Running costs (Cloudflare free tier) not documented |
| Completed function check                                  |   ❌   | Parts tested during development       | Run and record the checklist below                  |

### Acceptance checklist

| Check                                                                       | Status | Notes                                                                    |
| --------------------------------------------------------------------------- | :----: | ------------------------------------------------------------------------ |
| All five buy buttons open the same step with the right CTA origin           |   ✅   | All five links verified on the live page; `kop_vardag` tested end to end |
| Back from the purchase step restores the offer page and scroll position     |   🟡   | Browser back yes; the "Tillbaka" link goes to the top                    |
| Invalid form shows the right error and keeps input                          |   🟡   | Input kept; one shared message instead of per field                      |
| Successful form saves a registration and shows the status page              |   ✅   | Tested                                                                   |
| Failed storage shows an error and a retry option                            |   ❌   | Visitor continues without error                                          |
| Yes saves "ja" on the right registration and shows the confirmation         |   🟡   | Saved as a separate row                                                  |
| No and no choice are saved as two different statuses                        |   ❌   | Neither is stored                                                        |
| Double click and reload create no duplicate registrations                   |   🟡   | Double click guarded; no server-side idempotency                         |
| Whole flow works on mobile and desktop without overlap or horizontal scroll |   ✅   | Checked 320 to 1280 px                                                   |
| Text or image can be changed without affecting ids or function              |   🟡   | True in code, but requires a developer                                   |
| Export gives correct registrations with update status                       |   🟡   | Query only; no status, no CSV                                            |

## Gap plan, by impact

1. **Rework the registration model** (§2, §5, §7; about 14 items)
   - One `registrations` row per submission: `id` (UUID returned to the browser), `name`, `email`, `cta_id`,
     `created_at`, `update_status` (`inget_val` by default), `update_status_at`, `update_info_version`, `is_test`.
   - `POST /api/registrations` creates the row, with an idempotency key from the browser so double clicks and retries
     can't create duplicates. `PATCH /api/registrations/:id` sets `ja` or `nej`.
2. **Handle failures** (§2, §4, §5, §9): show step 2 and the confirmation only after a successful save. On error, show
   a message with a retry and keep the input. Add a visible "Skickar…" state.
3. **Add the fixed ids** (§3, §4, §5): `sektion_*` on the sections (and in the header's anchor links), plus
   `kop_sammanfattning`, `kop_namn`, `kop_epost`, `kop_skicka`, `kop_tillbaka`, `kop_integritet`, `uppdatering_ja`
   and `uppdatering_nej`.
4. **Purchase step details:** per-field error messages; a privacy notice with a link (`kop_integritet`); a back link
   that returns to the previous scroll position (`history.back()` when coming from the offer page).
5. **Export and administration:** a CSV export (for example a protected `GET /api/export.csv` behind Cloudflare
   Access, or a documented `wrangler d1 execute … --json` → CSV step), documented deletion, admin roles for the client.
6. **Editing for non-developers:** move copy, links and images into content files or a headless CMS so Humanize and
   Suzanna can edit without touching code. Fixed ids stay in the code.
7. **Links and copy:** point "Läs mer om Pianotopia" and the confirmation pages to Pianotopia's website; mention
   "ingen abonnemangsstart"; fill in contact, terms and privacy.
8. **Delivery:** test in Safari and the Facebook and Instagram in-app browsers; document running costs; run and record
   the acceptance checklist.

Ad source and other measurement data are specified in part B of the brief, which is not covered here.
