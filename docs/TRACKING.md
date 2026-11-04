# Tracking

How visits, exposure and the purchase flow are measured (brief B), and how to read the results. The code is
`src/lib/tracking.ts` (events and setup) and `src/lib/exposure.ts` (section and buy-button exposure); the tests are
`tests/tracking.spec.ts`.

## Setup

| Part         | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Service      | PostHog Cloud EU (data stored in the EU), project `330450`                  |
| Project key  | `site.posthog.key` in `src/config/site.ts` (public by design)               |
| Ingestion    | `https://eu.i.posthog.com`, directly from the browser                       |
| Mode         | Cookieless (`cookieless_mode: 'always'`), no person profiles                |
| Registration | Cloudflare D1, with the ad source and page version on each row (`ADMIN.md`) |

**Required project setting:** cookieless server hash mode must be turned on in the PostHog project settings (search the
settings for "cookieless"). Without it, PostHog drops the events the site sends.

PostHog is loaded after the page, from the site itself (about 52 KB compressed), and only the events below are sent: no
autocapture, session recording, heatmaps, surveys or feature flags. If PostHog is blocked or fails, the purchase flow
works as usual and the events are lost (see [Measurement loss](#measurement-loss)).

### Consent

Nothing is measured until the visitor accepts (brief B §9). Code: `src/lib/consent.ts` and
`src/components/ConsentBanner.astro`; tests: `tests/consent.spec.ts`.

- **The banner** is shown on every page until the visitor decides. It asks briefly, with "Läs mer"
  linking to the privacy page, where measurement is described, and offers **Godkänn alla** (primary) and **Hantera
  inställningar**. The page stays usable while it is open, and gets extra space at the bottom so nothing is hidden
  behind it. It is a slim bar at the bottom of the screen that never sits on a buy button: while it would cover one,
  it slides down out of view and comes back once the button has passed (or when it gets keyboard focus). On phones,
  sideways phones and short laptops the hero is tightened so its buy button is on screen and, where there is room,
  above the bar. On the front page this applies from arrival, so on screens too short for both (iPhone SE, phones held
  sideways, 1024×600) the bar appears with the first scroll. On every other page, including the purchase page, the bar shows on
  load and steps aside only after a scroll, so a visitor who goes straight to buy is still asked. The settings layer
  always stays in place.
- **Settings** describe the measurement and offer it as a checkbox that is never pre-ticked, with **Spara val** and
  **Godkänn alla**. Saving without ticking the box declines.
- **Texts** are in `copy.yaml` under `consent`; the full description is under `pages.integritet`.
- **Before a decision:** nothing is sent and nothing is stored. Events from the current page wait in memory and keep
  the time they happened. If the visitor accepts, they are sent; if they decline or leave, they are discarded.
- **Accepted:** PostHog and Cloudflare Web Analytics start, and the ad source is kept for the rest of the tab's session.
- **Declined:** nothing is sent, now or on later pages, and registrations get no ad source.
- **Change of mind:** _Integritetsinställningar_ in the footer opens the settings. Unticking and saving stops all
  measurement from that moment.
- **Remembered** in `localStorage` (`musikhjaltarna:consent`) for 12 months. Bump `CONSENT_VERSION` in
  `src/lib/consent.ts` when the analytics tools or their purpose change: everyone is asked again.
- **On each registration** D1 stores `analytics_consent` (`granted`, `denied`, or empty if undecided). This
  separates the registrations PostHog can see from those it can't.

**Regulatory risk, accepted by the client (2026-11-02):** declining is only on the second layer. The European Data
Protection Board's cookie banner taskforce (2023) found that most EU data protection authorities treat a first layer
without a reject option as an infringement, and IMY (Sweden) expects declining to be as easy as accepting. To lower the
risk, add a "Neka" button to the first layer, in the same style as "Hantera inställningar", in
`src/components/ConsentBanner.astro`.

### Privacy

- No cookies, even with consent. PostHog identifies a visitor for one day by a server-side hash of IP address, user
  agent and a daily rotating salt; the hash is not stored with the events.
- Names, e-mail addresses and form values are never sent. The tests check every request for the test's name and
  address.
- In the browser, the site keeps only the choice itself and, with consent, the ad source (`sessionStorage`,
  `musikhjaltarna:source`, gone when the tab closes).
- The privacy page (`/integritet`) describes what is measured, with which tools and why. The rest of that page is still
  placeholder text for the client.

## Sessions and versions

- **Session:** ends after 30 minutes of inactivity, assigned by PostHog's servers (`$session_id` on every event).
- **Ad source:** the first tagged arrival in a tab sets it; later pages and later tagged links in the same tab don't
  change it. It is sent with every event and stored on the registration.
- **`page_version`:** `<commit>.<content hash>`, for example `2b10a42.09fdc282`. The first part changes with each code
  deploy, the second whenever anyone edits `src/content/copy.yaml`. Compare variants of the page by this property.
- **`environment`:** `production` (musikhjaltarna.se), `preview` (Cloudflare branch previews), `test` (a tab opened
  with `?test`) or `development` (local). **Filter reports to `environment = production`.**

## Tagging ads

Every ad links to `https://musikhjaltarna.se/` with these parameters:

| Parameter      | Meaning                      | Example       |
| -------------- | ---------------------------- | ------------- |
| `utm_source`   | Platform                     | `facebook`    |
| `utm_medium`   | Kind of traffic              | `paid_social` |
| `utm_campaign` | Campaign                     | `mh_test_1`   |
| `utm_content`  | Ad creative                  | `video_a`     |
| `message_id`   | Which message the ad tests   | `budskap_2`   |
| `ad_id`        | The platform's id for the ad | `{{ad.id}}`   |

Example:
`https://musikhjaltarna.se/?utm_source=facebook&utm_medium=paid_social&utm_campaign=mh_test_1&utm_content=video_a&message_id=budskap_2&ad_id={{ad.id}}`

Meta Ads fills in `{{ad.id}}` itself. Use lowercase and underscores, and the same spelling every time: reports group by
exact value.

## Events

Every event has `event_id` (unique, or deterministic where noted), `event_timestamp` (UTC, ISO 8601), `$session_id`,
`page_version`, `environment` and the ad source parameters that are set.

| Event                       | When                                                  | Properties                                                                                                                                           |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$pageview`                 | Every page load                                       | PostHog's standard (`$current_url`, `$referrer`, device)                                                                                             |
| `offer_view`                | The offer page is shown in an active tab              |                                                                                                                                                      |
| `section_view`              | A section has been in view for 2 s (see below)        | `section_id`, `section_position` (1–5), `view_order`, `view_count` (this section), `time_since_arrival` (ms), `max_scroll_percent`                   |
| `section_exposure_end`      | That view ends (scrolled away or tab hidden)          | `section_id`, `exposure_ms`, `max_scroll_percent`                                                                                                    |
| `cta_view`                  | A buy button has been at least 50% visible for 1 s    | `cta_id`, `section_id`                                                                                                                               |
| `purchase_click`            | A buy button is clicked                               | `cta_id`, `section_id`, `sections_seen`, `max_section_seen`, `last_section_seen`, `max_scroll_percent`, `time_to_click`, `active_time_to_click` (ms) |
| `checkout_view`             | The purchase form is shown                            | `cta_id`                                                                                                                                             |
| `checkout_start`            | First input in the form                               | `cta_id`                                                                                                                                             |
| `checkout_error`            | Sending fails validation, or storage fails            | `category` (`validation` or `save_failed`), `fields` (`name`, `email`), `cta_id`                                                                     |
| `checkout_back`             | "Tillbaka" on the purchase form                       | `cta_id`                                                                                                                                             |
| `purchase_intent_submit`    | The registration is **stored**, once per registration | `event_id` = `purchase_intent_submit:<id>`, `registration_id`, `cta_id`, `price`, `currency`                                                         |
| `availability_notice_view`  | The update question is shown after step 1             | `registration_id`                                                                                                                                    |
| `updates_choice`            | Ja or nej is **stored**                               | `event_id` = `updates_choice:<id>:<choice>`, `registration_id`, `choice` (`ja`/`nej`), `info_version`                                                |
| `updates_confirmation_view` | The confirmation after a stored ja is shown           | `registration_id`                                                                                                                                    |
| `external_link_click`       | A link to Pianotopia's website is clicked             | `link_id` (`pianotopia_website`), `placement` (`footer`, `declined`)                                                                                 |

Rules behind the events:

- **Section view:** at least 50% of the section visible, or for a section taller than the screen, an area of half the
  screen height. It must hold for 2 continuous seconds in an active tab; each new view is a new episode with a higher
  `view_count`. Section ids: `sektion_hero`, `sektion_hjalpen`, `sektion_vardag`, `sektion_pedagog`,
  `sektion_prenumeration`.
- **Scroll depth:** scroll position divided by the scrollable height, 0–100.
- **Active time:** time the tab was visible, from arrival on the offer page to the click.
- **Stored, not attempted:** `purchase_intent_submit` and `updates_choice` are only sent after the server confirmed
  the save. A visitor who never answers the update question has no `updates_choice`: count them as "no choice", not as
  nej.
- **Direct visits:** opening `/kop/uppdatering` or `/kop/tack` without going through the flow sends no step event.
- **Repeat clicks:** every buy click is sent; count them once per session for conversion rates.

## Reports

All reports from brief B §8, with filters and the session rates, are in [`REPORTS.md`](REPORTS.md).

## Measurement loss

Expect PostHog to count fewer events than actually happened:

- **Declined or unanswered consent:** the largest loss. PostHog only sees visitors who accepted, so every rate is
  computed within that group (brief B §9). D1 still stores every registration, with `analytics_consent`.
- **Deciding after leaving the arrival page:** the ad source is only in the arrival URL until the visitor accepts. A
  visitor who accepts on a later page is measured without a source.
- **Blockers:** ad and tracking blockers block `eu.i.posthog.com`. Registrations still reach D1, so compare
  `purchase_intent_submit` with the D1 count to see the share lost.
- **Closing the tab:** `section_exposure_end` is sent when a view ends; when a visitor closes the tab mid-view it may
  not arrive, so exposure times are lower bounds.
- **Bots:** PostHog drops events from browsers that identify as automated.
- **In-app browsers:** Facebook and Instagram use the phone's browser engine; the tests cover both (Safari and
  Chromium). Every event is sent immediately in its own request, so navigation doesn't drop queued events.

## Verification

The verification scenarios from brief B §10 run as automated tests in `tests/tracking.spec.ts`. They run on desktop
Chrome, desktop Safari, iPhone 15 (Safari) and Pixel 7 (Chrome).

| Scenario                                                                          | Result                                                                                                      |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| An ad-tagged link to a registration keeps the source and message through the flow | Passes: the same source on `offer_view`, `checkout_view` and the D1 registration                            |
| Each of the five buy buttons records its own CTA id, which follows along          | Passes (`tests/acceptance.spec.ts`)                                                                         |
| Down the whole page, back to the hero, then buy                                   | Passes: `cta_id` `kop_hero`, `max_section_seen` `sektion_prenumeration`, `last_section_seen` `sektion_hero` |
| A visit without a click keeps the sections seen and the maximum scroll            | Passes                                                                                                      |
| A form error and failed storage are recorded, without a purchase intent           | Passes: `checkout_error` with `validation` and `save_failed`; no `purchase_intent_submit`                   |
| A double click or a resend gives one registration and one intent                  | Passes                                                                                                      |
| Ja, nej and no choice give three separate outcomes                                | Passes (`tests/acceptance.spec.ts`)                                                                         |
| With analytics blocked, the purchase flow works                                   | Passes; the loss is described above                                                                         |
| Changing a heading or button text keeps events and fixed ids working              | Passes: ids are fixed in code, independent of `copy.yaml` (`tests/acceptance.spec.ts`)                      |

Checked by hand: events from a branch preview arrive in the PostHog project, tagged `environment = preview`.

### Known limitations

- **Buy buttons and the consent banner:** the bar steps aside for buy buttons (see [Consent](#consent)), so it never
  covers one. On the front page, on screens too short for the hero and the bar together (iPhone SE, phones held sideways,
  1024×600),
  a visitor who leaves without scrolling or clicking is never asked, and so is not measured.
- **Exposure times are lower bounds:** an episode ending when the tab closes may not be sent.
- **Ad clicks are not on the site:** clicks and click-through rates come from the ad platform; the site counts arrivals.
- **Sessions are per browser:** the same person on phone and laptop is two sessions, by design (brief B §2).
- **Cookieless sessions can merge:** PostHog tells visitors apart by a hash of IP address and browser identity. Two
  visitors on the same network with identical browsers, within 30 minutes of each other, count as one session, with
  the first visitor's ad source. Seen in testing; rare for real ad traffic, but it lowers session counts slightly.
- **Still to do by hand:** a visit through the Facebook and Instagram in-app browsers on a real phone.

## Testing

- Open the site with `?test` to mark the whole tab as `environment = test`; its registrations get `is_test = 1`.
- `npm run test:e2e` runs `tests/tracking.spec.ts` with PostHog stubbed out: nothing reaches the real project.
