# Reports

The reports from brief B §8, built in Google Analytics 4. Events and parameters: [`TRACKING.md`](TRACKING.md). Before
any of these work, the custom dimensions must be registered ([Setting up GA4](TRACKING.md#setting-up-ga4)).

## How to use them

Each report is an exploration under **Explore** in GA4, named in Swedish as below. Save them in the property so the
client sees the same ones.

- **Filters:** every exploration can be narrowed by date and by the dimensions `utm_source`, `message_id`,
  `page_version` and device category, with a filter or a comparison.
- **Time zone:** set the property's time zone to Sweden (**Admin → Property details**). Events carry `event_timestamp`
  in UTC as well.
- **Changing a report:** change the exploration in GA4, and update its description here so the two stay the same.
- **Not yet checked against real data:** these explorations were written for the new setup on 2026-11-12, before any
  events had reached GA4. Check them once the first test sessions are in.

Ground rules for every report:

- **The unit is the session**, not the person. In explorations, use **Sessions** as the metric and session-scoped
  segments. A session ends after 30 minutes of inactivity.
- **Only production traffic.** Add the filter `environment` exactly matches `production` to every exploration, which
  leaves out previews, local development and test sessions (`?test`).
- **Rates stay within GA4.** Every share is computed from sessions GA4 measured. Registrations stored in D1 but not
  seen in GA4 are counted separately, in [Data quality](#data-quality).
- **Descriptive, not causal.** Comparisons between sections, buttons and ads describe what happened. They don't show
  that a section or an ad caused it.

## Whole flow

**Hela flödet:** a **Funnel exploration**, open funnel off, steps in this order:

1. `offer_view`
2. `purchase_click`
3. `checkout_view`
4. `purchase_intent_submit`
5. `updates_choice` with `choice` = `ja`

Show elapsed time on. The completion rate between steps gives the session rates from brief B §8: offer to click, click
to purchase step, purchase step to intent, and intent to "ja". Repeat clicks in one session count once.

## Per ad and message

**Per annons och budskap:** a **Free form** exploration.

- Rows: `utm_source`, `utm_campaign`, `message_id`, `ad_id`. `(not set)` is arrivals without tagging.
- Values: **Sessions**, and **Event count** with the event name as columns, filtered to `offer_view`,
  `purchase_click`, `purchase_intent_submit` and `updates_choice`.

`utm_medium` separates paid traffic (`paid_social`) from the rest. These are arrivals on the site; ad clicks are counted
by the ad platform and reported there. GA4's own **Session campaign** dimensions read the same UTM parameters from the
arrival URL, and can be used instead of the event parameters for the standard UTM fields.

## Per section

**Per sektion:** a **Free form** exploration.

- Rows: `section_id`.
- Columns: event name, filtered to `section_view`, `cta_view` and `purchase_click`.
- Values: **Sessions**.

For the CTA click rate per section, build a funnel `cta_view` → `purchase_click` broken down by `cta_id`: it counts
clicks only among sessions that saw the button, so a quick scroll-and-tap without a qualified view isn't in the rate.

Exposure in more detail, **Exponering per sektion:** Free form with rows `section_id`, filtered to the event
`section_exposure_end`, and the custom metric `exposure_ms` (sum and average). `view_count` above 1 on `section_view`
is a revisit. Exposure times are lower bounds; see [Measurement loss](TRACKING.md#measurement-loss).

To follow one session's views in order, use a **User explorer** on one user and read `section_view` with `view_order`.

## Before the click

**Före klicket:** Free form, filtered to `purchase_click`, with rows `cta_id` and columns `max_section_seen`, value
**Event count**. A click on the hero after seeing the whole page shows as `kop_hero` with `sektion_prenumeration`.
`sections_seen` holds the whole list, comma-separated.

## Without a click

**Utan klick:** Free form with the segment "sessions with `offer_view` and without `purchase_click`" (a session segment
with an exclusion), rows `max_section_seen` on `section_view`, value **Sessions**. This is each session's recorded
progress, not a last "leaving" event (brief B §7). Read the deepest section per session from the highest
`section_position` reached.

## Purchase step

**Köpsteget:** a Funnel exploration, `checkout_view` → `purchase_intent_submit` → `checkout_start` →
`updates_choice` (`choice` = `ja`), broken down by `cta_id`. Alongside it, a Free form with event count for
`checkout_back` and `checkout_error`.

**Fel per fält:** Free form filtered to `checkout_error`, rows `category` and `fields`, value **Event count**.

## Update choice

**Uppdateringsval:** Free form filtered to `updates_choice`, rows `choice`, value **Sessions**, next to the session
count of `availability_notice_view`. Sessions with the notice but without `updates_choice` are "no choice", never
"nej".

Since 2026-11-08 a purchase intent stores nothing; only a "ja" with the consent box ticked is stored in D1, with first
name and e-mail. `npm run export:registrations` lists them; "nej" and no choice are only in GA4.

## Practice game

**Övningsspelet:** the playable example in "Så fungerar" (events in [`TRACKING.md`](TRACKING.md)).

- How many play and finish: a Funnel exploration, `offer_view` → `practice_start` → `practice_complete`.
- Wrong keys and hints: Free form filtered to `practice_complete`, rows `hinted`, values average `misses` and
  `duration_ms`.
- Players and buying: two segments, sessions with and without `practice_start`, compared on the funnel `offer_view` →
  `purchase_click`.

The two click rates show whether players and non-players differ, not that the game causes the difference: visitors
who are already interested are more likely to play.

## Data quality

**Traffic by environment:** Free form with rows `environment`, value **Sessions**: shows how much the `production`
filter leaves out as tests and previews.

**Missing source:** in **Reports → Acquisition → Traffic acquisition**, the share of sessions with session source
`(direct)` or without a campaign.

**Stored vs measured registrations** (brief B §8 and §9). GA4 can only count what it received: blockers, and visitors
who decline or don't answer the consent question, mean fewer registrations there than in D1. A registration is a stored
"ja" from the last step.

1. In GA4, count `updates_choice` with `choice` = `ja` for the period (**Mätta registreringar**).
2. Run the D1 side for the same period (Swedish dates, both included; see [`ADMIN.md`](ADMIN.md)):

   ```sh
   npm run report:registrations -- --from=2026-11-01 --to=2026-11-30
   ```

3. Read them side by side:
   - **measurement accepted** in D1 against GA4: the difference is mostly blockers;
   - **declined** and **no choice** are registrations GA4 never sees, by design;
   - compute every rate within GA4's numbers only.

Bots: GA4 drops traffic from known bots and spiders. It never reaches these reports.
