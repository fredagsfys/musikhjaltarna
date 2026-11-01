# Benchmark: Brief A – Teknisk produktionsbrief

How much of _Pianotopia Musikhjältarna – A. Teknisk produktionsbrief_ the build fulfils.

- **Assessed:** 2026-11-01, after the gap work on branch `feat/brief-a-compliance`. Every requirement in the brief is
  checked against the code. Behaviour marked "tested" is covered by the acceptance suite
  ([`docs/FUNCTION-CHECK.md`](FUNCTION-CHECK.md)) in Chrome and Safari, desktop and mobile.
- **Scoring:** ✅ fulfilled = 1, 🟡 partly = ½, ❌ missing = 0.
- The brief itself (PDF) is not committed; it is client material.

## Summary

**Overall: 90.5 of 92 points, about 98%.** 89 ✅, 3 🟡, 0 ❌. The first assessment, before the gap work, was 58.5 points
(64%).

| Section of the brief              |  Items |     ✅ |    🟡 |    ❌ |    Score |       % |
| --------------------------------- | -----: | -----: | ----: | ----: | -------: | ------: |
| 1. What to build                  |      6 |      6 |     0 |     0 |      6.0 |    100% |
| 2. Visitor flow                   |      8 |      8 |     0 |     0 |      8.0 |    100% |
| 3. Offer page structure           |      9 |      8 |     1 |     0 |      8.5 |     94% |
| 4. Purchase step                  |     15 |     15 |     0 |     0 |     15.0 |    100% |
| 5. Status and update choice       |     14 |     14 |     0 |     0 |     14.0 |    100% |
| 6. Confirmation and ending        |      4 |      4 |     0 |     0 |      4.0 |    100% |
| 7. Stored data                    |     12 |     12 |     0 |     0 |     12.0 |    100% |
| 8. Editing and technical function |      8 |      7 |     1 |     0 |      7.5 |     94% |
| 9. Delivery and acceptance        |     16 |     15 |     1 |     0 |     15.5 |     97% |
| **Total**                         | **92** | **89** | **3** | **0** | **90.5** | **98%** |

**What's left needs input or action outside the code:**

1. **A real contact route** (§3): the footer links to `/kontakt`, but the page only holds placeholder text until
   Pianotopia supplies an e-mail address or phone number. It goes in `copy.yaml`, with no code change needed.
2. **The real Facebook and Instagram apps** (§8): their browser engines are tested, the apps themselves are not. A short
   manual check in both apps before launch closes this.
3. **Client access** (§9): Humanize and Suzanna need to be invited to GitHub and, if they should export data, to
   Cloudflare. [`docs/ADMIN.md`](ADMIN.md) describes how.

Placeholder copy and images remain by agreement. The client delivers them, and they slot into `copy.yaml` and
`src/assets/images/` without code changes.

## 1. What to build

| Requirement                                                    | Status | Evidence                                                                             |
| -------------------------------------------------------------- | :----: | ------------------------------------------------------------------------------------ |
| Offer page: five sections in fixed order, one buy button each  |   ✅   | `src/pages/index.astro`, `src/components/sections/*`                                 |
| Purchase step: offer summary and form for name and e-mail      |   ✅   | `src/pages/kop/[...cta].astro`                                                       |
| Status and update choice (yes/no)                              |   ✅   | `src/pages/kop/uppdatering.astro`; choice stored on the registration                 |
| Confirmation after yes, simple ending after no                 |   ✅   | `src/pages/kop/tack.astro`, `src/pages/kop/nej-tack.astro`                           |
| Secure storage, access and export of registrations and choices |   ✅   | D1 `registrations`; write-only API; CSV export and deletion scripts; `docs/ADMIN.md` |
| Text, images and links editable after delivery                 |   ✅   | `src/content/copy.yaml`, images by file name, `docs/EDITING.md`                      |

## 2. Visitor flow

| Requirement                                                                      | Status | Evidence                                                                                            |
| -------------------------------------------------------------------------------- | :----: | --------------------------------------------------------------------------------------------------- |
| Buy button opens the purchase step in the same tab                               |   ✅   | Plain links to `/kop/<section>`; tested                                                             |
| Back from the purchase step shows the offer page at the previous scroll position |   ✅   | `kop_tillbaka` uses history when coming from the offer page, otherwise the button's section; tested |
| Valid form: data saved, then status shown                                        |   ✅   | Navigates only after the save succeeded; tested                                                     |
| Invalid data: error shown, input kept                                            |   ✅   | Field-level messages; tested                                                                        |
| Yes: choice saved on the same registration, then confirmation                    |   ✅   | `update_status = 'ja'` on the same row; tested                                                      |
| No: "nej" saved, simple ending shown                                             |   ✅   | `update_status = 'nej'`; tested                                                                     |
| Leaving without choosing keeps status "inget val"                                |   ✅   | Default `inget_val`; tested                                                                         |
| Each step technically identifiable and works with the back button                |   ✅   | One URL per step; buttons restored after back (bfcache); tested                                     |

