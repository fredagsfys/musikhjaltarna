/**
 * The analytics consent from brief B §9: nothing is measured until the visitor accepts, declining is
 * possible from the settings layer with an unticked box, and the choice can be changed at any time.
 */
import type { Page } from '@playwright/test';
import { CONSENT_KEY, CONSENT_VERSION } from '../src/lib/consent';
import { registrationReport, registrationsFor } from './d1';
import { arrivedAt, expect, stored, test, uniqueEmail } from './fixtures';

const banner = '#samtycke';

test.describe('before the visitor has decided', () => {
  test.use({ consent: null });

  test('the banner asks, and nothing is sent or stored', async ({ page, context, analytics }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith('http://localhost')) external.push(request.url());
    });
    await page.goto('/?utm_source=facebook&ad_id=1');
    await expect(page.locator(banner)).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Får vi mäta hur sidan används?' })).toBeVisible();
    await page.waitForTimeout(3000); // Longer than a section needs to qualify as seen.

    expect(external).toEqual([]);
    expect(analytics.events).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    const storage = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
    expect(storage).toEqual([]);
  });

  test('the settings offer measurement as an unticked choice', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#samtycke_godkann')).toHaveText('Godkänn alla');
    await page.click('#samtycke_hantera');
    await expect(page.getByRole('dialog', { name: 'Integritetsinställningar' })).toBeVisible();
    const box = page.locator('#samtycke_matning');
    await expect(box).toBeFocused();
    await expect(box).not.toBeChecked();
    await expect(page.locator('#samtycke_spara')).toBeVisible();
    await expect(page.locator('#samtycke_godkann_alla')).toBeVisible();
  });

  test('accepting sends what happened on this page and keeps the ad source', async ({ page, analytics }) => {
    await page.goto('/?utm_source=facebook&message_id=budskap_1');
    await page.waitForTimeout(2500); // The hero qualifies as seen while the visitor reads the banner.
    expect(analytics.events).toEqual([]);

    await page.click('#samtycke_godkann');
    await expect(page.locator(banner)).toBeHidden();
    const [view] = await analytics.waitFor('offer_view');
    expect(view.properties).toMatchObject({ utm_source: 'facebook', message_id: 'budskap_1' });
    const [section] = await analytics.waitFor('section_view');
    expect(section.properties.section_id).toBe('sektion_hero');
    // Events keep the time they happened, before the choice.
    expect(Date.parse(section.properties.event_timestamp as string)).toBeLessThan(Date.now() - 400);

    // The choice and the source carry over to the next page.
    const email = uniqueEmail('godkand');
    await page.goto('/kop/hero');
    await expect(page.locator(banner)).toBeHidden();
    await page.fill('#kop_namn', 'Godkänd Test');
    await page.fill('#kop_epost', email);
    await page.click('#kop_skicka');
    await arrivedAt(page, '/kop/uppdatering');
    const [checkout] = await analytics.waitFor('checkout_view');
    expect(checkout.properties.utm_source).toBe('facebook');
    expect((await stored(email))[0]).toMatchObject({ analytics_consent: 'granted', utm_source: 'facebook' });
  });

  test('declining sends nothing, now or later, and the flow still works', async ({ page, analytics }) => {
    await page.goto('/?utm_source=facebook');
    await page.waitForTimeout(2500);
    await page.click('#samtycke_hantera');
    await page.click('#samtycke_spara'); // Saved without ticking measurement.
    await expect(page.locator(banner)).toBeHidden();

    const email = uniqueEmail('nekad');
    await page.locator('[data-cta-id="kop_hero"]').click();
    await arrivedAt(page, '/kop/hero');
    await expect(page.locator(banner)).toBeHidden();
    await page.fill('#kop_namn', 'Nekad Test');
    await page.fill('#kop_epost', email);
    await page.click('#kop_skicka');
    await arrivedAt(page, '/kop/uppdatering');
    await page.click('#uppdatering_ja');
    await arrivedAt(page, '/kop/tack');
    await page.waitForTimeout(1000);

    expect(analytics.events).toEqual([]);
    const [row] = registrationsFor(email);
    expect(row).toMatchObject({ analytics_consent: 'denied', utm_source: null, update_status: 'ja' });
    expect(await page.evaluate(() => Object.keys(sessionStorage))).not.toContain('musikhjaltarna:source');
  });

  test('the purchase flow works without answering the banner', async ({ page, analytics }) => {
    const email = uniqueEmail('obesvarad');
    await page.goto('/');
    await page.locator('[data-cta-id="kop_hero"]').click();
    await arrivedAt(page, '/kop/hero');
    await expect(page.locator(banner)).toBeVisible();
    await page.fill('#kop_namn', 'Obesvarad Test');
    await page.fill('#kop_epost', email);
    await page.click('#kop_skicka');
    await arrivedAt(page, '/kop/uppdatering');

    expect(analytics.events).toEqual([]);
    expect((await stored(email))[0].analytics_consent).toBeNull();
  });

  test('the banner can be answered with the keyboard', async ({ page, analytics }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'No keyboard on phones');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator(banner)).toBeVisible();
    // Skip link, then the privacy link and the two buttons, first in the page.
    const tab = () => page.keyboard.press(testInfo.project.name.includes('safari') ? 'Alt+Tab' : 'Tab');
    const focused = () =>
      page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent?.trim());
    const order: (string | undefined)[] = [];
    for (let i = 0; i < 4; i++) {
      await tab();
      order.push(await focused());
    }
    expect(order.slice(1)).toEqual(['Läs mer', 'samtycke_godkann', 'samtycke_hantera']);
    await page.keyboard.press('Enter');
    await expect(page.locator('#samtycke_matning')).toBeFocused();
    await page.keyboard.press('Space');
    await tab(); // Läs mer
    await tab();
    expect(await focused()).toBe('samtycke_spara');
    await page.keyboard.press('Enter');
    await expect(page.locator(banner)).toBeHidden();
    await analytics.waitFor('offer_view');
  });

  /** The bar's position on screen and how much of the hero buy button it covers. */
  const bar = (page: Page) =>
    page.evaluate(() => {
      const card = document.querySelector('#samtycke [data-layer="ask"]')!.getBoundingClientRect();
      const button = document.querySelector('[data-cta-id="kop_hero"]')!.getBoundingClientRect();
      return {
        tucked: document.querySelector('#samtycke')!.hasAttribute('data-tucked'),
        onScreen: card.top < innerHeight,
        overlap: Math.max(0, Math.min(button.bottom, card.bottom) - Math.max(button.top, card.top)),
      };
    });

  test('the bar sits below the hero buy button on common screens', async ({ page }) => {
    for (const size of [
      { width: 375, height: 629 }, // iPhone 13 mini in Safari
      { width: 393, height: 659 }, // iPhone 15 in Safari
      { width: 412, height: 839 }, // Pixel 7 in Chrome
      { width: 1024, height: 768 },
      { width: 1366, height: 768 },
      { width: 1024, height: 704 }, // iPad landscape in Safari
      { width: 1280, height: 577 }, // 1280×720 laptop, Windows Chrome
      { width: 1366, height: 625 }, // 1366×768 laptop, Windows Chrome
      { width: 1920, height: 937 },
    ]) {
      await page.setViewportSize(size);
      await page.goto('/');
      await expect
        .poll(() => bar(page), { message: `${size.width}×${size.height}` })
        .toEqual({ tucked: false, onScreen: true, overlap: 0 });
    }
  });

  test('on a screen too short for both, the bar waits until the buy button has passed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 548 }); // iPhone SE in Safari
    await page.goto('/');
    await expect.poll(() => bar(page)).toMatchObject({ tucked: true, onScreen: false });

    await page.evaluate(() => scrollBy(0, 300));
    await expect.poll(() => bar(page)).toMatchObject({ tucked: false, onScreen: true });

    // Back at the top it steps aside again, and keyboard focus brings it back.
    await page.evaluate(() => scrollTo(0, 0));
    await expect.poll(() => bar(page)).toMatchObject({ tucked: true });
    await page.focus('#samtycke_godkann');
    await expect.poll(() => bar(page)).toMatchObject({ tucked: false });
  });

  test('the hero buy button is on screen on arrival, even on small and sideways screens', async ({ page }) => {
    for (const size of [
      { width: 320, height: 568 }, // iPhone SE 1st gen
      { width: 375, height: 548 }, // iPhone SE in Safari
      { width: 667, height: 331 }, // iPhone SE sideways
      { width: 734, height: 343 }, // iPhone 15 sideways
      { width: 1024, height: 600 },
    ]) {
      await page.setViewportSize(size);
      await page.goto('/');
      const bottom = await page
        .locator('[data-cta-id="kop_hero"]')
        .evaluate((button) => button.getBoundingClientRect().bottom);
      expect(bottom, `${size.width}×${size.height}`).toBeLessThanOrEqual(size.height);
    }
  });

  test('on other pages the bar shows on load, and steps aside only after a scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 548 }); // Where the front page waits for a scroll.
    for (const path of ['/kop/hero', '/integritet']) {
      await page.goto(path);
      await expect
        .poll(() => page.locator(banner).evaluate((el) => el.hasAttribute('data-tucked')), { message: path })
        .toBe(false);
      const top = await page.locator('#samtycke [data-layer="ask"]').evaluate((el) => el.getBoundingClientRect().top);
      expect(top, path).toBeLessThan(548);
    }
  });
});

