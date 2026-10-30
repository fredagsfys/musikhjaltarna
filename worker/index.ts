/**
 * Serves the static site and a small first-party tracking API backed by D1.
 * Only `/api/*` reaches this code (`run_worker_first` in wrangler.jsonc); every other
 * request is served directly from the static assets.
 *
 * No cookies, IP addresses or user agents are stored.
 */
import { isCtaId } from '../src/config/site';

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

const EVENTS = new Set(['cta_click', 'purchase_intent', 'updates_opt_in', 'updates_decline']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 2048;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    event TEXT NOT NULL,
    cta_id TEXT
  )`,
  // Purchase intent and update opt-in are stored as separate rows, as the spec requires.
  `CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    type TEXT NOT NULL,
    name TEXT,
    email TEXT NOT NULL,
    cta_id TEXT
  )`,
];

// Tables are created on first use per isolate, so deploys need no migration step.
let schemaReady: Promise<unknown> | undefined;
const ensureSchema = (db: D1Database) =>
  (schemaReady ??= db.batch(SCHEMA.map((sql) => db.prepare(sql))).catch((error) => {
    schemaReady = undefined;
    throw error;
  }));

class BadRequest extends Error {}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const ctaId = (value: unknown) => (isCtaId(value) ? value : null);

function eventStatement(db: D1Database, body: Record<string, unknown>) {
  if (typeof body.event !== 'string' || !EVENTS.has(body.event)) throw new BadRequest('Unknown event');
  return db.prepare('INSERT INTO events (event, cta_id) VALUES (?, ?)').bind(body.event, ctaId(body.cta_id));
}

function leadStatement(db: D1Database, body: Record<string, unknown>) {
  const insert = db.prepare('INSERT INTO leads (type, name, email, cta_id) VALUES (?, ?, ?, ?)');

  if (body.type === 'purchase_intent' && body.lead && typeof body.lead === 'object') {
    const lead = body.lead as Record<string, unknown>;
    const name = text(lead.name, 200);
    const email = text(lead.email, 254);
    if (!name || !EMAIL.test(email)) throw new BadRequest('Invalid lead');
    return insert.bind('purchase_intent', name, email, ctaId(lead.ctaId));
  }
  if (body.type === 'updates_opt_in') {
    const email = text(body.email, 254);
    if (!EMAIL.test(email)) throw new BadRequest('Invalid e-mail');
    return insert.bind('updates_opt_in', null, email, null);
  }
  throw new BadRequest('Unknown lead type');
}

async function record(
  request: Request,
  env: Env,
  statement: (db: D1Database, body: Record<string, unknown>) => D1PreparedStatement,
) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  // Only the site itself may write; browsers always send Origin on POST.
  if (request.headers.get('Origin') !== new URL(request.url).origin) return new Response(null, { status: 403 });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  try {
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object') throw new BadRequest('Expected an object');
    const insert = statement(env.DB, body as Record<string, unknown>);
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
    const { pathname } = new URL(request.url);
    if (pathname === '/api/events') return record(request, env, eventStatement);
    if (pathname === '/api/leads') return record(request, env, leadStatement);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
