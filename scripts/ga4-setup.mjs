/**
 * Sets up the GA4 property for the site through the Google Analytics Admin API, in three steps that are each
 * skipped when already done, so it is safe to run again:
 *
 * 1. a web data stream for the site, created here and never combined with a Tag Manager container (a stream
 *    set up through Tag Manager got combined with its container, and then received no data);
 * 2. event data kept for 14 months instead of the default 2, so explorations reach back that far;
 * 3. the event parameters registered as custom dimensions and metrics (docs/TRACKING.md).
 *
 *   GA_ACCESS_TOKEN=… npm run ga4:setup -- --property=564064130          → shows what it would do
 *   GA_ACCESS_TOKEN=… npm run ga4:setup -- --property=564064130 --yes    → does it
 *
 * It prints the stream's measurement ID (G-…), which goes in `site.ga4Id` in src/config/site.ts.
 *
 * --property is the numeric property ID (GA4 → Admin → Property details), not the G- measurement ID.
 * GA_ACCESS_TOKEN is an OAuth access token with the scope https://www.googleapis.com/auth/analytics.edit, for
 * a Google account with the Editor role on the property. One way to get one, valid for an hour:
 * https://developers.google.com/oauthplayground → "Google Analytics Admin API v1" → analytics.edit →
 * Authorize APIs → Exchange authorization code for tokens → copy "Access token".
 */

const STREAM_NAME = 'Musikhjältarna direkt';
const SITE_URL = 'https://musikhjaltarna.se';

/** Event-scoped custom dimensions: text values to group and filter by. */
const DIMENSIONS = [
  ['page_version', 'Commit and content hash of the page'],
  ['environment', 'production, preview, test or development'],
  ['message_id', 'Which message the ad tests'],
  ['ad_id', "The ad platform's id for the ad"],
  ['utm_content', 'Ad creative'],
  ['section_id', 'Section of the offer page'],
  ['section_position', 'Section position on the page, 1–5'],
  ['view_order', 'Order of the section view in the visit'],
  ['view_count', 'Views of this section so far; above 1 is a revisit'],
  ['cta_id', 'Buy button'],
  ['max_section_seen', 'Lowest section seen before the event'],
  ['last_section_seen', 'Last section seen before the event'],
  ['sections_seen', 'Sections seen before the click, comma-separated'],
  ['category', 'Kind of checkout error'],
  ['fields', 'Fields that failed validation, comma-separated'],
  ['choice', 'Update choice: ja or nej'],
  ['link_id', 'External link'],
  ['placement', 'Where the external link sits'],
  ['hinted', 'A key hint was shown in the practice game'],
];

/** Event-scoped custom metrics: numbers to sum and average. */
const METRICS = [
  ['max_scroll_percent', 'Deepest scroll, 0–100', 'STANDARD'],
  ['exposure_ms', 'Time a section was in view', 'MILLISECONDS'],
  ['time_to_click', 'Time from arrival to the buy click', 'MILLISECONDS'],
  ['active_time_to_click', 'Visible-tab time from arrival to the buy click', 'MILLISECONDS'],
  ['attempt', 'Practice game number on this page view', 'STANDARD'],
  ['misses', 'Wrong keys in a practice game', 'STANDARD'],
  ['duration_ms', 'Practice game time from the first key', 'MILLISECONDS'],
];

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const property = arg('property');
const token = process.env.GA_ACCESS_TOKEN;
const apply = process.argv.includes('--yes');

if (!property || !/^\d+$/.test(property)) {
  console.error('Give the numeric property ID: --property=123456789 (GA4 → Admin → Property details).');
  process.exit(1);
}
if (!token) {
  console.error('Set GA_ACCESS_TOKEN to an access token with the analytics.edit scope (see the top of this file).');
  process.exit(1);
}

const base = `https://analyticsadmin.googleapis.com/v1beta/properties/${property}`;

/** One API call, retried a few times when Google answers 429 or 5xx (the Admin API is briefly unavailable at times). */
async function call(path, init = {}, attempt = 1) {
  const response = await fetch(`${base}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    return call(path, init, attempt + 1);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${response.status} ${body.error?.message ?? ''}`);
  return body;
}

/** Every existing parameter name of a kind, across pages. */
async function existing(kind) {
  const names = new Set();
  let pageToken = '';
  do {
    const page = await call(`${kind}?pageSize=200${pageToken ? `&pageToken=${pageToken}` : ''}`);
    for (const definition of page[kind] ?? []) names.add(definition.parameterName);
    pageToken = page.nextPageToken ?? '';
  } while (pageToken);
  return names;
}

// 1. The web data stream.
const streams = (await call('dataStreams?pageSize=200')).dataStreams ?? [];
let stream = streams.find((candidate) => candidate.displayName === STREAM_NAME);
if (stream) {
  console.log(`Stream "${STREAM_NAME}" exists.`);
} else if (apply) {
  stream = await call('dataStreams', {
    method: 'POST',
    body: JSON.stringify({
      type: 'WEB_DATA_STREAM',
      displayName: STREAM_NAME,
      webStreamData: { defaultUri: SITE_URL },
    }),
  });
  console.log(`Created stream "${STREAM_NAME}".`);
} else {
  console.log(`Would create the web stream "${STREAM_NAME}" for ${SITE_URL}.`);
}

// 2. Data retention.
const retention = await call('dataRetentionSettings');
if (retention.eventDataRetention === 'FOURTEEN_MONTHS') {
  console.log('Event data is kept for 14 months.');
} else if (apply) {
  await call('dataRetentionSettings?updateMask=eventDataRetention', {
    method: 'PATCH',
    body: JSON.stringify({ eventDataRetention: 'FOURTEEN_MONTHS' }),
  });
  console.log('Event data is now kept for 14 months.');
} else {
  console.log(`Would keep event data for 14 months instead of ${retention.eventDataRetention}.`);
}

// 3. Custom dimensions and metrics.
const plan = [
  ...DIMENSIONS.map(([parameterName, description]) => ({
    kind: 'customDimensions',
    body: { parameterName, displayName: parameterName, description, scope: 'EVENT' },
  })),
  ...METRICS.map(([parameterName, description, measurementUnit]) => ({
    kind: 'customMetrics',
    body: { parameterName, displayName: parameterName, description, scope: 'EVENT', measurementUnit },
  })),
];

const have = { customDimensions: await existing('customDimensions'), customMetrics: await existing('customMetrics') };
const missing = plan.filter(({ kind, body }) => !have[kind].has(body.parameterName));

console.log(`Property ${property}: ${plan.length - missing.length} of ${plan.length} already registered.`);
for (const { kind, body } of missing) {
  const label = `${kind === 'customDimensions' ? 'dimension' : 'metric   '} ${body.parameterName}`;
  if (!apply) {
    console.log(`  would create ${label}`);
    continue;
  }
  await call(kind, { method: 'POST', body: JSON.stringify(body) });
  console.log(`  created ${label}`);
}
if (stream) console.log(`\nMeasurement ID: ${stream.webStreamData?.measurementId} → site.ga4Id in src/config/site.ts`);
if (!apply) console.log('\nRun again with --yes to do it.');