test('the choice can be withdrawn from the footer', async ({ page, analytics }) => {
  await page.goto('/');
  await analytics.waitFor('offer_view');
  await expect(page.locator(banner)).toBeHidden();

  const settings = page.getByRole('button', { name: 'Integritetsinställningar' });
  await settings.click();
  await expect(page.locator(banner)).toBeVisible();
  const box = page.locator('#samtycke_matning');
  await expect(box).toBeFocused();
  await expect(box).toBeChecked();
  await box.uncheck();
  await page.click('#samtycke_spara');
  await expect(page.locator(banner)).toBeHidden();
  await expect(settings).toBeFocused();

  const sent = analytics.events.length;
  await page.locator('#sektion_hjalpen').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await page.goto('/');
  await page.waitForTimeout(1000);
  expect(analytics.events).toHaveLength(sent);
  await expect(page.locator(banner)).toBeHidden();
});

test.describe('an old choice', () => {
  test.use({ consent: null });

  for (const [label, value] of [
    ['older than 12 months', { choice: 'granted', version: CONSENT_VERSION, at: '2020-01-01T00:00:00.000Z' }],
    ['from an earlier version', { choice: 'granted', version: CONSENT_VERSION - 1, at: new Date().toISOString() }],
  ] as const) {
    test(`is asked again when it is ${label}`, async ({ page, analytics }) => {
      await page.addInitScript(
        ([key, stored]) => {
          if (!sessionStorage.getItem('e2e-seeded')) localStorage.setItem(key, stored);
          sessionStorage.setItem('e2e-seeded', '1');
        },
        [CONSENT_KEY, JSON.stringify(value)] as const,
      );
      await page.goto('/');
      await expect(page.locator(banner)).toBeVisible();
      await page.waitForTimeout(1000);
      expect(analytics.events).toEqual([]);
    });
  }
});

