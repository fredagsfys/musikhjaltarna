# Benchmark: Brief B – Teknisk spårningsbrief

How much of _Pianotopia Musikhjältarna – B. Teknisk spårningsbrief_ the current build fulfils.

- **Assessed:** 2026-11-02, against `main` after PR #20 (tracking on PostHog Cloud EU) and PR #21 (consent banner), the
  live site and the PostHog project.
- **Measurement today:**
  - PostHog Cloud EU (project 330450), cookieless, with the brief's events and properties
    ([`TRACKING.md`](TRACKING.md));
  - a PostHog dashboard with every report, its queries in [`REPORTS.md`](REPORTS.md);
  - D1 `registrations` with CTA, update choice, ad source, page version and analytics consent;
  - a consent banner before any measurement.
- **Scoring:** ✅ fulfilled = 1, 🟡 partly = ½, ❌ missing = 0. Rows marked "–" are out of scope for the site and not
  scored.
- **Previous assessment:** 2026-11-01, before the tracking existed: 31.0 of 92 points, 34%.
- The brief itself (PDF) is not committed; it is client material.

## Summary

**Overall: 90.5 of 92 points, about 98%** (34% before the tracking). 89 ✅, 3 🟡, 0 ❌.

| Section of the brief             |  Items |     ✅ |    🟡 |    ❌ |    Score |       % |
| -------------------------------- | -----: | -----: | ----: | ----: | -------: | ------: |
| 1. Measurement model             |      6 |      6 |     0 |     0 |      6.0 |    100% |
| 2. Identification and linking    |      8 |      8 |     0 |     0 |      8.0 |    100% |
| 3. Ad source                     |      7 |      6 |     1 |     0 |      6.5 |     93% |
| 4. Events                        |     14 |     14 |     0 |     0 |     14.0 |    100% |
| 5. Section exposure              |      6 |      6 |     0 |     0 |      6.0 |    100% |
| 6. Information at each buy click |      9 |      9 |     0 |     0 |      9.0 |    100% |
| 7. Double counting and loss      |      7 |      7 |     0 |     0 |      7.0 |    100% |
| 8. Reporting                     |     15 |     15 |     0 |     0 |     15.0 |    100% |
| 9. Measurement loss and consent  |      6 |      5 |     1 |     0 |      5.5 |     92% |
| 10. Verification and handover    |     14 |     13 |     1 |     0 |     13.5 |     96% |
| **Total**                        | **92** | **89** | **3** | **0** | **90.5** | **98%** |

**In short:** everything the brief asks the site to _record_ is in place and tested on four browsers:

- sessions, event ids, UTC timestamps, page and content versions, environments;
- the ad source, kept for the session and stored on each registration;
- all 13 events, section exposure and buy-button visibility, and the full click context;
- once-only conversions from confirmed storage;
- consent before any measurement.

What remains is outside the code:

1. **Client decisions and access:**
   - sign-off on the consent banner, including the accepted risk of declining only on the second layer;
   - agreeing the ad naming with whoever sets up the ads;
   - client access to PostHog and Cloudflare.

## Questions the tracking must answer

Not scored; this is how far the current setup gets.

| Question                                                                 | Today                                                                                   |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Which ads bring visitors to the page and further through the flow?       | Yes: ad source on every event and registration; "Per ad and message" report             |
| Which sections do visitors see before acting?                            | Yes: `section_view` episodes and `sections_seen` on each click                          |
| Where do visitors click Buy, and how far had they come before the click? | Yes: `cta_id`, `max_section_seen`, `max_scroll_percent` and time to click on each click |
| How many leave their details to continue to payment?                     | Yes: `purchase_intent_submit` (measured) and D1 registrations (stored)                  |
| How many then choose to stay updated?                                    | Yes: `updates_choice` (measured) and `update_status = 'ja'` (stored)                    |
| Where does visitor activity stop?                                        | Yes: lowest section seen and maximum scroll per session, and every step of the flow     |

PostHog answers cover visitors who accepted measurement; D1 counts every registration.

## 1. Measurement model

| Requirement                                                                   | Status | Evidence                                                            | Gap |
| ----------------------------------------------------------------------------- | :----: | ------------------------------------------------------------------- | --- |
| Intressant: ad clicks and click-through rate                                  |   –    | Measured by the ad platform                                         | –   |
| Meningsfullt: share of offer-page visits with at least one buy click          |   ✅   | Sessions with `purchase_click` / sessions with `offer_view`         | –   |
| Värdefullt: share of offer-page visits that lead to a successful registration |   ✅   | Sessions with `purchase_intent_submit` / sessions with `offer_view` | –   |
| Uppdateringsintresse: share of registrations followed by a registered "ja"    |   ✅   | `updates_choice`, and `update_status` in D1                         | –   |
| Purchase intent and update interest reported separately                       |   ✅   | Separate events, fields and reports                                 | –   |
| No event recorded as a completed purchase, payment or revenue                 |   ✅   | None exists; `price` is the offered price on the intent             | –   |
| The approved decision threshold is used; no own interpretation                |   ✅   | No threshold or verdict in the build                                | –   |

