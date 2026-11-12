/**
 * Event tracking for brief B, sent to PostHog Cloud EU.
 *
 * - Cookieless: PostHog sets no cookies and uses no browser storage. Sessions (30 minutes of
 *   inactivity) are assigned by PostHog's servers.
 * - The ad source (UTM parameters, message_id, ad_id) is read from the arrival URL and, with consent,
 *   kept for the tab's session in sessionStorage, so it follows the visitor through the purchase flow
 *   and onto the registration, and internal navigation never overwrites it (brief B §3).
 * - Only with the visitor's consent (src/lib/consent.ts). Until they decide, events from the current
 *   page wait in memory; they are sent if the visitor accepts and discarded if they decline.
 * - PostHog loads lazily and only when a project key is configured. If it is blocked or fails to
 *   load, events are dropped and the purchase flow is unaffected (brief B §9).
 * - Never pass names, e-mail addresses or form values here.
 *
 * Event catalogue: docs/TRACKING.md.
 */
import type { PostHog } from 'posthog-js/dist/module.slim.no-external';
import { site } from '~/config/site';
import { consent, onConsentChange } from './consent';
import { isTestSession } from './registration';

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

const KEY: string = import.meta.env.PUBLIC_POSTHOG_KEY || site.posthog.key;

/** production, preview (Cloudflare branch previews), test (sessions started with ?test) or development. */
export function environment(): string {
  if (isTestSession()) return 'test';
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'development';
  // Branch previews are served as <branch>-musikhjaltarna.<account>.workers.dev.
  if (host.endsWith('.workers.dev') && !host.startsWith(`${site.posthog.workerName}.`)) return 'preview';
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

let client: Promise<PostHog | null> | undefined;
/** Events recorded before the visitor decided, in memory only. */
let pending: (() => void)[] = [];

/** Loads and configures PostHog once per page. Resolves to null when tracking is off or blocked. */
function startTracking(): Promise<PostHog | null> {
  if (client) return client;
  client = KEY
    ? import('posthog-js/dist/module.slim.no-external')
        .then(({ default: posthog }) => {
          posthog.init(KEY, {
            api_host: site.posthog.host,
            cookieless_mode: 'always',
            person_profiles: 'never',
            session_idle_timeout_seconds: 30 * 60,
            // Only our own events, plus $pageview for each session's entry URL and UTM parameters.
            capture_pageview: true,
            capture_pageleave: false,
            // The session's first-touch source is ours to keep; PostHog would overwrite it on every tagged URL.
            save_campaign_params: false,
            autocapture: false,
            rageclick: false,
            capture_dead_clicks: false,
            capture_exceptions: false,
            capture_performance: false,
            enable_heatmaps: false,
            disable_session_recording: true,
            disable_surveys: true,
            disable_web_experiments: true,
            advanced_disable_flags: true,
            disable_external_dependency_loading: true,
          });
          posthog.register({ page_version: pageVersion(), environment: environment(), ...adSource() });
          return posthog;
        })
        .catch(() => null)
    : Promise.resolve(null);
  return client;
}

/**
 * Records an event. Each one is sent right away, in its own request that survives the page navigating
 * away: queued or asynchronously compressed events are lost when a click navigates, and in-app browsers
 * don't reliably signal that they are closing. The traffic is low enough for one request per event.
 */
export function track(event: TrackingEvent, properties: TrackingProperties = {}) {
  const payload = {
    event_id: crypto.randomUUID(),
    event_timestamp: new Date().toISOString(),
    ...properties,
  };
  const send = () => void startTracking().then((posthog) => posthog?.capture(event, payload, { send_instantly: true }));
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
    void startTracking();
    startWebAnalytics();
    for (const send of pending) send();
    pending = [];
  };
  if (consent() === 'granted') start();
  onConsentChange((choice) => {
    if (choice === 'granted') return start();
    pending = [];
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
