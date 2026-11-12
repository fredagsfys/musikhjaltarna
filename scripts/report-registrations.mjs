/**
 * Stored registrations for a period, split by the visitor's analytics choice (brief B §8 and §9).
 * Compare "measurable" with "Mätta registreringar" in GA4 (docs/REPORTS.md) for the same period:
 * the difference is what blockers cost. Declined and undecided registrations are never in GA4.
 *
 *   npm run report:registrations                                     → the last 30 days
 *   npm run report:registrations -- --from=2026-11-01 --to=2026-11-30  (Swedish dates, both included)
 *   npm run report:registrations -- --local                          → the local wrangler dev database
 *   npm run report:registrations -- --json                           → machine-readable
 *
 * Internal tests (`is_test = 1`) are left out and counted separately.
 */
import { isLocal, query, sqlString } from './d1.mjs';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

/** Today's date in Sweden, as YYYY-MM-DD. */
const swedishToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(new Date());

/** The UTC moment a Swedish calendar day starts, as D1 stores it ('YYYY-MM-DD HH:MM:SS'). */
function swedishDayStartUtc(date) {
  const noonUtc = new Date(`${date}T12:00:00Z`);
  const offset = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Stockholm', timeZoneName: 'longOffset' })
    .formatToParts(noonUtc)
    .find((part) => part.type === 'timeZoneName').value; // "GMT+01:00" or "GMT+02:00"
  const start = new Date(`${date}T00:00:00${offset.slice(3) || 'Z'}`);
  return start.toISOString().slice(0, 19).replace('T', ' ');
}

const addDays = (date, days) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const to = arg('to') ?? swedishToday();
const from = arg('from') ?? addDays(to, -29);
for (const [name, value] of [
  ['from', from],
  ['to', to],
]) {
  if (!DATE.test(value)) {
    console.error(`--${name} must be a date like 2026-11-01`);
    process.exit(1);
  }
}

// The Worker creates the table and its newer columns on the first registration after a deploy.
const columns = new Set(query(`SELECT name FROM pragma_table_info('registrations')`).map((column) => column.name));
const consent = columns.has('analytics_consent') ? 'analytics_consent' : 'NULL';

const [row] =
  columns.size === 0
    ? [{ stored: 0, measurable: 0, declined: 0, undecided: 0, ja: 0, nej: 0, inget_val: 0, tests: 0 }]
    : query(`
  SELECT
    count(*) FILTER (WHERE is_test = 0) AS stored,
    count(*) FILTER (WHERE is_test = 0 AND ${consent} = 'granted') AS measurable,
    count(*) FILTER (WHERE is_test = 0 AND ${consent} = 'denied') AS declined,
    count(*) FILTER (WHERE is_test = 0 AND ${consent} IS NULL) AS undecided,
    count(*) FILTER (WHERE is_test = 0 AND update_status = 'ja') AS ja,
    count(*) FILTER (WHERE is_test = 0 AND update_status = 'nej') AS nej,
    count(*) FILTER (WHERE is_test = 0 AND update_status = 'inget_val') AS inget_val,
    count(*) FILTER (WHERE is_test = 1) AS tests
  FROM registrations
  WHERE created_at >= ${sqlString(swedishDayStartUtc(from))}
    AND created_at < ${sqlString(swedishDayStartUtc(addDays(to, 1)))}
`);
const report = { from, to, database: isLocal ? 'local' : 'remote', ...row };

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report));
} else {
  const pct = (n) => (row.stored ? ` (${Math.round((n / row.stored) * 100)}%)` : '');
  console.log(`Registrations ${from} to ${to}, Swedish time (${report.database} D1, tests left out)

Stored registrations             ${row.stored}
  measurement accepted           ${row.measurable}${pct(row.measurable)}   <- compare with "Mätta registreringar" in GA4
  measurement declined           ${row.declined}${pct(row.declined)}
  no choice about measurement    ${row.undecided}${pct(row.undecided)}

Update choice                    ja ${row.ja}, nej ${row.nej}, no choice ${row.inget_val}
Test registrations (left out)    ${row.tests}

Count "Mätta registreringar" in GA4 for the same period. "Measurement accepted" minus "Mätta registreringar"
is measurement loss, such as blockers. Declined and no-choice registrations never reach
GA4. Registrations from before the consent banner (2026-11-02) count as no choice.`);
}
