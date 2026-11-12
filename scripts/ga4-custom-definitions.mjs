/**
 * Registers the site's event parameters as GA4 custom dimensions and metrics (docs/TRACKING.md), through the
 * Google Analytics Admin API. Definitions that already exist are left alone, so it is safe to run again.
 *
 *   GA_ACCESS_TOKEN=… npm run ga4:definitions -- --property=123456789          → shows what would be created
 *   GA_ACCESS_TOKEN=… npm run ga4:definitions -- --property=123456789 --yes    → creates them
 *
 * --property is the numeric property ID (GA4 → Admin → Property details), not the G- measurement ID.
 * GA_ACCESS_TOKEN is an OAuth access token with the scope https://www.googleapis.com/auth/analytics.edit, for
 * a Google account with the Editor role on the property. One way to get one, valid for an hour:
 * https://developers.google.com/oauthplayground → "Google Analytics Admin API v1" → analytics.edit →
 * Authorize APIs → Exchange authorization code for tokens → copy "Access token".
 */

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

async function call(path, init = {}) {
  const response = await fetch(`${base}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
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
if (!apply && missing.length > 0) console.log('\nRun again with --yes to create them.');
