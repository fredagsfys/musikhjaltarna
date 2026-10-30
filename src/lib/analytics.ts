export type AnalyticsEvent = 'cta_click' | 'purchase_intent' | 'updates_opt_in' | 'updates_decline';
type Props = Record<string, string | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    plausible?: (event: string, options?: { props?: Props }) => void;
  }
}

/**
 * Provider-agnostic event tracking. Pushes to `dataLayer` (GTM/GA4) and to Plausible
 * when present. Never pass personal data (name, e-mail) here.
 */
export function track(event: AnalyticsEvent, props: Props = {}) {
  (window.dataLayer ??= []).push({ event, ...props });
  window.plausible?.(event, { props });
  if (import.meta.env.DEV) console.debug('[track]', event, props);
}
