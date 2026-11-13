/**
 * Reads back what GA4 has received, through the Google Analytics Data API, to check that the site's events and
 * their parameters arrive (docs/TRACKING.md).
 *
 *   GA_ACCESS_TOKEN=… npm run ga4:check -- --property=564064130
 *
 * 1. Realtime, the last 30 minutes: event counts per event name. Realtime can't show event parameters.
 * 2. Today and yesterday: event counts per event name and environment, and per custom dimension. Standard reports
 *    take from a few hours up to a day to include new events; until then this part is empty or partial.
 *
 * GA_ACCESS_TOKEN needs the scope https://www.googleapis.com/auth/analytics.readonly (see ga4-setup.mjs for how to
 * get one; tick this scope instead of, or as well as, analytics.edit).
 */

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const property = arg('property');
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

const days = [{ startDate: 'yesterday', endDate: 'today' }];
print(
  'Today and yesterday: events per environment',
  await report('runReport', {
    dateRanges: days,
    dimensions: [{ name: 'eventName' }, { name: 'customEvent:environment' }],
    metrics: [{ name: 'eventCount' }],
    orderBys: [{ dimension: { dimensionName: 'eventName' } }],
  }),
);

for (const dimension of ['section_id', 'cta_id', 'message_id', 'max_section_seen']) {
  print(
    `Today and yesterday: ${dimension}`,
    await report('runReport', {
      dateRanges: days,
      dimensions: [{ name: 'eventName' }, { name: `customEvent:${dimension}` }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        notExpression: { filter: { fieldName: `customEvent:${dimension}`, stringFilter: { value: '(not set)' } } },
      },
    }),
  );
}
