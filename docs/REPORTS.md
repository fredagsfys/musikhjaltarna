# Reports

The reports from brief B §8, as SQL for PostHog (project `330450`). Events and properties: [`TRACKING.md`](TRACKING.md).

## How to use them

All reports below are on the PostHog dashboard
[**Musikhjältarna – köpavsiktstest**](https://eu.posthog.com/project/330450/dashboard/1075531), one tile each, named
in Swedish.

- **Filters:** `{filters}` in each query picks up the dashboard's date range and property filters, so the whole
  dashboard can be filtered by:
  - date;
  - ad source (`utm_source`) and message (`message_id`);
  - page version (`page_version`);
  - device type (`$device_type`).
- **Time zone:** the project's time zone is Europe/Stockholm. Times are stored in UTC and shown in Swedish time.
- **Changing a report:** edit the tile's SQL in PostHog, and update the query here so the two stay the same. To try a
  query first, paste it into PostHog's **SQL editor**.
- **Checked:** every query was run on 2026-11-02 against test sessions covering the whole flow, two ads, an untagged
  visit and a visit without a click, and gave the expected numbers.

Ground rules for every report:

- **The unit is the session**, not the person. A session ends after 30 minutes of inactivity.
- **Only production traffic.** Every query keeps `environment = 'production'`, which leaves out previews, local
  development and test sessions (`?test`).
- **Rates stay within PostHog.** Every share is computed from sessions PostHog measured. Registrations stored in D1
  but not seen in PostHog are counted separately, in [Data quality](#data-quality).
- **Descriptive, not causal.** Comparisons between sections, buttons and ads describe what happened. They don't show
  that a section or an ad caused it.

## Sessions

Most reports start from one row per session. This block is repeated at the top of those queries:

```sql
WITH sessions AS (
  SELECT
    $session_id AS session,
    -- The session's ad source, from its first event.
    coalesce(argMin(properties.utm_source, timestamp), '(ingen källa)') AS source,
    coalesce(argMin(properties.utm_medium, timestamp), '(ingen)') AS medium,
    coalesce(argMin(properties.message_id, timestamp), '(inget budskap)') AS message,
    coalesce(argMin(properties.ad_id, timestamp), '(ingen annons)') AS ad,
    argMin(properties.page_version, timestamp) AS page_version,
    argMin(properties.$device_type, timestamp) AS device,
    countIf(event = 'offer_view') > 0 AS offer,
    countIf(event = 'purchase_click') > 0 AS clicked,
    countIf(event = 'checkout_view') > 0 AS checkout,
    countIf(event = 'checkout_start') > 0 AS started,
    countIf(event = 'purchase_intent_submit') > 0 AS registered,
    uniqIf(properties.registration_id, event = 'purchase_intent_submit') AS registrations,
    uniqIf(properties.registration_id, event = 'updates_choice' AND properties.choice = 'ja') AS ja
  FROM events
  WHERE properties.environment = 'production' AND {filters}
  GROUP BY session
)
```

## Whole flow

Counts and shares from offer page to "ja", with the four session rates from brief B §8.

```sql
WITH sessions AS ( ... )
SELECT
  countIf(offer) AS offer_sessions,
  countIf(offer AND clicked) AS click_sessions,
  countIf(offer AND checkout) AS checkout_sessions,
  countIf(offer AND started) AS started_sessions,
  countIf(offer AND registered) AS registration_sessions,
  sumIf(registrations, offer) AS registrations,
  sumIf(ja, offer) AS ja,
  round(click_sessions / offer_sessions * 100, 1) AS meningsfullt_pct,       -- sessions with a click / offer sessions
  round(registration_sessions / offer_sessions * 100, 1) AS vardefullt_pct,  -- sessions with a registration / offer sessions
  round(registration_sessions / checkout_sessions * 100, 1) AS purchase_step_pct,  -- registration / checkout view
  round(ja / registrations * 100, 1) AS update_interest_pct                  -- registrations with ja / registrations
FROM sessions
```

## Per ad and message

Arrivals, clicks and registrations for each ad. Rows without a source are kept as `(ingen källa)`. `medium` separates
paid traffic (`paid_social`) from the rest. These are arrivals on the site; ad clicks are counted by the ad platform
and reported there.

```sql
WITH sessions AS ( ... )
SELECT
  source, medium, message, ad,
  countIf(offer) AS arrivals,
  countIf(offer AND clicked) AS click_sessions,
  sumIf(registrations, offer) AS registrations,
  sumIf(ja, offer) AS ja,
  round(click_sessions / arrivals * 100, 1) AS meningsfullt_pct,
  round(countIf(offer AND registered) / arrivals * 100, 1) AS vardefullt_pct
FROM sessions
GROUP BY source, medium, message, ad
HAVING arrivals > 0
ORDER BY arrivals DESC
```

## Per section

For each section: sessions that saw it, saw its buy button, and clicked its buy button. The CTA click rate counts clicks
only among sessions that saw the button (a qualified `cta_view`), so a quick scroll-and-tap without a qualified view
is in `clicked_cta_sessions` but not in the rate.

```sql
WITH per_session AS (
  SELECT
    properties.section_id AS section,
    $session_id AS session,
    countIf(event = 'section_view') > 0 AS exposed,
    countIf(event = 'cta_view') > 0 AS saw_cta,
    countIf(event = 'purchase_click') > 0 AS clicked
  FROM events
  WHERE event IN ('section_view', 'cta_view', 'purchase_click')
    AND properties.environment = 'production' AND {filters}
  GROUP BY section, session
)
SELECT
  section,
  countIf(exposed) AS exposed_sessions,
  countIf(saw_cta) AS saw_cta_sessions,
  countIf(clicked) AS clicked_cta_sessions,
  countIf(saw_cta AND clicked) AS clicked_after_seeing,
  round(clicked_after_seeing / saw_cta_sessions * 100, 1) AS cta_click_rate_pct
FROM per_session
GROUP BY section
ORDER BY section
```

Exposure in more detail: when each section was first seen, the total time it was seen, and how often it was revisited.

```sql
SELECT
  properties.section_id AS section,
  round(median(if(event = 'section_view' AND toInt(properties.view_count) = 1,
                  toFloat(properties.time_since_arrival), NULL)) / 1000, 1) AS median_s_to_first_view,
  round(sumIf(toFloat(properties.exposure_ms), event = 'section_exposure_end')
        / uniqIf($session_id, event = 'section_view') / 1000, 1) AS avg_s_seen_per_session,
  countIf(event = 'section_view' AND toInt(properties.view_count) > 1) AS revisits
FROM events
WHERE event IN ('section_view', 'section_exposure_end')
  AND properties.environment = 'production' AND {filters}
GROUP BY section
ORDER BY section
```

The order of views in a session is in `view_order` on `section_view`. To follow one session, filter on its
`$session_id` and sort by `view_order`. Exposure times are lower bounds; see
[Measurement loss](TRACKING.md#measurement-loss).

## Before the click

The clicked button compared with the lowest section the visitor had seen at that moment. A click on the hero after
seeing the whole page shows as `kop_hero` with `sektion_prenumeration`.

```sql
SELECT
  properties.cta_id AS clicked_cta,
  properties.max_section_seen AS lowest_section_seen,
  count() AS clicks,
  uniq($session_id) AS sessions,
  round(median(toFloat(properties.max_scroll_percent)), 0) AS median_scroll_pct,
  round(median(toFloat(properties.active_time_to_click)) / 1000, 1) AS median_active_s
FROM events
WHERE event = 'purchase_click' AND properties.environment = 'production' AND {filters}
GROUP BY clicked_cta, lowest_section_seen
ORDER BY clicked_cta, lowest_section_seen
```

## Without a click

Offer-page sessions without a buy click, by the lowest section they saw. This is the session's recorded progress, not a
last "leaving" event (brief B §7).

```sql
WITH progress AS (
  SELECT
    $session_id AS session,
    argMaxIf(properties.section_id, toInt(properties.section_position), event = 'section_view') AS lowest_section,
    maxIf(toInt(properties.max_scroll_percent), event IN ('section_view', 'section_exposure_end')) AS max_scroll,
    countIf(event = 'offer_view') > 0 AS offer,
    countIf(event = 'purchase_click') > 0 AS clicked
  FROM events
  WHERE properties.environment = 'production' AND {filters}
  GROUP BY session
)
SELECT
  if(lowest_section = '', '(ingen sektion sedd)', lowest_section) AS lowest_section_seen,
  count() AS sessions,
  round(median(max_scroll), 0) AS median_scroll_pct
FROM progress
WHERE offer AND NOT clicked
GROUP BY lowest_section_seen
ORDER BY lowest_section_seen
```

## Purchase step

From the form being shown to a stored registration, with errors and "Tillbaka".

```sql
SELECT
  uniqIf($session_id, event = 'checkout_view') AS checkout_sessions,
  uniqIf($session_id, event = 'checkout_start') AS started_sessions,
  uniqIf($session_id, event = 'checkout_error' AND properties.category = 'validation') AS validation_error_sessions,
  uniqIf($session_id, event = 'checkout_error' AND properties.category = 'save_failed') AS save_failed_sessions,
  uniqIf($session_id, event = 'checkout_back') AS back_sessions,
  uniqIf($session_id, event = 'purchase_intent_submit') AS registration_sessions,
  round(registration_sessions / checkout_sessions * 100, 1) AS purchase_step_pct
FROM events
WHERE properties.environment = 'production' AND {filters}
```

Which fields fail validation:

```sql
SELECT arrayJoin(JSONExtract(properties.fields, 'Array(String)')) AS field, count() AS errors
FROM events
WHERE event = 'checkout_error' AND properties.category = 'validation'
  AND properties.environment = 'production' AND {filters}
GROUP BY field
```

## Update choice

"Ja", "nej" and no choice, kept separate from purchase intent. A registration without `updates_choice` counts as no
choice, never as "nej".

```sql
WITH registrations AS (
  SELECT
    properties.registration_id AS registration,
    argMaxIf(properties.choice, timestamp, event = 'updates_choice') AS choice
  FROM events
  WHERE event IN ('purchase_intent_submit', 'updates_choice')
    AND properties.environment = 'production' AND {filters}
  GROUP BY registration
  HAVING countIf(event = 'purchase_intent_submit') > 0
)
SELECT
  count() AS registrations,
  countIf(choice = 'ja') AS ja,
  countIf(choice = 'nej') AS nej,
  countIf(coalesce(choice, '') = '') AS inget_val,
  round(ja / registrations * 100, 1) AS update_interest_pct
FROM registrations
```

Since 2026-11-08 a purchase intent stores nothing; only a "ja" with the consent box ticked is stored in D1, with first
name and e-mail. `npm run export:registrations` lists them; "nej" and no choice are only in PostHog.

## Data quality

**Traffic by environment:** shows how much was left out of the reports above as tests and previews.

```sql
SELECT properties.environment AS environment, uniq($session_id) AS sessions, count() AS events
FROM events
WHERE {filters}
GROUP BY environment
```

**Missing source:** the share of production arrivals without ad tagging, by the session's first-touch source.

```sql
WITH sessions AS ( ... )
SELECT
  countIf(offer) AS arrivals,
  countIf(offer AND source = '(ingen källa)') AS without_source,
  round(without_source / arrivals * 100, 1) AS without_source_pct
FROM sessions
```

**Stored vs measured registrations** (brief B §8 and §9). PostHog can only count what it received: blockers, and
visitors who decline or don't answer the consent question, mean fewer registrations there than in D1. A registration is
a stored "ja" from the last step.

1. Set the period on the dashboard and read the tile **Mätta registreringar**:

   ```sql
   SELECT uniq(properties.registration_id) AS measured_registrations
   FROM events
   WHERE event = 'updates_choice' AND properties.choice = 'ja'
     AND properties.environment = 'production' AND {filters}
   ```

2. Run the D1 side for the same period (Swedish dates, both included; see [`ADMIN.md`](ADMIN.md)):

   ```sh
   npm run report:registrations -- --from=2026-11-01 --to=2026-11-30
   ```

   It prints the stored registrations, without tests, split by the visitor's analytics choice: accepted (measurable),
   declined and no choice, plus the update choices.

3. Read them side by side:
   - **measurable** minus **Mätta registreringar** is loss from blockers and aborted loads;
   - **declined** and **no choice** are registrations PostHog never sees, by design;
   - compute every rate within PostHog's numbers only.

Bots: PostHog drops events from browsers that identify themselves as automated. They never reach these reports.
