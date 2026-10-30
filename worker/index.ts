/**
 * Serves the static site and stores leads from the purchase flow in D1.
 * Only `/api/*` reaches this code (`run_worker_first` in wrangler.jsonc); every other
 * request is served directly from the static assets. Page views and the funnel are
 * measured by Cloudflare Web Analytics.
 *
 * No cookies, IP addresses or user agents are stored.
 */
import { isCtaId } from '../src/config/site';

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 2048;

// Purchase intent and update opt-in are stored as separate rows, as the spec requires.
const SCHEMA = `CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  type TEXT NOT NULL,
  name TEXT,
  email TEXT NOT NULL,
  cta_id TEXT
)`;

// The table is created on first use per isolate, so deploys need no migration step.
let schemaReady: Promise<unknown> | undefined;
const ensureSchema = (db: D1Database) =>
  (schemaReady ??= db
    .prepare(SCHEMA)
    .run()
    .catch((error) => {
      schemaReady = undefined;
      throw error;
    }));

class BadRequest extends Error {}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function leadStatement(db: D1Database, body: Record<string, unknown>) {
  const insert = db.prepare('INSERT INTO leads (type, name, email, cta_id) VALUES (?, ?, ?, ?)');

  if (body.type === 'purchase_intent' && body.lead && typeof body.lead === 'object') {
    const lead = body.lead as Record<string, unknown>;
    const name = text(lead.name, 200);
    const email = text(lead.email, 254);
    if (!name || !EMAIL.test(email)) throw new BadRequest('Invalid lead');
    return insert.bind('purchase_intent', name, email, isCtaId(lead.ctaId) ? lead.ctaId : null);
  }
  if (body.type === 'updates_opt_in') {
    const email = text(body.email, 254);
    if (!EMAIL.test(email)) throw new BadRequest('Invalid e-mail');
    return insert.bind('updates_opt_in', null, email, null);
  }
  throw new BadRequest('Unknown lead type');
}

async function recordLead(request: Request, env: Env) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  // Only the site itself may write; browsers always send Origin on POST.
  if (request.headers.get('Origin') !== new URL(request.url).origin) return new Response(null, { status: 403 });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  try {
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object') throw new BadRequest('Expected an object');
    const insert = leadStatement(env.DB, body as Record<string, unknown>);
    await ensureSchema(env.DB);
    await insert.run();
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof BadRequest || error instanceof SyntaxError) {
      return new Response(error.message, { status: 400 });
    }
    throw error;
  }
}

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname === '/api/leads') return recordLead(request, env);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
