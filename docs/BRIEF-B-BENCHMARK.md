# Benchmark: Brief B – Teknisk spårningsbrief

How much of _Pianotopia Musikhjältarna – B. Teknisk spårningsbrief_ the current build fulfils.

- **Assessed:** 2026-11-01, against `main` and the live site.
- **Measurement today:** Cloudflare Web Analytics counts page views (one path per buy button), and D1 `registrations`
  stores each submission with its CTA and update choice.
- **Scoring:** ✅ fulfilled = 1, 🟡 partly = ½, ❌ missing = 0. Rows marked "–" are out of scope for the site and not
  scored.
- The brief itself (PDF) is not committed; it is client material.

## Summary

**Overall: 31.0 of 92 points, about 34%.** 18 ✅, 26 🟡, 48 ❌.

| Section of the brief             |  Items |     ✅ |     🟡 |     ❌ |    Score |       % |
| -------------------------------- | -----: | -----: | -----: | -----: | -------: | ------: |
| 1. Measurement model             |      6 |      4 |      2 |      0 |      5.0 |     83% |
| 2. Identification and linking    |      8 |      2 |      3 |      3 |      3.5 |     44% |
| 3. Ad source                     |      7 |      0 |      2 |      5 |      1.0 |     14% |
| 4. Events                        |     14 |      1 |      7 |      6 |      4.5 |     32% |
| 5. Section exposure              |      6 |      0 |      0 |      6 |      0.0 |      0% |
| 6. Information at each buy click |      9 |      0 |      2 |      7 |      1.0 |     11% |
| 7. Double counting and loss      |      7 |      3 |      2 |      2 |      4.0 |     57% |
| 8. Reporting                     |     15 |      3 |      3 |      9 |      4.5 |     30% |
| 9. Measurement loss and consent  |      6 |      2 |      0 |      4 |      2.0 |     33% |
| 10. Verification and handover    |     14 |      3 |      5 |      6 |      5.5 |     39% |
| **Total**                        | **92** | **18** | **26** | **48** | **31.0** | **34%** |

**In short:** the _stored_ side is strong:

- registrations are saved only after confirmed storage, once per submission, without personal data in the id;
- the CTA is kept, and `ja`, `nej` and `inget_val` stay separate;
- tests are flagged, and the flow works without analytics.

The _behavioural_ side is largely missing, because Web Analytics only counts page views:

- no session id or event ids;
- no ad-source (UTM) capture or persistence;
- no section exposure or CTA visibility;
- none of the click context (sections seen, scroll, time to click);
- none of the session-based reports and rates.

Part B is essentially a specification for an event pipeline with session-level reporting. Closing it needs:

1. **A tracking platform** for events and reports: a product-analytics tool such as PostHog Cloud EU, or first-party
   events in D1 with SQL reports and exports.
2. **A consent decision.** A session identifier kept in the browser for analytics likely requires consent under Swedish
   rules (LEK). The brief requires the tracking solution and any consent function to be settled before publishing (§9).

## Questions the tracking must answer

Not scored; this is how far the current setup gets.

| Question                                                                 | Today                                                                       |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Which ads bring visitors to the page and further through the flow?       | Not answerable: no ad-source capture                                        |
| Which sections do visitors see before acting?                            | Not answerable: no section exposure                                         |
| Where do visitors click Buy, and how far had they come before the click? | Where: yes (path per buy button). How far: no                               |
| How many leave their details to continue to payment?                     | Yes: rows in `registrations`                                                |
| How many then choose to stay updated?                                    | Yes: `update_status = 'ja'`                                                 |
| Where does visitor activity stop?                                        | Only per page (offer → step 1 → step 2 → ending), not within the offer page |

## 1. Measurement model

| Requirement                                                                   | Status | Evidence                                        | Gap                                   |
| ----------------------------------------------------------------------------- | :----: | ----------------------------------------------- | ------------------------------------- |
| Intressant: ad clicks and click-through rate                                  |   –    | Measured by the ad platform                     | –                                     |
| Meningsfullt: share of offer-page visits with at least one buy click          |   🟡   | Web Analytics views of `/` and `/kop/<section>` | Page views, not sessions with a click |
| Värdefullt: share of offer-page visits that lead to a successful registration |   🟡   | D1 registrations vs Web Analytics views         | Mixes two populations; needs sessions |
| Uppdateringsintresse: share of registrations followed by a registered "ja"    |   ✅   | `update_status` in D1                           | –                                     |
| Purchase intent and update interest reported separately                       |   ✅   | Separate fields and pages                       | –                                     |
| No event recorded as a completed purchase, payment or revenue                 |   ✅   | None exists                                     | –                                     |
| The approved decision threshold is used; no own interpretation                |   ✅   | No threshold or verdict in the build            | –                                     |

