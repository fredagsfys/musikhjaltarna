import { execFileSync } from 'node:child_process';
import { E2E_STATE } from '../playwright.config';

const env = { ...process.env, WRANGLER_SEND_METRICS: 'false' };

export interface RegistrationRow {
  id: string;
  created_at: string;
  name: string;
  email: string;
  cta_id: string | null;
  update_status: 'inget_val' | 'ja' | 'nej';
  update_status_at: string | null;
  update_info_version: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  message_id: string | null;
  ad_id: string | null;
  page_version: string | null;
  is_test: number;
}

/**
 * Registrations for one e-mail address in the test database, read through Wrangler (the database
 * file itself doesn't show the dev server's writes reliably). Retries briefly, since parallel test
 * workers and the dev server can hold the database at the same moment. Test addresses contain no quotes.
 */
export function registrationsFor(email: string): RegistrationRow[] {
  const args = ['wrangler', 'd1', 'execute', 'musikhjaltarna', '--local', '--persist-to', E2E_STATE, '--json'];
  const sql = `SELECT * FROM registrations WHERE email = '${email}'`;
  for (let attempt = 1; ; attempt++) {
    try {
      const output = execFileSync('npx', [...args, '--command', sql], { encoding: 'utf8', env, stdio: 'pipe' });
      return JSON.parse(output)[0].results;
    } catch (error) {
      if (attempt >= 5) throw error;
      execFileSync('sleep', [String(0.3 * attempt)]);
    }
  }
}

/** Runs the admin export against the test database and returns the CSV text. */
export function exportCsv(out: string): string {
  execFileSync('node', ['scripts/export-registrations.mjs', '--local', `--persist-to=${E2E_STATE}`, `--out=${out}`], {
    encoding: 'utf8',
    env,
  });
  return execFileSync('cat', [out], { encoding: 'utf8' });
}