## 3. Offer page structure

| Requirement                                                               | Status | Evidence                                                           | Gap                                                   |
| ------------------------------------------------------------------------- | :----: | ------------------------------------------------------------------ | ----------------------------------------------------- |
| Fixed section ids `sektion_hero` … `sektion_prenumeration`                |   ✅   | `SECTION_IDS` in `src/config/site.ts`; tested                      | –                                                     |
| Buy button ids `kop_hero` … `kop_avslut`                                  |   ✅   | `data-cta-id` on every button; tested                              | –                                                     |
| All buy buttons lead to the same purchase step with the same visible text |   ✅   | Same step under `/kop/<section>`; tested                           | –                                                     |
| Which buy button was used follows to the purchase step                    |   ✅   | Path per button; `cta_id` stored; tested                           | –                                                     |
| Price and period per the editorial material                               |   ✅   | `offer` in `copy.yaml`, one source for every place                 | –                                                     |
| Same section order on mobile and desktop                                  |   ✅   | Single DOM order                                                   | –                                                     |
| Text and images fit the screen without horizontal scroll                  |   ✅   | Tested on every page, desktop and mobile                           | –                                                     |
| Footer: Pianotopia as sender, contact route, links to terms and privacy   |   🟡   | Sender, `/kontakt`, `/villkor`, `/integritet`                      | `/kontakt` needs real contact details from Pianotopia |
| Links to Pianotopia's regular website, same tab, per wireframe            |   ✅   | "Läs mer om Pianotopia" and footer link to `https://pianotopia.se` | –                                                     |

## 4. Purchase step

| Element / requirement                                                   | Status | Evidence                                                         |
| ----------------------------------------------------------------------- | :----: | ---------------------------------------------------------------- |
| `kop_sammanfattning`                                                    |   ✅   | Summary and price box; tested                                    |
| `kop_namn`                                                              |   ✅   | Required, `autocomplete="name"`; tested                          |
| `kop_epost`                                                             |   ✅   | Required, `type="email"`, `inputmode="email"`; tested            |
| `kop_skicka`: "Gå vidare till betalning"                                |   ✅   | Text from `copy.yaml`; tested                                    |
| `kop_tillbaka`                                                          |   ✅   | Restores the offer page and scroll position; tested              |
| `kop_integritet`: personal-data info and link to the privacy text       |   ✅   | Text from `copy.yaml`, link to `/integritet`; tested             |
| Visible labels above the fields                                         |   ✅   | `<label for>` above each input                                   |
| Autofill and e-mail keyboard on mobile                                  |   ✅   | `autocomplete`, `inputmode`                                      |
| Names with Swedish characters, spaces and hyphens                       |   ✅   | Tested with "Åsa Öberg-Lind"                                     |
| Required fields and e-mail format checked in the browser and on receipt |   ✅   | Client script and `worker/index.ts`; server rejects invalid data |
| Concrete error message at the affected field                            |   ✅   | `kop_namn-fel`, `kop_epost-fel` with `aria-describedby`; tested  |
| Input kept on error                                                     |   ✅   | Tested                                                           |
| Shows sending in progress and prevents repeat submits                   |   ✅   | "Skickar…", disabled button; double click tested                 |
| Next step only after the save succeeded                                 |   ✅   | Error and retry on failure; tested                               |
| No passwords, payment details or data about the child                   |   ✅   | Name and e-mail only                                             |

## 5. Status and update choice

| Element / requirement                                       | Status | Evidence                                        |
| ----------------------------------------------------------- | :----: | ----------------------------------------------- |
| Under development, not yet available                        |   ✅   | `updates.status`                                |
| No purchase, payment or subscription start                  |   ✅   | "…inget abonnemang har startats."               |
| Question whether the person wants updates                   |   ✅   | `updates.question`                              |
| Explanation: launch, early bird, early testing              |   ✅   | `updates.info`                                  |
| Separate yes and no choices                                 |   ✅   | Two buttons                                     |
| `uppdatering_ja`                                            |   ✅   | Tested                                          |
| `uppdatering_nej`                                           |   ✅   | Tested                                          |
| No choice preselected                                       |   ✅   | –                                               |
| Name and e-mail not asked again                             |   ✅   | Registration carried in the session             |
| Ja, nej and inget val as separate statuses                  |   ✅   | `update_status`; tested                         |
| Purchase registration kept regardless of the choice         |   ✅   | The choice updates the row and never deletes it |
| Confirmation after yes only once the choice is saved        |   ✅   | Tested                                          |
| Technical error: message and option to retry                |   ✅   | `uppdatering-fel`; tested                       |
| No promise of a specific discount, test spot or access date |   ✅   | "Det kan handla om…"                            |

## 6. Confirmation and ending