## 2. Identification and linking

| Requirement                                                                         | Status | Evidence                                      | Gap                                           |
| ----------------------------------------------------------------------------------- | :----: | --------------------------------------------- | --------------------------------------------- |
| `session_id`, new session after 30 minutes of inactivity                            |   ❌   | –                                             | Session handling                              |
| `event_id` per event, to prevent double counting on resend                          |   ❌   | –                                             | Event ids                                     |
| `event_timestamp` in UTC, reported in Swedish time                                  |   🟡   | Registrations stored in UTC                   | No events; reporting not in Swedish time      |
| `registration_id` linking registration to the update choice, without name or e-mail |   ✅   | `registrations.id` (UUID)                     | –                                             |
| `page_version`: which version of page and content was seen                          |   🟡   | `update_info_version` for the step 2 text     | Version for the whole page and content        |
| `environment`: production vs preview vs internal tests                              |   🟡   | Separate preview database, `is_test`          | Not on events; Web Analytics doesn't separate |
| Analysis built on unique sessions, not unique persons                               |   ❌   | Page views only                               | Sessions                                      |
| No name, e-mail or form values to analytics; session recordings mask forms          |   ✅   | Analytics gets page views only; no recordings | –                                             |

## 3. Ad source

| Requirement                                                                                          | Status | Evidence                          | Gap                                                |
| ---------------------------------------------------------------------------------------------------- | :----: | --------------------------------- | -------------------------------------------------- |
| Consistent tagging: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `message_id`, `ad_id` |   ❌   | Parameters are not read           | Capture all six                                    |
| Naming documented together with whoever sets up the ads                                              |   ❌   | –                                 | Tagging guide                                      |
| Source preserved through the session and the purchase flow                                           |   ❌   | –                                 | Persist per session                                |
| Source not overwritten by internal navigation                                                        |   ❌   | –                                 | First-touch per session                            |
| Traffic without an identified source reported separately                                             |   ❌   | –                                 | Report bucket                                      |
| Test and organic traffic kept apart from paid ad traffic                                             |   🟡   | `is_test` on registrations        | Not in analytics; organic vs paid needs the source |
| Ad-platform clicks and site arrivals reported separately                                             |   🟡   | Arrivals counted by Web Analytics | Arrivals per ad need the source                    |

## 4. Events

| Event / rule                                                                                 | Status | Evidence                                                  | Gap                                   |
| -------------------------------------------------------------------------------------------- | :----: | --------------------------------------------------------- | ------------------------------------- |
| `offer_view` with arrival source, page version, device type                                  |   🟡   | Web Analytics page view of `/` (has device type)          | Source, version, active-tab condition |
| `section_view` per the exposure definition                                                   |   ❌   | –                                                         | Exposure tracking                     |
| `cta_view`: at least 50% of the button visible for 1 second                                  |   ❌   | –                                                         | Visibility tracking                   |
| `purchase_click` with click context (§6)                                                     |   🟡   | The CTA can be inferred from the `/kop/<section>` view    | Event with context                    |
| `checkout_view` with the CTA that led there                                                  |   🟡   | Page view of `/kop/<section>`                             | Event linked to the session           |
| `checkout_start`: first change to a form field, no values                                    |   ❌   | –                                                         | Event                                 |
| `checkout_error` with category (validation, save_failed), no values                          |   ❌   | Errors shown, not recorded                                | Event                                 |
| `purchase_intent_submit` with `registration_id`, CTA and price, on confirmed storage         |   🟡   | D1 row on confirmed storage                               | Event with session, price, source     |
| `availability_notice_view` with `registration_id`                                            |   🟡   | Page view of `/kop/uppdatering`                           | `registration_id`                     |
| `updates_choice` with `registration_id`, choice and information version                      |   🟡   | D1 status after confirmed save, with version              | Event linked to the session           |
| `updates_confirmation_view` with `registration_id`                                           |   🟡   | Page view of `/kop/tack`                                  | `registration_id`                     |
| `checkout_back` with CTA origin                                                              |   ❌   | –                                                         | Event                                 |
| `external_link_click` with link id and placement                                             |   ❌   | –                                                         | Event                                 |
| `purchase_intent_submit` and `updates_choice` triggered by confirmed storage, not the button |   ✅   | The flow moves on and stores only after a successful save | –                                     |

