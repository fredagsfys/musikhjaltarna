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

### Privacy

- No cookies and no browser storage for analytics. PostHog identifies a visitor for one day by a server-side hash of IP
  address, user agent and a daily rotating salt; the hash is not stored with the events.
- Names, e-mail addresses and form values are never sent. The tests check every request for the test's name and
  address.
- The only thing the site keeps in the browser for tracking is the ad source, in `sessionStorage`
  (`musikhjaltarna:source`), so it can be stored with the registration. It disappears when the tab is closed.
- Whether this needs consent is for the client to confirm before launch (brief B §9).

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
| `external_link_click`       | A link to Pianotopia's website is clicked             | `link_id` (`pianotopia_website`), `placement` (`pedagogue`, `footer`, `confirmation`, `declined`)                                                    |

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

PostHog → _SQL editor_. Every query filters on production; drop `utm_source` grouping for totals.

**Funnel per source** (sessions reaching each step):

```sql
SELECT
  properties.utm_source AS source,
  properties.message_id AS message,
  count(DISTINCT if(event = 'offer_view', $session_id, NULL)) AS visits,
  count(DISTINCT if(event = 'purchase_click', $session_id, NULL)) AS clicked,
  count(DISTINCT if(event = 'checkout_start', $session_id, NULL)) AS started,
  count(DISTINCT if(event = 'purchase_intent_submit', properties.registration_id, NULL)) AS registrations,
  count(DISTINCT if(event = 'updates_choice' AND properties.choice = 'ja', properties.registration_id, NULL)) AS ja,
  round(clicked / visits * 100, 1) AS click_rate,
  round(registrations / visits * 100, 1) AS intent_rate
FROM events
WHERE properties.environment = 'production' AND timestamp > now() - INTERVAL 30 DAY
GROUP BY source, message
ORDER BY visits DESC
```

**Sections reached** (share of visits that viewed each section):

```sql
SELECT
  properties.section_id AS section,
  count(DISTINCT $session_id) AS sessions,
  round(avg(toFloat(properties.exposure_ms)) / 1000, 1) AS avg_seconds
FROM events
WHERE event IN ('section_view', 'section_exposure_end') AND properties.environment = 'production'
GROUP BY section
ORDER BY section
```

**Clicks per buy button** (once per session and button):

```sql
SELECT properties.cta_id AS cta, count(DISTINCT $session_id) AS sessions
FROM events
WHERE event = 'purchase_click' AND properties.environment = 'production'
GROUP BY cta
ORDER BY sessions DESC
```

For registrations and choices, D1 is the record: the export (`ADMIN.md`) lists each registration with its source,
page version and update status. PostHog's counts can be lower (see below); they should never be higher.

## Measurement loss

Expect PostHog to count fewer events than actually happened:

- **Blockers:** ad and tracking blockers block `eu.i.posthog.com`. Registrations still reach D1, so compare
  `purchase_intent_submit` with the D1 count to see the share lost.
- **Closing the tab:** `section_exposure_end` is sent when a view ends; when a visitor closes the tab mid-view it may
  not arrive, so exposure times are lower bounds.
- **Bots:** PostHog drops events from browsers that identify as automated.
- **In-app browsers:** Facebook and Instagram use the phone's browser engine; the tests cover both (Safari and
  Chromium). Every event is sent immediately in its own request, so navigation doesn't drop queued events.

## Testing

- Open the site with `?test` to mark the whole tab as `environment = test`; its registrations get `is_test = 1`.
- `npm run test:e2e` runs `tests/tracking.spec.ts` with PostHog stubbed out: nothing reaches the real project.
