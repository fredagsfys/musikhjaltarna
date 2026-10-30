export type AnalyticsEvent = 'cta_click' | 'purchase_intent' | 'updates_opt_in' | 'updates_decline';

const ENDPOINT = '/api/events';

/**
 * First-party event tracking, stored by the Worker in D1 (see worker/index.ts).
 * Uses sendBeacon so an event survives the page navigation a CTA click triggers.
 * Never pass personal data (name, e-mail) here.
 */
export function track(event: AnalyticsEvent, props: { cta_id?: string } = {}) {
  const body = JSON.stringify({ event, ...props });
  if (import.meta.env.DEV) console.debug('[track]', body);

  const queued = navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }));
  if (!queued) {
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(
      () => {
        // Tracking must never break the page.
      },
    );
  }
}