test('the registrations report splits stored registrations by the analytics choice', async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(150_000); // Several reads through the Wrangler CLI.
  const before = registrationReport();

  // Accepted (the default in these tests), no choice, and declined. New contexts would inherit the stored
  // choice, so they start from empty storage.
  const fresh = { baseURL, storageState: { cookies: [], origins: [] } };
  const register = async (target: typeof page, label: string) => {
    const email = uniqueEmail(label);
    await target.goto('/kop/hero');
    await target.fill('#kop_namn', 'Rapport Test');
    await target.fill('#kop_epost', email);
    await target.click('#kop_skicka');
    await arrivedAt(target, '/kop/uppdatering');
    await stored(email);
  };
  await register(page, 'rapport-godkand');
  const undecided = await browser.newContext(fresh);
  await register(await undecided.newPage(), 'rapport-obesvarad');
  const declined = await browser.newContext(fresh);
  const declinedPage = await declined.newPage();
  await declinedPage.goto('/');
  await declinedPage.click('#samtycke_hantera');
  await declinedPage.click('#samtycke_spara');
  await register(declinedPage, 'rapport-nekad');
  await Promise.all([undecided.close(), declined.close()]);

  const after = registrationReport();
  expect(after.measurable).toBeGreaterThan(before.measurable);
  expect(after.undecided).toBeGreaterThan(before.undecided);
  expect(after.declined).toBeGreaterThan(before.declined);
  expect(after.stored).toBe(after.measurable + after.declined + after.undecided);
  expect(after.stored).toBe(after.ja + after.nej + after.inget_val);
});
