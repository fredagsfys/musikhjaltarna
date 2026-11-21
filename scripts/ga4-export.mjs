/**
 * Exports what GA4 holds for the site to one JSON file, through the Google Analytics Data API, for analysis outside
 * GA4: every event, source, landing page, device and custom dimension, per day and environment.
 *
 *   GA_ACCESS_TOKEN=… npm run ga4:export -- --property=564064130 --out=ga4-export.json [--from=2026-11-12]
 *
 * GA_ACCESS_TOKEN needs the scope https://www.googleapis.com/auth/analytics.readonly (see ga4-check.mjs). The file
 * holds counts only, never names or e-mail addresses; GA4 receives none. A report GA4 refuses is kept in the file
 * with its error, so one bad combination doesn't stop the rest.
 */

import { writeFileSync } from 'node:fs';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const property = arg('property');
const out = arg('out');
const from = arg('from') ?? '2026-11-12';
const token = process.env.GA_ACCESS_TOKEN;
if (!property || !/^\d+$/.test(property) || !out || !token) {
  console.error('Usage: GA_ACCESS_TOKEN=… npm run ga4:export -- --property=564064130 --out=ga4-export.json');
  process.exit(1);
}

/** The event parameters registered as custom dimensions and metrics (ga4-setup.mjs). */
const DIMENSIONS = [
  'page_version',
  'message_id',
  'ad_id',
  'utm_content',
  'section_id',
  'section_position',
  'view_order',
  'view_count',
  'cta_id',
  'max_section_seen',
  'last_section_seen',
  'sections_seen',
  'category',
  'fields',
  'choice',
  'link_id',
  'placement',
  'hinted',
];
const METRICS = [
  'max_scroll_percent',
  'exposure_ms',
  'time_to_click',
  'active_time_to_click',
  'attempt',
  'misses',
  'duration_ms',
];

const dateRanges = [{ startDate: from, endDate: 'today' }];
const env = { name: 'customEvent:environment' };

async function run(kind, body) {
  const rows = [];
  let offset = 0;
  for (;;) {
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:${kind}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, limit: 100000, offset }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${response.status} ${result.error?.message ?? ''}`);
    const columns = [
      ...(result.dimensionHeaders ?? []).map((h) => h.name),
      ...(result.metricHeaders ?? []).map((h) => h.name),
    ];
    for (const row of result.rows ?? []) {
      const values = [...row.dimensionValues, ...(row.metricValues ?? [])].map((v) => v.value);
      rows.push(Object.fromEntries(columns.map((c, i) => [c.replace('customEvent:', ''), values[i]])));
    }
    offset += result.rows?.length ?? 0;
    if (kind === 'runRealtimeReport' || !result.rows?.length || offset >= (result.rowCount ?? 0)) return rows;
  }
}

const reports = {};
async function add(name, kind, body) {
  process.stdout.write(`${name}… `);
  try {
    reports[name] = await run(kind, body);
    console.log(reports[name].length);
  } catch (error) {
    reports[name] = { error: String(error.message ?? error) };
    console.log(`refused: ${reports[name].error}`);
  }
}

const standard = (dimensions, metrics, extra = {}) => ({
  dateRanges,
  dimensions: dimensions.map((name) => (typeof name === 'string' ? { name } : name)),
  metrics: metrics.map((name) => ({ name })),
  ...extra,
});

await add('realtime', 'runRealtimeReport', {
  dimensions: [{ name: 'minutesAgo' }, { name: 'eventName' }, { name: 'deviceCategory' }],
  metrics: [{ name: 'eventCount' }],
});
await add('events_by_day', 'runReport', standard(['date', env, 'eventName'], ['eventCount', 'totalUsers']));
await add(
  'sessions_by_day',
  'runReport',
  standard(['date', env], ['sessions', 'engagedSessions', 'totalUsers', 'newUsers', 'averageSessionDuration']),
);
await add(
  'acquisition',
  'runReport',
  standard(
    ['date', env, 'sessionSource', 'sessionMedium', 'sessionCampaignName', 'sessionManualAdContent'],
    ['sessions', 'engagedSessions', 'totalUsers'],
  ),
);
await add(
  'first_user_acquisition',
  'runReport',
  standard([env, 'firstUserSource', 'firstUserMedium', 'firstUserCampaignName'], ['totalUsers']),
);
await add(
  'landing_pages',
  'runReport',
  standard(['date', env, 'landingPagePlusQueryString', 'sessionSource', 'sessionMedium'], ['sessions']),
);
await add('pages', 'runReport', standard([env, 'pagePath', 'eventName'], ['eventCount', 'totalUsers']));
await add(
  'technology',
  'runReport',
  standard([env, 'deviceCategory', 'operatingSystem', 'browser'], ['sessions', 'totalUsers']),
);
await add('geography', 'runReport', standard([env, 'country', 'city'], ['sessions', 'totalUsers']));
await add(
  'ad_tagging_vs_attribution',
  'runReport',
  standard(
    [env, 'eventName', 'sessionSource', 'sessionMedium', 'customEvent:message_id', 'customEvent:utm_content'],
    ['eventCount'],
  ),
);
for (const dimension of DIMENSIONS) {
  await add(
    `dimension_${dimension}`,
    'runReport',
    standard([env, 'eventName', `customEvent:${dimension}`], ['eventCount'], {
      dimensionFilter: {
        notExpression: {
          filter: { fieldName: `customEvent:${dimension}`, stringFilter: { value: '(not set)' } },
        },
      },
    }),
  );
}
await add(
  'metrics',
  'runReport',
  standard([env, 'eventName'], ['eventCount', ...METRICS.map((m) => `customEvent:${m}`)]),
);

writeFileSync(out, JSON.stringify({ property, from, exportedAt: new Date().toISOString(), reports }, null, 1));
console.log(`\nSaved to ${out}`);
