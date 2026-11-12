# Tracking

How visits, exposure and the purchase flow are measured (brief B), and how to read the results. The code is
`src/lib/tracking.ts` (events and setup) and `src/lib/exposure.ts` (section and buy-button exposure); the tests are
`tests/tracking.spec.ts`.

## Setup

| Part         | Value                                                                                  |
| ------------ | -------------------------------------------------------------------------------------- |
| Service      | Google Analytics 4, loaded through Google Tag Manager                                  |
| Container    | `GTM-M8WZZXQZ`, `site.gtmId` in `src/config/site.ts` (public by design)                |
| GA4 stream   | Measurement ID `G-H9SG7679XK`, set in the container (variable **GA4 measurement ID**)  |
| Data layer   | The site pushes each event to `window.dataLayer`; Tag Manager sends it on to GA4       |
| Consent Mode | `analytics_storage` granted, `ad_storage`, `ad_user_data`, `ad_personalization` denied |
| Registration | Cloudflare D1, with the ad source and page version on each row (`ADMIN.md`)            |

Tag Manager is loaded only after the visitor accepts, and only the events below are sent, plus GA4's own page views.
If Tag Manager is blocked or fails, the purchase flow works as usual and the events are lost (see
[Measurement loss](#measurement-loss)).

### Setting up Tag Manager and GA4

The site only pushes events; the tags that send them to GA4 live in the Tag Manager container.
[`gtm/musikhjaltarna-container.json`](gtm/musikhjaltarna-container.json) holds them, ready to import:

1. In Tag Manager, open container `GTM-M8WZZXQZ`, then **Admin → Import container**: choose the file, the workspace, and
   **Merge** (rename conflicting). The GA4 measurement ID `G-H9SG7679XK` is already in the file.
2. Check in **Preview** that `offer_view` fires the tag **GA4 event – site events**, then **Submit** to publish.

What the import contains:

- **Google tag – GA4** on every page, with Google signals and ad personalisation off and cookies kept for 13 months
  (`cookie_expires`), as the privacy policy says.
- **GA4 event – site events**, triggered by the site's events (a regular expression over the names below), sending the
  event name and every parameter. A parameter the event doesn't have isn't sent.
- One data layer variable per parameter (`DLV - section_id`, …).

When an event or parameter is added in the code, add it to the trigger and the tag, or regenerate the file.

**Custom dimensions:** GA4 only shows a parameter in reports once it is registered as a custom dimension or metric,
and only from that moment on, so do it before the ads start. `scripts/ga4-custom-definitions.mjs` registers them all
through the Admin API and skips those that exist:

```sh
GA_ACCESS_TOKEN=… npm run ga4:definitions -- --property=123456789        # shows what it would create
GA_ACCESS_TOKEN=… npm run ga4:definitions -- --property=123456789 --yes  # creates them
```

The property ID is the number under **Admin → Property details**. The top of the script explains how to get an access
token. The script's lists are the ones to keep up to date. `event_id`, `event_timestamp` and `registration_id` are for
matching single events and are left unregistered (GA4 limits dimensions with many values).

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
- **Texts** are in `copy.yaml` under `consent`; the full description is the privacy policy, `src/content/integritetspolicy.md`.
- **Before a decision:** nothing is sent and nothing is stored. Events from the current page wait in memory and keep
  the time they happened. If the visitor accepts, they are sent; if they decline or leave, they are discarded.
- **Accepted:** Tag Manager (with GA4) and Cloudflare Web Analytics start, and the ad source is kept for the rest of the tab's session.
- **Declined:** nothing is sent, now or on later pages, and registrations get no ad source.
- **Change of mind:** _Cookieinställningar_ in the footer opens the settings. Unticking and saving stops all
  measurement from that moment, and deletes GA4's cookies (`_ga`, `_ga_<id>`).
- **Remembered** in `localStorage` (`musikhjaltarna:consent`) for 12 months. Bump `CONSENT_VERSION` in
  `src/lib/consent.ts` when the analytics tools or their purpose change: everyone is asked again.
- **On each registration** D1 stores `analytics_consent` (`granted`, `denied`, or empty if undecided). This
  separates the registrations GA4 can see from those it can't.

**Regulatory risk, accepted by the client (2026-11-02):** declining is only on the second layer. The European Data
Protection Board's cookie banner taskforce (2023) found that most EU data protection authorities treat a first layer
without a reject option as an infringement, and IMY (Sweden) expects declining to be as easy as accepting. To lower the
risk, add a "Neka" button to the first layer, in the same style as "Hantera inställningar", in
`src/components/ConsentBanner.astro`.

### Privacy

- With consent, GA4 sets its cookies `_ga` and `_ga_<id>` (13 months) to recognise the browser. Without consent, Tag
  Manager isn't loaded and no cookies are set. Google signals and ad personalisation are off, and Consent Mode denies
  all advertising storage.
- GA4 is Google's service and data may be processed in the USA; the privacy policy names Google Ireland Limited as
  processor. The client needs Google's data processing terms accepted in GA4 (**Admin → Account settings**).
- Names, e-mail addresses and form values are never sent. The tests check every request for the test's name and
  address.
- In the browser, the site keeps only the choice itself and, with consent, the ad source (`sessionStorage`,
  `musikhjaltarna:source`, gone when the tab closes).
- The privacy page (`/integritet`) describes what is measured, with which tools and why. The rest of that page is still
  placeholder text for the client.

## Sessions and versions

- **Session:** GA4's own (`ga_session_id`), ending after 30 minutes of inactivity. A browser is recognised by the
  `_ga` cookie, so a return visit within 13 months is the same user.
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

Every event has `event_id` (unique, or deterministic where noted), `event_timestamp` (UTC, ISO 8601), `page_version`,
`environment` and the ad source parameters that are set. Lists (`sections_seen`, `fields`) are sent as comma-separated
text, since GA4 parameters can't hold lists.

| Event                       | When                                                   | Properties                                                                                                                                           |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page_view`                 | Every page load                                        | GA4's own, from the Google tag (page, referrer, device, UTM parameters in the URL)                                                                   |
| `offer_view`                | The offer page is shown in an active tab               |                                                                                                                                                      |
| `section_view`              | A section has been in view for 2 s (see below)         | `section_id`, `section_position` (1–5), `view_order`, `view_count` (this section), `time_since_arrival` (ms), `max_scroll_percent`                   |
| `section_exposure_end`      | That view ends (scrolled away or tab hidden)           | `section_id`, `exposure_ms`, `max_scroll_percent`                                                                                                    |
| `cta_view`                  | A buy button has been at least 50% visible for 1 s     | `cta_id`, `section_id`                                                                                                                               |
| `purchase_click`            | A buy button is clicked                                | `cta_id`, `section_id`, `sections_seen`, `max_section_seen`, `last_section_seen`, `max_scroll_percent`, `time_to_click`, `active_time_to_click` (ms) |
| `checkout_view`             | The purchase step (offer and price) is shown           | `cta_id`                                                                                                                                             |
| `checkout_start`            | First input in the last step's form                    | `cta_id`                                                                                                                                             |
| `checkout_error`            | The last step fails validation, or storage fails       | `category` (`validation` or `save_failed`), `fields` (`name`, `email`), `cta_id`                                                                     |
| `checkout_back`             | "Tillbaka" on the purchase step                        | `cta_id`                                                                                                                                             |
| `purchase_intent_submit`    | "Gå vidare till betalning", once per visit to the flow | `event_id` = `purchase_intent_submit:<id>`, `registration_id`, `cta_id`, `price`, `currency`                                                         |
| `availability_notice_view`  | The update question is shown after step 1              | `registration_id`                                                                                                                                    |
| `updates_choice`            | Ja is **stored**, or nej is chosen (nothing stored)    | `event_id` = `updates_choice:<id>:<choice>`, `registration_id`, `choice` (`ja`/`nej`), `info_version`                                                |
| `updates_confirmation_view` | The confirmation after a stored ja is shown            | `registration_id`                                                                                                                                    |
| `external_link_click`       | A link to Pianotopia's website is clicked              | `link_id` (`pianotopia_website`), `placement` (`footer`, `declined`)                                                                                 |
| `practice_listen`           | "Lyssna" in the playable practice example              | `attempt` (games started so far on this page view)                                                                                                   |
| `practice_start`            | The first key of a game in the practice example        | `attempt` (1 for the first game on this page view)                                                                                                   |
| `practice_complete`         | All five notes played in that game                     | `attempt`, `misses` (wrong keys), `hinted` (a key hint was shown), `duration_ms` (from the first key)                                                |

Rules behind the events:

- **Section view:** at least 50% of the section visible, or for a section taller than the screen, an area of half the
  screen height. It must hold for 2 continuous seconds in an active tab; each new view is a new episode with a higher
  `view_count`. Section ids: `sektion_hero`, `sektion_hjalpen`, `sektion_vardag`, `sektion_pedagog`,
  `sektion_prenumeration`.
- **Scroll depth:** scroll position divided by the scrollable height, 0–100.
- **Active time:** time the tab was visible, from arrival on the offer page to the click.
- **The flow:** step 1 asks for nothing; "Gå vidare till betalning" sends `purchase_intent_submit` and stores nothing.
  The last step asks for first name and e-mail beside an unticked consent box, and its send button only works with the
  box ticked. Only then is anything stored in D1, with `update_status` `ja`. "Nej tack" stores nothing.
- **One id per visit:** `registration_id` is created in step 1 and kept for the tab's visit to the flow, so the intent,
  the notice, the choice and a stored registration share it.
- **Stored, not attempted:** `updates_choice` with `ja` is only sent after the server confirmed the save. A visitor who
  never answers has no `updates_choice`: count them as "no choice", not as nej.
- **Direct visits:** opening `/kop/uppdatering` or `/kop/tack` without going through the flow sends no step event.
- **Repeat clicks:** every buy click is sent; count them once per session for conversion rates.
- **The practice example:** a game starts at its first key, from "Spela", a key, or after "Lyssna". "Börja om" or a
  key after a finished game starts the next `attempt`. A visitor who plays without finishing has a `practice_start`
  and no `practice_complete`. To see whether playing goes with buying, compare `purchase_click` for sessions with and
  without a `practice_start`.

## Reports

All reports from brief B §8, with filters and the session rates, are in [`REPORTS.md`](REPORTS.md).

## Measurement loss

Expect GA4 to count fewer events than actually happened:

- **Declined or unanswered consent:** the largest loss. GA4 only sees visitors who accepted, so every rate is
  computed within that group (brief B §9). D1 stores only registrations with the consent box ticked, whatever the
  analytics choice, with `analytics_consent`. Purchase intent itself is only in GA4.
- **Deciding after leaving the arrival page:** the ad source is only in the arrival URL until the visitor accepts. A
  visitor who accepts on a later page is measured without a source.
- **Blockers:** ad and tracking blockers block `googletagmanager.com` and `google-analytics.com`, more often than most
  analytics tools. Registrations still reach D1, so compare
  `updates_choice` with `ja` against the D1 count to see the share lost.
- **Closing the tab:** `section_exposure_end` is sent when a view ends; when a visitor closes the tab mid-view it may
  not arrive, so exposure times are lower bounds.
- **Bots:** GA4 drops traffic from known bots and spiders.
- **In-app browsers:** Facebook and Instagram use the phone's browser engine; the tests cover both (Safari and
  Chromium). GA4 sends events in batches and flushes them when the page is left.

## Verification

The verification scenarios from brief B §10 run as automated tests in `tests/tracking.spec.ts`. They run on desktop
Chrome, desktop Safari, iPhone 15 (Safari) and Pixel 7 (Chrome).

| Scenario                                                                              | Result                                                                                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| An ad-tagged link to a registration keeps the source and message through the flow     | Passes: the same source on `offer_view`, `checkout_view` and the D1 registration                            |
| Each of the five buy buttons records its own CTA id, which follows along              | Passes (`tests/acceptance.spec.ts`)                                                                         |
| Down the whole page, back to the hero, then buy                                       | Passes: `cta_id` `kop_hero`, `max_section_seen` `sektion_prenumeration`, `last_section_seen` `sektion_hero` |
| A visit without a click keeps the sections seen and the maximum scroll                | Passes                                                                                                      |
| A form error and failed storage are recorded, without a choice                        | Passes: `checkout_error` with `validation` and `save_failed`; no `updates_choice`                           |
| A double click or going back and on gives one intent, one registration and one choice | Passes                                                                                                      |
| Nothing is stored without the ticked box; nej and leaving store nothing               | Passes (`tests/acceptance.spec.ts`)                                                                         |
| With analytics blocked, the purchase flow works                                       | Passes; the loss is described above                                                                         |
| Changing a heading or button text keeps events and fixed ids working                  | Passes: ids are fixed in code, independent of `copy.yaml` (`tests/acceptance.spec.ts`)                      |

Still to check by hand once the container is published: events from a branch preview arrive in GA4's **Realtime**
report, tagged `environment = preview`.

### Known limitations

- **Buy buttons and the consent banner:** the bar steps aside for buy buttons (see [Consent](#consent)), so it never
  covers one. On the front page, on screens too short for the hero and the bar together (iPhone SE, phones held sideways,
  1024×600),
  a visitor who leaves without scrolling or clicking is never asked, and so is not measured.
- **Exposure times are lower bounds:** an episode ending when the tab closes may not be sent.
- **Ad clicks are not on the site:** clicks and click-through rates come from the ad platform; the site counts arrivals.
- **Sessions are per browser:** the same person on phone and laptop is two sessions, by design (brief B §2).
- **Thresholds and sampling:** GA4 may hide rows with few users in reports and sample large explorations. At the
  test's traffic levels, expect small numbers to be withheld.
- **Processing delay:** standard reports and explorations can take up to a day to show new events; Realtime and
  DebugView show them at once.
- **Still to do by hand:** a visit through the Facebook and Instagram in-app browsers on a real phone.

## Testing

- Open the site with `?test` to mark the whole tab as `environment = test`; its registrations get `is_test = 1`.
- `npm run test:e2e` runs `tests/tracking.spec.ts` with Tag Manager stubbed out: nothing reaches Google. The stub
  merges the data layer like Tag Manager does, so the tests also check that no parameter carries over between events.
- In Tag Manager's **Preview**, or GA4's **DebugView**, events from your own browser show as they happen.