| Requirement                                                       | Status | Evidence                             |
| ----------------------------------------------------------------- | :----: | ------------------------------------ |
| After yes: confirmation that information goes to the given e-mail |   ✅   | Address shown; tested                |
| After no: simple ending, not registered for updates               |   ✅   | `nej-tack`; status `nej`             |
| Both may link to Pianotopia's regular website                     |   ✅   | "Till Pianotopias webbplats" on both |
| No automatic confirmation e-mail in the base scope                |   ✅   | None sent                            |

## 7. Stored data

| Field / requirement                                           | Status | Evidence                                                       |
| ------------------------------------------------------------- | :----: | -------------------------------------------------------------- |
| Unique registration id per purchase registration              |   ✅   | `registrations.id` (UUID)                                      |
| Name and e-mail                                               |   ✅   | `name`, `email`                                                |
| Time of successful registration                               |   ✅   | `created_at`                                                   |
| Update status `inget_val` / `ja` / `nej`, default `inget_val` |   ✅   | `update_status` with a CHECK constraint; tested                |
| Time of the update choice                                     |   ✅   | `update_status_at`; tested                                     |
| Version of the update information at the choice               |   ✅   | `update_info_version`, a hash of the text shown; tested        |
| Test registration flag                                        |   ✅   | `is_test` via `?test`                                          |
| No duplicates from double click, reload or network retries    |   ✅   | Id reused, `ON CONFLICT` update; tested                        |
| Name and e-mail never in URLs or analytics events             |   ✅   | POST body only; Web Analytics counts page views                |
| CSV export including update status                            |   ✅   | `npm run export:registrations`; tested                         |
| Access only for designated administrators                     |   ✅   | Cloudflare account members only; the API cannot read data back |
| Documented how data is exported and deleted                   |   ✅   | `docs/ADMIN.md`, `npm run delete:registration`                 |

## 8. Editing and technical function

| Requirement                                                                                             | Status | Evidence                                                                   | Gap                                                  |
| ------------------------------------------------------------------------------------------------------- | :----: | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| Editors can change texts, images, alt texts, offer and price, info pages, flow texts and external links |   ✅   | `copy.yaml` in GitHub's web editor, images by file name; `docs/EDITING.md` | –                                                    |
| Content changes don't change fixed ids or break function and tracking                                   |   ✅   | Ids and logic in code; strict validation fails invalid edits; ids tested   | –                                                    |
| Price updated consistently everywhere                                                                   |   ✅   | One `offer` block feeds every price                                        | –                                                    |
| HTTPS                                                                                                   |   ✅   | Valid certificate; `http://` and `www` redirect                            | –                                                    |
| Keyboard use and clear focus indication                                                                 |   ✅   | Flow completed by keyboard, outlines of at least 2px; tested               | –                                                    |
| Readable texts and clear form errors                                                                    |   ✅   | Style-guide contrast, field-level errors                                   | –                                                    |
| Optimised images, no layout shift while loading                                                         |   ✅   | `<Picture>` AVIF/WebP, fixed aspect ratios, self-hosted fonts              | –                                                    |
| Works in current Safari, Chrome and the Facebook and Instagram in-app browsers                          |   🟡   | Tested in Chrome and Safari (WebKit), desktop and mobile                   | Manual check in the real Facebook and Instagram apps |

## 9. Delivery and acceptance

### Deliverables

| Deliverable                                               | Status | Evidence                                                    | Gap                         |
| --------------------------------------------------------- | :----: | ----------------------------------------------------------- | --------------------------- |
| Published page and working flow                           |   ✅   | https://musikhjaltarna.se; deploys from `main`              | –                           |
| Administrator access to the agreed systems                |   🟡   | GitHub and Cloudflare in place; how to invite is documented | Invite Humanize and Suzanna |
| Short guide for editing, export and deletion              |   ✅   | `docs/EDITING.md`, `docs/ADMIN.md`                          | –                           |
| Documentation of platform, integrations and running costs |   ✅   | `docs/ADMIN.md`                                             | –                           |
| Completed function check                                  |   ✅   | `docs/FUNCTION-CHECK.md`                                    | –                           |

### Acceptance checklist

All 11 checks pass in the automated suite. See [`docs/FUNCTION-CHECK.md`](FUNCTION-CHECK.md) for results per browser.

| Check                                                                       | Status |
| --------------------------------------------------------------------------- | :----: |
| All five buy buttons open the same step with the right CTA origin           |   ✅   |
| Back from the purchase step restores the offer page and scroll position     |   ✅   |
| Invalid form shows the right error and keeps input                          |   ✅   |
| Successful form saves a registration and shows the status page              |   ✅   |
| Failed storage shows an error and a retry option                            |   ✅   |
| Yes saves "ja" on the right registration and shows the confirmation         |   ✅   |
| No and no choice are saved as two different statuses                        |   ✅   |
| Double click and reload create no duplicate registrations                   |   ✅   |
| Whole flow works on mobile and desktop without overlap or horizontal scroll |   ✅   |
| Text or image can be changed without affecting ids or function              |   ✅   |
| Export gives correct registrations with update status                       |   ✅   |

Ad source and other measurement data are specified in part B of the brief, which is not covered here.
