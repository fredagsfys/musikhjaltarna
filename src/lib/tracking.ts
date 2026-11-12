/**
 * Event tracking for brief B, sent to Google Analytics 4 through Google Tag Manager.
 *
 * - Only with the visitor's consent (src/lib/consent.ts). Tag Manager isn't loaded before they accept;
 *   until they decide, events from the current page wait in memory, sent if the visitor accepts and
 *   discarded if they decline. Declining later stops all events and deletes Google Analytics' cookies.
 * - Consent Mode is set before the container loads: analytics storage granted, every advertising
 *   signal denied, since the choice covers statistics only.
 * - Each event is pushed to the data layer with its parameters, and with page_version, environment and
 *   the ad source. Parameters from an earlier event are cleared, so one event's values never leak into
 *   the next. Lists are sent as comma-separated text, which is what GA4 can store.
 * - The ad source (UTM parameters, message_id, ad_id) is read from the arrival URL and, with consent,
 *   kept for the tab's session in sessionStorage, so it follows the visitor through the purchase flow
 *   and onto the registration, and internal navigation never overwrites it (brief B §3).
 * - If Tag Manager is blocked or fails to load, events are dropped and the purchase flow is unaffected
 *   (brief B §9).
 * - Never pass names, e-mail addresses or form values here.
 *
 * Event catalogue and the Tag Manager setup: docs/TRACKING.md.
 */
import { site } from '~/config/site';
import { consent, onConsentChange } from './consent';
import { isTestSession } from './registration';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export type TrackingEvent =
  | 'offer_view'
  | 'section_view'
  | 'section_exposure_end'
  | 'cta_view'
  | 'purchase_click'
  | 'checkout_view'
  | 'checkout_start'
  | 'checkout_error'
  | 'checkout_back'
  | 'purchase_intent_submit'
  | 'availability_notice_view'
  | 'updates_choice'
  | 'updates_confirmation_view'
  | 'external_link_click'
  | 'practice_listen'
  | 'practice_start'
  | 'practice_complete';

export type TrackingProperties = Record<string, string | number | boolean | string[] | null | undefined>;

/** Ad tagging read from the arrival URL (brief B §3). */
export const AD_PARAMETERS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'message_id',
  'ad_id',
] as const;
export type AdSource = Partial<Record<(typeof AD_PARAMETERS)[number], string>>;

const SOURCE_KEY = 'musikhjaltarna:source';

const GTM_ID: string = import.meta.env.PUBLIC_GTM_ID || site.gtmId;

/** production, preview (Cloudflare branch previews), test (sessions started with ?test) or development. */
export function environment(): string {
  if (isTestSession()) return 'test';
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'development';
  // Branch previews are served as <branch>-musikhjaltarna.<account>.workers.dev.
  if (host.endsWith('.workers.dev') && !host.startsWith(`${site.workerName}.`)) return 'preview';
  return 'production';
}

/** Which version of page and content this build serves (brief B §2), set on <html> by BaseLayout. */
export const pageVersion = () => document.documentElement.dataset.pageVersion ?? 'unknown';

/**
 * The session's ad source: the first tagged arrival in this tab wins. Values are trimmed and capped,
 * since they come from a URL anyone can edit.
 */
export function adSource(): AdSource {
  if (consent() === 'denied') return {};
  try {
    const stored = sessionStorage.getItem(SOURCE_KEY);
    if (stored) return JSON.parse(stored) as AdSource;
  } catch {
    // Storage unavailable: fall back to the current URL.
  }
  const params = new URLSearchParams(location.search);
  const source: AdSource = {};
  for (const key of AD_PARAMETERS) {
    const value = params.get(key)?.trim().slice(0, 200);
    if (value) source[key] = value;
  }
  // Kept for the rest of the session only with consent; until then it lives in this page's URL.
  if (Object.keys(source).length > 0 && consent() === 'granted') {
    try {
      sessionStorage.setItem(SOURCE_KEY, JSON.stringify(source));
    } catch {
      // Only this page carries the source.
    }
  }
  return source;
}

/** Events recorded before the visitor decided, in memory only. */
let pending: (() => void)[] = [];
let started = false;
/** Parameter names pushed so far, cleared on the next push. */
const pushed = new Set<string>();

const dataLayer = () => (window.dataLayer ??= []);

/** The gtag() command format, which Consent Mode reads from the data layer. */
function gtag(..._args: unknown[]) {
  dataLayer().push(arguments);
}

/** Sets Consent Mode and loads the Tag Manager container once per page. */
function startTagManager() {
  if (started || !GTM_ID) return;
  started = true;
  gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  dataLayer().push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.append(script);
}

/** Withdrawn consent: tell the tags, and remove Google Analytics' cookies (_ga, _ga_<id>). */
function stopTagManager() {
  if (started) gtag('consent', 'update', { analytics_storage: 'denied' });
  // Google Analytics sets its cookies on the widest domain it can; try each level of the host name.
  const parts = location.hostname.split('.');
  const domains = ['', ...parts.map((_, i) => `.${parts.slice(i).join('.')}`)];
  for (const name of document.cookie.split(';').map((cookie) => cookie.split('=')[0]!.trim())) {
    if (!name.startsWith('_ga')) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

/** Pushes one event, with every parameter of the previous push cleared. */
function push(event: TrackingEvent, properties: TrackingProperties) {
  // Consent Mode must come before the first event in the data layer.
  startTagManager();
  const entry: Record<string, unknown> = {};
  for (const name of pushed) entry[name] = undefined;
  const parameters = { page_version: pageVersion(), environment: environment(), ...adSource(), ...properties };
  for (const [name, value] of Object.entries(parameters)) {
    if (value === undefined) continue;
    entry[name] = Array.isArray(value) ? value.join(',') : value;
    pushed.add(name);
  }
  entry.event = event;
  dataLayer().push(entry);
}

/** Records an event. */
export function track(event: TrackingEvent, properties: TrackingProperties = {}) {
  const payload = {
    event_id: crypto.randomUUID(),
    event_timestamp: new Date().toISOString(),
    ...properties,
  };
  const send = () => {
    if (GTM_ID) push(event, payload);
  };
  const choice = consent();
  if (choice === 'granted') send();
  else if (choice === null) pending.push(send);
}

/** Cloudflare Web Analytics page views, in production builds only. */
function startWebAnalytics() {
  if (!import.meta.env.PROD || document.querySelector('script[data-cf-beacon]')) return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({ token: site.webAnalyticsToken });
  document.head.append(script);
}

/** Starts analytics on every page: right away with consent, or as soon as the visitor accepts. */
export function initTracking() {
  const start = () => {
    adSource();
    startTagManager();
    startWebAnalytics();
    for (const send of pending) send();
    pending = [];
  };
  if (consent() === 'granted') start();
  onConsentChange((choice) => {
    if (choice === 'granted') return start();
    pending = [];
    stopTagManager();
    try {
      sessionStorage.removeItem(SOURCE_KEY);
    } catch {
      // Nothing stored.
    }
  });
}

/** Runs `callback` once the tab is visible: page-view events only count in an active tab (brief B §4). */
export function whenVisible(callback: () => void) {
  if (document.visibilityState === 'visible') return callback();
  const onChange = () => {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', onChange);
    callback();
  };
  document.addEventListener('visibilitychange', onChange);
}