## 5. Section exposure

| Requirement                                                                                                              | Status | Gap                 |
| ------------------------------------------------------------------------------------------------------------------------ | :----: | ------------------- |
| 50% of the section, or half the viewport for tall sections, visible 2 s in an active tab, the same on mobile and desktop |   ❌   | Exposure tracking   |
| First qualified view per section                                                                                         |   ❌   | "                   |
| Latest qualified view before the buy click                                                                               |   ❌   | "                   |
| Total qualified visible time                                                                                             |   ❌   | "                   |
| Order of views, including revisits                                                                                       |   ❌   | "                   |
| Each section counted once per session for reach                                                                          |   ❌   | Session aggregation |

## 6. Information at each buy click

| Field                                                      | Status | Evidence                                 | Gap                     |
| ---------------------------------------------------------- | :----: | ---------------------------------------- | ----------------------- |
| `cta_id`                                                   |   🟡   | Inferable from the `/kop/<section>` path | On the click event      |
| `section_id`                                               |   🟡   | Inferable from the CTA (`CTA_SECTION`)   | On the click event      |
| `max_section_seen`                                         |   ❌   | –                                        | Exposure tracking       |
| `sections_seen`                                            |   ❌   | –                                        | Exposure tracking       |
| `last_section_seen`                                        |   ❌   | –                                        | Exposure tracking       |
| `max_scroll_percent` (scroll position / scrollable height) |   ❌   | –                                        | Scroll tracking         |
| `time_to_click`                                            |   ❌   | –                                        | Timing                  |
| `active_time_to_click` (active tab only)                   |   ❌   | –                                        | Visibility-aware timing |
| Arrival source and page version                            |   ❌   | –                                        | Source and version      |

## 7. Double counting and loss

| Rule                                                                                  | Status | Evidence                                         | Gap                                        |
| ------------------------------------------------------------------------------------- | :----: | ------------------------------------------------ | ------------------------------------------ |
| Repeated buy clicks kept as behaviour, counted once per session in the conversion     |   ❌   | Page views, no sessions                          | Session dedupe                             |
| One `purchase_intent_submit` per registration, even on double click, reload or resend |   ✅   | Idempotent registration id; tested               | –                                          |
| "Ja" or "nej" recorded only after successful storage                                  |   ✅   | Tested                                           | –                                          |
| A missing choice is never turned into "nej"                                           |   ✅   | `inget_val` by default; tested                   | –                                          |
| Internal tests and known automated traffic can be excluded                            |   🟡   | `is_test` in D1; Web Analytics filters some bots | Tests not excludable in analytics          |
| Direct visits to later steps not counted as a completed flow                          |   🟡   | Step 2 redirects without a registration          | Web Analytics counts page views regardless |
| Drop-off computed from the session's recorded progress, not a last "leaving" event    |   ❌   | No session progress                              | Session events                             |

## 8. Reporting

| Report part / requirement                                                                                 | Status | Evidence                       | Gap                             |
| --------------------------------------------------------------------------------------------------------- | :----: | ------------------------------ | ------------------------------- |
| Whole flow: offer sessions, clicks, checkout views, started forms, registrations, "ja"; counts and shares |   🟡   | Page views plus D1 counts      | Sessions, started forms, shares |
| Per ad and message: arrivals, clicks, registrations                                                       |   ❌   | –                              | Source capture                  |
| Per section: sessions exposed, saw its CTA, clicked its CTA                                               |   ❌   | –                              | Exposure and CTA visibility     |
| Before the click: clicked CTA vs lowest exposed section                                                   |   ❌   | –                              | Click context                   |
| Without a click: lowest exposed section                                                                   |   ❌   | –                              | Exposure                        |
| Purchase step: checkout view → registration, plus errors                                                  |   🟡   | Views vs D1 count              | Sessions and error events       |
| Update choice: ja, nej, inget val, separate from purchase intent                                          |   ✅   | D1 query in the README         | –                               |
| Data quality: missing source, measurement loss, tests, saved vs measured                                  |   ❌   | –                              | Report                          |
| Filters: date, ad source, message, page version, device type                                              |   🟡   | Web Analytics: date and device | Source, message, version        |
| Rate: Meningsfullt (sessions with a click / offer sessions)                                               |   ❌   | –                              | Sessions                        |
| Rate: Värdefullt (sessions with a registration / offer sessions)                                          |   ❌   | –                              | Sessions                        |
| Rate: purchase-step conversion (sessions with a registration / sessions with a checkout view)             |   ❌   | –                              | Sessions                        |
| Rate: update interest (registrations with "ja" / all registrations)                                       |   ✅   | D1                             | –                               |
| Rate: CTA click rate (sessions clicking a CTA / sessions that saw it)                                     |   ❌   | –                              | CTA visibility                  |
| Section and CTA comparisons presented as descriptive, not causal                                          |   ✅   | No such claims anywhere        | –                               |