## 2. Identification and linking

| Requirement                                                                         | Status | Evidence                                                                 | Gap |
| ----------------------------------------------------------------------------------- | :----: | ------------------------------------------------------------------------ | --- |
| `session_id`, new session after 30 minutes of inactivity                            |   ✅   | PostHog `$session_id`, `session_idle_timeout_seconds: 1800`              | –   |
| `event_id` per event, to prevent double counting on resend                          |   ✅   | Random per event; deterministic for intent and choice                    | –   |
| `event_timestamp` in UTC, reported in Swedish time                                  |   ✅   | UTC ISO 8601 on every event; project time zone Europe/Stockholm          | –   |
| `registration_id` linking registration to the update choice, without name or e-mail |   ✅   | UUID on the intent, notice, choice and confirmation events, and in D1    | –   |
| `page_version`: which version of page and content was seen                          |   ✅   | Commit + `copy.yaml` hash, on every event and registration               | –   |
| `environment`: production vs preview vs internal tests                              |   ✅   | `production`, `preview`, `test`, `development` on every event; `is_test` | –   |
| Analysis built on unique sessions, not unique persons                               |   ✅   | Reports count sessions; no person profiles                               | –   |
| No name, e-mail or form values to analytics; session recordings mask forms          |   ✅   | Every request checked in the tests; no recordings or autocapture         | –   |

## 3. Ad source

| Requirement                                                                                          | Status | Evidence                                                  | Gap                                   |
| ---------------------------------------------------------------------------------------------------- | :----: | --------------------------------------------------------- | ------------------------------------- |
| Consistent tagging: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `message_id`, `ad_id` |   ✅   | All six read on arrival and sent with every event         | –                                     |
| Naming documented together with whoever sets up the ads                                              |   🟡   | Tagging guide with an example link in `TRACKING.md`       | Agree it with whoever sets up the ads |
| Source preserved through the session and the purchase flow                                           |   ✅   | Kept for the tab's session; tested through to D1          | –                                     |
| Source not overwritten by internal navigation                                                        |   ✅   | The first tagged arrival wins; tested                     | –                                     |
| Traffic without an identified source reported separately                                             |   ✅   | `(ingen källa)` in the reports; "Missing source" report   | –                                     |
| Test and organic traffic kept apart from paid ad traffic                                             |   ✅   | `environment` for tests; `utm_medium` for paid vs organic | –                                     |
| Ad-platform clicks and site arrivals reported separately                                             |   ✅   | Reports count arrivals; clicks stay in the ad platform    | –                                     |

## 4. Events

| Event / rule                                                                                 | Status | Evidence                                                   | Gap |
| -------------------------------------------------------------------------------------------- | :----: | ---------------------------------------------------------- | --- |
| `offer_view` with arrival source, page version, device type                                  |   ✅   | Sent in an active tab; `$device_type` from PostHog         | –   |
| `section_view` per the exposure definition                                                   |   ✅   | `src/lib/exposure.ts`; tested                              | –   |
| `cta_view`: at least 50% of the button visible for 1 second                                  |   ✅   | Tested                                                     | –   |
| `purchase_click` with click context (§6)                                                     |   ✅   | Tested                                                     | –   |
| `checkout_view` with the CTA that led there                                                  |   ✅   | `cta_id`                                                   | –   |
| `checkout_start`: first change to a form field, no values                                    |   ✅   | Once per form view                                         | –   |
| `checkout_error` with category (validation, save_failed), no values                          |   ✅   | `category` and `fields`; tested                            | –   |
| `purchase_intent_submit` with `registration_id`, CTA and price, on confirmed storage         |   ✅   | Plus currency; tested                                      | –   |
| `availability_notice_view` with `registration_id`                                            |   ✅   | Only after step 1                                          | –   |
| `updates_choice` with `registration_id`, choice and information version                      |   ✅   | Tested against D1's `update_info_version`                  | –   |
| `updates_confirmation_view` with `registration_id`                                           |   ✅   | Only after a stored ja                                     | –   |
| `checkout_back` with CTA origin                                                              |   ✅   | Tested                                                     | –   |
| `external_link_click` with link id and placement                                             |   ✅   | Four placements; tested                                    | –   |
| `purchase_intent_submit` and `updates_choice` triggered by confirmed storage, not the button |   ✅   | Sent after the server confirms; tested with failed storage | –   |

## 5. Section exposure

