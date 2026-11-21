/**
 * Reads back what GA4 has received, through the Google Analytics Data API, to check that the site's events and
 * their parameters arrive (docs/TRACKING.md).
 *
 *   GA_ACCESS_TOKEN=… npm run ga4:check -- --property=564064130
 *
 * 1. Realtime, the last 30 minutes: event counts per event name. Realtime can't show event parameters.
 * 2. The last 7 days (--days=N to change), production traffic only: the flow event by event, which source GA4
 *    attributed sessions to, where sessions started, and the main custom dimensions. Standard reports take from a
 *    few hours up to a day to include new events.
 *
 * GA_ACCESS_TOKEN needs the scope https://www.googleapis.com/auth/analytics.readonly (see ga4-setup.mjs for how to
 * get one; tick this scope instead of, or as well as, analytics.edit).
 */

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const property = arg('property');
const period = Number(arg('days') ?? 7);
const token = process.env.GA_ACCESS_TOKEN;
if (!property || !/^\d+$/.test(property) || !token) {
  console.error('Usage: GA_ACCESS_TOKEN=… npm run ga4:check -- --property=564064130');
  process.exit(1);
}

async function report(kind, body) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:${kind}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${kind}: ${response.status} ${result.error?.message ?? ''}`);
  return (result.rows ?? []).map((row) => [
    ...row.dimensionValues.map((value) => value.value),
    ...row.metricValues.map((value) => value.value),
  ]);
}

const print = (title, rows) => {
  console.log(`\n${title}`);
  if (rows.length === 0) console.log('  (nothing yet)');
  for (const row of rows) console.log(`  ${row.slice(0, -1).join('  ·  ')}  →  ${row.at(-1)}`);
};

print(
  'Realtime, last 30 minutes: events',
  await report('runRealtimeReport', {
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
  }),
);

print(
  'Realtime: events per minute ago, device and city',
  await report('runRealtimeReport', {
    dimensions: [{ name: 'minutesAgo' }, { name: 'eventName' }, { name: 'deviceCategory' }, { name: 'city' }],
    metrics: [{ name: 'eventCount' }],
    orderBys: [{ dimension: { dimensionName: 'minutesAgo' } }],
  }),
);

const days = [{ startDate: `${period}daysAgo`, endDate: 'today' }];
const production = { filter: { fieldName: 'customEvent:environment', stringFilter: { value: 'production' } } };
const eventIs = (name) => ({ filter: { fieldName: 'eventName', stringFilter: { value: name } } });
const both = (...expressions) => ({ andGroup: { expressions } });
const notSet = (field) => ({ notExpression: { filter: { fieldName: field, stringFilter: { value: '(not set)' } } } });
const standard = (title, body) =>
  report('runReport', { dateRanges: days, limit: 30, ...body }).then((rows) =>
    print(`Last ${period} days: ${title}`, rows),
  );

await standard('events per environment (everything else below is production only)', {
  dimensions: [{ name: 'customEvent:environment' }],
  metrics: [{ name: 'eventCount' }],
});

await standard('the flow, event by event', {
  dimensions: [{ name: 'eventName' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: production,
  orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
});

await standard('sessions per source / medium / campaign (what GA4 attributes the session to)', {
  dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }, { name: 'sessionCampaignName' }],
  metrics: [{ name: 'sessions' }],
  dimensionFilter: production,
  orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
});

await standard('sessions per landing page and source (where GA4 started the session)', {
  dimensions: [{ name: 'landingPagePlusQueryString' }, { name: 'sessionSource' }],
  metrics: [{ name: 'sessions' }],
  dimensionFilter: production,
  orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
});

await standard('offer_view: the session source GA4 gave, against the ad tagging the site sent', {
  dimensions: [{ name: 'sessionSource' }, { name: 'customEvent:message_id' }, { name: 'customEvent:utm_content' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: both(production, eventIs('offer_view')),
});

for (const [event, dimension] of [
  ['purchase_click', 'cta_id'],
  ['section_view', 'section_id'],
  ['updates_choice', 'choice'],
]) {
  await standard(`${event} per ${dimension}`, {
    dimensions: [{ name: `customEvent:${dimension}` }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: both(production, eventIs(event), notSet(`customEvent:${dimension}`)),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  });
}