## 9. Measurement loss and tracking settings

| Requirement                                                                            | Status | Evidence                              | Gap                          |
| -------------------------------------------------------------------------------------- | :----: | ------------------------------------- | ---------------------------- |
| Documented how tracking settings, blocked scripts and aborted loads affect measurement |   ❌   | –                                     | Documentation                |
| The purchase flow works when analytics doesn't load                                    |   ✅   | The beacon is independent of the flow | –                            |
| Registrations and choices stored independently of analytics                            |   ✅   | Worker and D1                         | –                            |
| Conversion rates computed within one measurable population                             |   ❌   | –                                     | Sessions in one system       |
| Report separates all saved registrations from those traceable in analytics             |   ❌   | –                                     | Report                       |
| Tracking solution and any consent function settled before publishing                   |   ❌   | –                                     | Decision (platform, consent) |

## 10. Verification and handover

### Verification before start

| Test                                                                                                       | Status | Notes                                                          |
| ---------------------------------------------------------------------------------------------------------- | :----: | -------------------------------------------------------------- |
| An ad-tagged link to registration carries the same source and message through the flow                     |   ❌   | No source capture                                              |
| A click on each of the five buy buttons records the right CTA id, which follows along                      |   ✅   | `cta_id` in D1; tested (brief A suite)                         |
| Down the whole page, back to the hero and buy: hero click and earlier exposure to the last section visible |   ❌   | No exposure tracking                                           |
| A visit without a click keeps exposed sections and maximum scroll                                          |   ❌   | No exposure or scroll tracking                                 |
| Form error and failed storage are recorded, with no successful intent                                      |   🟡   | No intent stored on failure (tested); errors not recorded      |
| Double click or reload gives one registration and one conversion                                           |   🟡   | One registration (tested); one conversion needs session dedupe |
| Ja, nej and no choice give three separate outcomes                                                         |   ✅   | Tested                                                         | –                   |
| Blocked analytics: the form works and the loss can be explained                                            |   🟡   | Form independent of analytics                                  | Loss not documented |
| Changing a heading or button text keeps events and fixed ids working                                       |   ✅   | Ids independent of `copy.yaml`; tested                         | –                   |

### Handover

| Deliverable                                                       | Status | Evidence                              | Gap                           |
| ----------------------------------------------------------------- | :----: | ------------------------------------- | ----------------------------- |
| Access to analytics and reporting in accounts the client controls |   🟡   | Cloudflare account exists             | Client access; reporting tool |
| Event catalogue with definitions and parameters                   |   ❌   | –                                     | Document                      |
| Documented ad tagging and instructions for new ad variants        |   ❌   | –                                     | Document                      |
| Instructions for content versions and excluding test traffic      |   🟡   | `?test` documented in `docs/ADMIN.md` | Content versions              |
| Verification results and known limitations                        |   ❌   | –                                     | Document                      |

## Gap plan

1. **Decide the platform and consent** (§9). A product-analytics tool (for example PostHog Cloud EU) gives sessions,
   source attribution, funnels and filtered reports largely by configuration. First-party events in D1 keep all data
   in-house but need the reports built as SQL views and exports. The consent decision is the client's.
2. **Session and source layer** (§2, §3): `session_id` with 30-minute inactivity, `event_id`, `page_version` (for
   example the content hash of `copy.yaml` plus the build), `environment`, and capture of the six ad parameters on
   arrival, kept for the session.
3. **Exposure and visibility** (§5, §6): `IntersectionObserver`-based `section_view` per the 2-second / 50% definition,
   `cta_view` at 1 second, and per-session tracking of sections seen, maximum scroll and active time. These are then
   attached to `purchase_click`.
4. **The event catalogue** (§4): the 13 events with their properties. `purchase_intent_submit` and `updates_choice` are
   fired from the confirmed save, and the registration gets the `session_id`, so stored and measured data can be
   reconciled.
5. **Reports** (§8): the funnel, per-ad, per-section, before/without-click, purchase-step, update-choice and
   data-quality views, with the five rates and filters.
6. **Documentation and verification** (§9, §10): measurement loss, the event catalogue, the ad-tagging guide, the
   verification scenarios as automated tests like the brief A suite, and client access.