| Requirement                                                                                                              | Status | Evidence                                                       | Gap |
| ------------------------------------------------------------------------------------------------------------------------ | :----: | -------------------------------------------------------------- | --- |
| 50% of the section, or half the viewport for tall sections, visible 2 s in an active tab, the same on mobile and desktop |   ✅   | `src/lib/exposure.ts`; tested on four browsers                 | –   |
| First qualified view per section                                                                                         |   ✅   | `view_count = 1`, with `time_since_arrival`                    | –   |
| Latest qualified view before the buy click                                                                               |   ✅   | `last_section_seen` on `purchase_click`                        | –   |
| Total qualified visible time                                                                                             |   ✅   | `section_exposure_end.exposure_ms` (a lower bound; documented) | –   |
| Order of views, including revisits                                                                                       |   ✅   | `view_order` and `view_count`; tested                          | –   |
| Each section counted once per session for reach                                                                          |   ✅   | The "Per section" report counts sessions                       | –   |

## 6. Information at each buy click

| Field                                                      | Status | Evidence                                  | Gap |
| ---------------------------------------------------------- | :----: | ----------------------------------------- | --- |
| `cta_id`                                                   |   ✅   | On `purchase_click`                       | –   |
| `section_id`                                               |   ✅   | On `purchase_click`                       | –   |
| `max_section_seen`                                         |   ✅   | Tested: whole page, then back to the hero | –   |
| `sections_seen`                                            |   ✅   | Tested                                    | –   |
| `last_section_seen`                                        |   ✅   | Tested                                    | –   |
| `max_scroll_percent` (scroll position / scrollable height) |   ✅   | Tested to reach 100 at the bottom         | –   |
| `time_to_click`                                            |   ✅   | Milliseconds since arrival                | –   |
| `active_time_to_click` (active tab only)                   |   ✅   | Pauses while the tab is hidden            | –   |
| Arrival source and page version                            |   ✅   | On every event                            | –   |

## 7. Double counting and loss

| Rule                                                                                  | Status | Evidence                                                   | Gap |
| ------------------------------------------------------------------------------------- | :----: | ---------------------------------------------------------- | --- |
| Repeated buy clicks kept as behaviour, counted once per session in the conversion     |   ✅   | Every click is sent; reports count sessions                | –   |
| One `purchase_intent_submit` per registration, even on double click, reload or resend |   ✅   | Tested: double click and resend                            | –   |
| "Ja" or "nej" recorded only after successful storage                                  |   ✅   | Tested                                                     | –   |
| A missing choice is never turned into "nej"                                           |   ✅   | `inget_val` in D1; no choice event in PostHog; tested      | –   |
| Internal tests and known automated traffic can be excluded                            |   ✅   | `environment`, `is_test`; PostHog drops automated browsers | –   |
| Direct visits to later steps not counted as a completed flow                          |   ✅   | No step events without the flow; tested                    | –   |
| Drop-off computed from the session's recorded progress, not a last "leaving" event    |   ✅   | "Without a click" report; progress on section events       | –   |

## 8. Reporting

