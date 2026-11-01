/**
 * The analytics consent from brief B §9: nothing is measured until the visitor accepts, declining is as
 * easy as accepting, and the choice can be changed at any time.
 */
import { CONSENT_KEY, CONSENT_VERSION } from '../src/lib/consent';
import { registrationsFor } from './d1';
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

  test('accept and decline are equally prominent', async ({ page }) => {
    await page.goto('/');
    const accept = page.locator('#samtycke_godkann');
    const decline = page.locator('#samtycke_neka');
    const style = (el: Element) => {
      const { backgroundColor, color, borderColor, fontSize, fontWeight } = getComputedStyle(el);
      return { backgroundColor, color, borderColor, fontSize, fontWeight };
    };
    expect(await accept.evaluate(style)).toEqual(await decline.evaluate(style));
    const [a, d] = [await accept.boundingBox(), await decline.boundingBox()];
    expect(Math.abs(a!.height - d!.height)).toBeLessThan(1);
    expect(Math.abs(a!.width - d!.width)).toBeLessThan(2);
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
    await page.click('#samtycke_neka');
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
    // Skip link, then the privacy link and the two choices, first in the page.
    const focused = () =>
      page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent?.trim());
    const order: (string | undefined)[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press(testInfo.project.name.includes('safari') ? 'Alt+Tab' : 'Tab');
      order.push(await focused());
    }
    expect(order.slice(1)).toEqual(['Så hanterar vi personuppgifter', 'samtycke_neka', 'samtycke_godkann']);
    await page.keyboard.press('Enter');
    await expect(page.locator(banner)).toBeHidden();
    await analytics.waitFor('offer_view');
  });
});

test('the choice can be withdrawn from the footer', async ({ page, analytics }) => {
  await page.goto('/');
  await analytics.waitFor('offer_view');
  await expect(page.locator(banner)).toBeHidden();

  const settings = page.getByRole('button', { name: 'Integritetsinställningar' });
  await settings.click();
  await expect(page.locator(banner)).toBeVisible();
  await expect(page.locator('#samtycke_neka')).toBeFocused();
  await page.click('#samtycke_neka');
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
