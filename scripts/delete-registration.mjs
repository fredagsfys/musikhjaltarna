/**
 * Deletes a person's registrations, by e-mail address or registration id.
 * Shows what would be deleted and only deletes with --yes.
 *
 *   npm run delete:registration -- anna@example.com
 *   npm run delete:registration -- anna@example.com --yes
 */
import { isLocal, query, sqlString } from './d1.mjs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const target = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!target || !(EMAIL.test(target) || UUID.test(target))) {
  console.error('Usage: npm run delete:registration -- <e-mail or registration id> [--yes] [--local]');
  process.exit(1);
}

const where = UUID.test(target) ? `id = ${sqlString(target)}` : `lower(email) = lower(${sqlString(target)})`;
const rows = query(`SELECT id, created_at, name, email, update_status FROM registrations WHERE ${where}`);
const source = isLocal ? 'local' : 'remote';

if (rows.length === 0) {
  console.log(`No registrations match ${target} in ${source} D1.`);
  process.exit(0);
}
console.table(rows);
if (!process.argv.includes('--yes')) {
  console.log(`${rows.length} registration(s) would be deleted from ${source} D1. Run again with --yes to delete.`);
  process.exit(0);
}
query(`DELETE FROM registrations WHERE ${where}`);
console.log(`Deleted ${rows.length} registration(s) from ${source} D1.`);
