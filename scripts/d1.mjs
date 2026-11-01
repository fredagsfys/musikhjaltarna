/**
 * Runs SQL against the musikhjaltarna D1 database through Wrangler and returns the rows.
 * Remote by default (needs `npx wrangler login` with access to the Cloudflare account);
 * pass --local to use the local database from `npx wrangler dev` (and --persist-to=<dir> for a custom one).
 */
import { execFileSync } from 'node:child_process';

export const DATABASE = 'musikhjaltarna';
export const isLocal = process.argv.includes('--local');
const persistTo = process.argv.find((arg) => arg.startsWith('--persist-to='));

export function query(sql) {
  const output = execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      DATABASE,
      isLocal ? '--local' : '--remote',
      ...(persistTo ? ['--persist-to', persistTo.slice('--persist-to='.length)] : []),
      '--json',
      '--command',
      sql,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } },
  );
  return JSON.parse(output)[0].results;
}

/** Quotes a value for SQL. Only used after the value has been validated. */
export const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;