Every report is a tile on the PostHog dashboard
[Musikhjältarna – köpavsiktstest](https://eu.posthog.com/project/330450/dashboard/1075531), with its SQL in
[`REPORTS.md`](REPORTS.md). Each query was checked on 2026-11-02 against test sessions covering the whole flow.

| Report part / requirement                                                                                 | Status | Evidence                                                                                                              | Gap |
| --------------------------------------------------------------------------------------------------------- | :----: | --------------------------------------------------------------------------------------------------------------------- | --- |
| Whole flow: offer sessions, clicks, checkout views, started forms, registrations, "ja"; counts and shares |   ✅   | Dashboard tile "Hela flödet"                                                                                          | –   |
| Per ad and message: arrivals, clicks, registrations                                                       |   ✅   | Dashboard tile "Per annons och budskap"                                                                               | –   |
| Per section: sessions exposed, saw its CTA, clicked its CTA                                               |   ✅   | Dashboard tiles "Per sektion" and "Exponering per sektion"                                                            | –   |
| Before the click: clicked CTA vs lowest exposed section                                                   |   ✅   | Dashboard tile "Före klicket"                                                                                         | –   |
| Without a click: lowest exposed section                                                                   |   ✅   | Dashboard tile "Utan klick"                                                                                           | –   |
| Purchase step: checkout view → registration, plus errors                                                  |   ✅   | Dashboard tiles "Köpsteget" and "Valideringsfel per fält"                                                             | –   |
| Update choice: ja, nej, inget val, separate from purchase intent                                          |   ✅   | Dashboard tile "Uppdateringsval"; D1 export                                                                           | –   |
| Data quality: missing source, measurement loss, tests, saved vs measured                                  |   ✅   | Dashboard tiles "Trafik per miljö", "Saknad källa", "Mätta registreringar"; `npm run report:registrations` for stored | –   |
| Filters: date, ad source, message, page version, device type                                              |   ✅   | Dashboard filters, applied to every tile through `{filters}`; tested                                                  | –   |
| Rate: Meningsfullt (sessions with a click / offer sessions)                                               |   ✅   | "Hela flödet" and "Per annons och budskap"                                                                            | –   |
| Rate: Värdefullt (sessions with a registration / offer sessions)                                          |   ✅   | "Hela flödet" and "Per annons och budskap"                                                                            | –   |
| Rate: purchase-step conversion (sessions with a registration / sessions with a checkout view)             |   ✅   | "Hela flödet" and "Köpsteget"                                                                                         | –   |
| Rate: update interest (registrations with "ja" / all registrations)                                       |   ✅   | "Hela flödet" and "Uppdateringsval"; D1                                                                               | –   |
| Rate: CTA click rate (sessions clicking a CTA / sessions that saw it)                                     |   ✅   | "Per sektion", clicks among sessions that saw the button                                                              | –   |
| Section and CTA comparisons presented as descriptive, not causal                                          |   ✅   | Stated in `REPORTS.md`                                                                                                | –   |

## 9. Measurement loss and tracking settings

| Requirement                                                                            | Status | Evidence                                                                                    | Gap                                                      |
| -------------------------------------------------------------------------------------- | :----: | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Documented how tracking settings, blocked scripts and aborted loads affect measurement |   ✅   | "Measurement loss" in `TRACKING.md`, including consent                                      | –                                                        |
| The purchase flow works when analytics doesn't load                                    |   ✅   | Tested with PostHog blocked, and with consent declined or unanswered                        | –                                                        |
| Registrations and choices stored independently of analytics                            |   ✅   | Worker and D1                                                                               | –                                                        |
| Conversion rates computed within one measurable population                             |   ✅   | Every rate from PostHog sessions; stated in `REPORTS.md`                                    | –                                                        |
| Report separates all saved registrations from those traceable in analytics             |   ✅   | `npm run report:registrations` (stored, by analytics choice) next to "Mätta registreringar" | –                                                        |
| Tracking solution and any consent function settled before publishing                   |   🟡   | PostHog Cloud EU; consent banner live, nothing measured before a yes                        | Client sign-off, including declining on the second layer |

## 10. Verification and handover

### Verification before start

| Test                                                                                                       | Status | Notes                                                   | Gap |
| ---------------------------------------------------------------------------------------------------------- | :----: | ------------------------------------------------------- | --- |
| An ad-tagged link to registration carries the same source and message through the flow                     |   ✅   | `tests/tracking.spec.ts`, through to D1                 | –   |
| A click on each of the five buy buttons records the right CTA id, which follows along                      |   ✅   | `tests/acceptance.spec.ts`                              | –   |
| Down the whole page, back to the hero and buy: hero click and earlier exposure to the last section visible |   ✅   | `tests/tracking.spec.ts`                                | –   |
| A visit without a click keeps exposed sections and maximum scroll                                          |   ✅   | `tests/tracking.spec.ts`                                | –   |
| Form error and failed storage are recorded, with no successful intent                                      |   ✅   | `tests/tracking.spec.ts`                                | –   |
| Double click or reload gives one registration and one conversion                                           |   ✅   | `tests/tracking.spec.ts` and `tests/acceptance.spec.ts` | –   |
| Ja, nej and no choice give three separate outcomes                                                         |   ✅   | `tests/acceptance.spec.ts`                              | –   |
| Blocked analytics: the form works and the loss can be explained                                            |   ✅   | Tested; loss documented                                 | –   |
| Changing a heading or button text keeps events and fixed ids working                                       |   ✅   | Ids are fixed in code; tested                           | –   |

### Handover

| Deliverable                                                       | Status | Evidence                                              | Gap               |
| ----------------------------------------------------------------- | :----: | ----------------------------------------------------- | ----------------- |
| Access to analytics and reporting in accounts the client controls |   🟡   | PostHog Cloud EU project and Cloudflare account exist | Invite the client |
| Event catalogue with definitions and parameters                   |   ✅   | `TRACKING.md`                                         | –                 |
| Documented ad tagging and instructions for new ad variants        |   ✅   | `TRACKING.md`, "Tagging ads"                          | –                 |
| Instructions for content versions and excluding test traffic      |   ✅   | `page_version`, `?test` and `environment` documented  | –                 |
| Verification results and known limitations                        |   ✅   | `TRACKING.md`, "Verification"                         | –                 |

## Gap plan

1. **Client decisions and access** (§3, §9, §10):
   - sign-off on the consent banner and its accepted risk;
   - agreeing the ad naming with whoever sets up the ads;
   - client access to PostHog and Cloudflare.
2. **By hand:** a run through the Facebook and Instagram in-app browsers on a real phone.
