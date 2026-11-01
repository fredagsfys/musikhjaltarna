/**
 * Exports all registrations to CSV, including update status and the test flag.
 *
 *   npm run export:registrations                  → registrations-YYYY-MM-DD.csv
 *   npm run export:registrations -- --local       → from the local wrangler dev database
 *   npm run export:registrations -- --out=file.csv
 */
import { writeFileSync } from 'node:fs';
import { isLocal, query } from './d1.mjs';

const COLUMNS = [
  'id',
  'created_at',
  'name',
  'email',
  'cta_id',
  'update_status',
  'update_status_at',
  'update_info_version',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'message_id',
  'ad_id',
  'page_version',
  'analytics_consent',
  'is_test',
];

const outArg = process.argv.find((arg) => arg.startsWith('--out='));
const out = outArg ? outArg.slice('--out='.length) : `registrations-${new Date().toISOString().slice(0, 10)}.csv`;

const rows = query(`SELECT ${COLUMNS.join(', ')} FROM registrations ORDER BY created_at`);
const cell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = [COLUMNS, ...rows.map((row) => COLUMNS.map((column) => row[column]))]
  .map((line) => line.map(cell).join(','))
  .join('\r\n');

// The byte order mark makes Excel read å, ä and ö correctly.
writeFileSync(out, `﻿${csv}\r\n`);
const tests = rows.filter((row) => row.is_test === 1).length;
console.log(`Exported ${rows.length} registrations (${tests} tests) from ${isLocal ? 'local' : 'remote'} D1 to ${out}`);
