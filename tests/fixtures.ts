/**
 * Shared test setup.
 *
 * - Every page gets a Google Tag Manager stub: the container never loads from Google. In its place a
 *   small script forwards each event the site pushes to the data layer, and those are collected in
 *   `analytics` so tests can check them. Cloudflare Web Analytics is stubbed too.
 * - Visitors have accepted analytics unless a test sets `consent` (null for undecided).
 */
import { expect, test as base, type Page } from '@playwright/test';
import { CONSENT_KEY, CONSENT_VERSION, type ConsentChoice } from '../src/lib/consent';
import { registrationsFor } from './d1';

export interface CapturedEvent {
  event: string;
  properties: Record<string, unknown>;
}

const COLLECT_URL = 'https://www.googletagmanager.com/e2e/collect';

export class Analytics {
  readonly events: CapturedEvent[] = [];
  /** How many times the page requested the Tag Manager container. */
  containerLoads = 0;
  /** Raw request bodies, to check that no personal data is sent. */
  readonly bodies: string[] = [];

  named(event: string) {
    return this.events.filter((captured) => captured.event === event);
  }

  /** Waits for at least `count` events with this name and returns them. */
  async waitFor(event: string, count = 1) {
    await expect.poll(() => this.named(event).length, { message: `${event} events` }).toBeGreaterThanOrEqual(count);
    return this.named(event);
  }
}

/**
 * Stands in for gtm.js. Like Tag Manager it merges each push into one data model, and for every site
 * event (not Tag Manager's own) it forwards what a tag would read from the model at that moment.
 */
const GTM_STUB = `(() => {
  const model = {};
  const send = (entry) => {
    if (!entry || Object.prototype.toString.call(entry) !== '[object Object]') return; // gtag() commands
    Object.assign(model, entry);
    if (typeof entry.event !== 'string' || entry.event.startsWith('gtm.')) return;
    const { event, ...properties } = model;
    delete properties['gtm.start'];
    fetch('${COLLECT_URL}', { method: 'POST', body: JSON.stringify({ event, properties }), keepalive: true });
  };
  const layer = (window.dataLayer = window.dataLayer || []);
  layer.forEach(send);
  const push = layer.push.bind(layer);
  layer.push = (...entries) => (entries.forEach(send), push(...entries));
})();`;

export const test = base.extend<{ analytics: Analytics; blockAnalytics: boolean; consent: ConsentChoice | null }>({
  blockAnalytics: [false, { option: true }],
  consent: ['granted', { option: true }],
  storageState: async ({ consent, baseURL }, use) => {
    const stored = { choice: consent, version: CONSENT_VERSION, at: new Date().toISOString() };
    await use({
      cookies: [],
      origins: consent
        ? [{ origin: baseURL!, localStorage: [{ name: CONSENT_KEY, value: JSON.stringify(stored) }] }]
        : [],
    });
  },
  analytics: [
    async ({ page, blockAnalytics }, use) => {
      const analytics = new Analytics();
      await page.route('https://static.cloudflareinsights.com/**', (route) =>
        route.fulfill({ contentType: 'text/javascript', body: '' }),
      );
      await page.route('https://www.googletagmanager.com/**', async (route) => {
        if (blockAnalytics) return route.abort('blockedbyclient');
        const url = route.request().url();
        if (url.startsWith(COLLECT_URL)) {
          const text = route.request().postData() ?? '';
          analytics.bodies.push(text);
          analytics.events.push(JSON.parse(text) as CapturedEvent);
          return route.fulfill({ status: 204 });
        }
        analytics.containerLoads++;
        await route.fulfill({ contentType: 'text/javascript', body: GTM_STUB });
      });
      await use(analytics);
    },
    { auto: true },
  ],
});

export { expect };

/** A unique address per test and browser, so tests can run in parallel against one database. */
export const uniqueEmail = (label: string) =>
  `${label}-${test.info().project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

/** Waits until the registration for this address is visible: the local database writes to disk just after responding. */
export async function stored(email: string) {
  await expect.poll(() => registrationsFor(email).length, { message: `registration for ${email}` }).toBeGreaterThan(0);
  return registrationsFor(email);
}

/** Waits for the URL and for the page's scripts, which attach the click handlers, before the next step. */
export async function arrivedAt(page: Page, path: string) {
  await expect(page).toHaveURL(path);
  await page.waitForLoadState('domcontentloaded');
}

/** Step 1: from the purchase page on to the last step. Nothing is stored. */
export async function startCheckout(page: Page, ctaSlug: string) {
  await page.goto(`/kop/${ctaSlug}`);
  await page.click('#kop_skicka');
  await arrivedAt(page, '/kop/uppdatering');
}

/** The last step: first name, e-mail and the consent box, ready to send. */
export async function fillAndAgree(page: Page, name: string, email: string) {
  await page.fill('#kop_namn', name);
  await page.fill('#kop_epost', email);
  await page.check('#uppdatering_samtycke');
}

/** The whole flow with consent: the registration is stored with "ja" and the confirmation shows. */
export async function register(page: Page, ctaSlug: string, name: string, email: string) {
  await startCheckout(page, ctaSlug);
  await fillAndAgree(page, name, email);
  await page.click('#uppdatering_ja');
  await arrivedAt(page, '/kop/tack');
}
