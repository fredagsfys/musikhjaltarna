/**
 * The function check from brief A §9, one test per row of the acceptance checklist.
 * Runs against `wrangler dev` with an isolated local D1 (see playwright.config.ts).
 */
import { exportCsv, registrationsFor } from './d1';
import { arrivedAt, expect, fillAndAgree, register, startCheckout, stored, test, uniqueEmail } from './fixtures';

const CTAS = [
  { ctaId: 'kop_hero', slug: 'hero' },
  { ctaId: 'kop_hjalpen', slug: 'hjalpen' },
  { ctaId: 'kop_vardag', slug: 'vardag' },
  { ctaId: 'kop_pedagog', slug: 'pedagog' },
  { ctaId: 'kop_avslut', slug: 'avslut' },
];

test('all five buy buttons open the same step with the right CTA origin', async ({ page }) => {
  for (const { ctaId, slug } of CTAS) {
    await page.goto('/');
    await page.locator(`[data-cta-id="${ctaId}"]`).click();
    await expect(page).toHaveURL(`/kop/${slug}`);
    await expect(page.locator('#kop_sammanfattning')).toBeVisible();
    await expect(page.locator('#lead-form')).toHaveAttribute('data-cta', ctaId);
  }

  const email = uniqueEmail('cta');
  await page.goto('/');
  await page.locator('[data-cta-id="kop_pedagog"]').click();
  await arrivedAt(page, '/kop/pedagog');
  await page.click('#kop_skicka');
  await arrivedAt(page, '/kop/uppdatering');
  await fillAndAgree(page, 'CTA Test', email);
  await page.click('#uppdatering_ja');
  await arrivedAt(page, '/kop/tack');
  expect((await stored(email))[0].cta_id).toBe('kop_pedagog');
});

test('back from the purchase step restores the offer page and scroll position', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('[data-cta-id="kop_vardag"]');
  await button.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => Math.round(window.scrollY));
  expect(before).toBeGreaterThan(0);

  await button.click();
  await arrivedAt(page, '/kop/vardag');
  await page.click('#kop_tillbaka');
  await expect(page).toHaveURL('/');
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(before - 40);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBeLessThan(before + 40);
});

test('the purchase step asks for nothing and stores nothing', async ({ page }) => {
  await page.goto('/kop/hero');
  await expect(page.locator('#lead-form input')).toHaveCount(0);
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) posts.push(request.url());
  });
  await page.click('#kop_skicka');
  await arrivedAt(page, '/kop/uppdatering');
  expect(posts).toEqual([]);
});

test('an invalid form shows the right error and keeps the input', async ({ page }) => {
  await startCheckout(page, 'hero');
  await page.check('#uppdatering_samtycke');
  await page.click('#uppdatering_ja');
  await expect(page.locator('#kop_namn-fel')).toHaveText('Fyll i ditt förnamn.');
  await expect(page.locator('#kop_epost-fel')).toHaveText('Fyll i din e-postadress.');
  await expect(page.locator('#kop_namn')).toHaveAttribute('aria-invalid', 'true');

  await page.fill('#kop_namn', 'Åsa');
  await page.fill('#kop_epost', 'asa@');
  await page.click('#uppdatering_ja');
  await expect(page.locator('#kop_namn-fel')).toBeHidden();
  await expect(page.locator('#kop_epost-fel')).toHaveText('Kontrollera e-postadressen, till exempel namn@exempel.se.');
  await expect(page).toHaveURL('/kop/uppdatering');
  await expect(page.locator('#kop_namn')).toHaveValue('Åsa');
  await expect(page.locator('#kop_epost')).toHaveValue('asa@');
});

test('the box starts unticked, and the send button works only with it ticked', async ({ page }) => {
  await startCheckout(page, 'hero');
  const agree = page.locator('#uppdatering_samtycke');
  const send = page.locator('#uppdatering_ja');
  await expect(agree).not.toBeChecked();
  await expect(send).toBeDisabled();

  const email = uniqueEmail('kryss');
  await page.fill('#kop_namn', 'Kryss Test');
  await page.fill('#kop_epost', email);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL('/kop/uppdatering');
  expect(registrationsFor(email)).toHaveLength(0);

  await agree.check();
  await expect(send).toBeEnabled();
  await agree.uncheck();
  await expect(send).toBeDisabled();
});

test('failed storage shows an error and a retry option', async ({ page }) => {
  const email = uniqueEmail('retry');
  await startCheckout(page, 'hero');
  await fillAndAgree(page, 'Retry', email);

  await page.route('**/api/registrations', (route) => route.abort(), { times: 1 });
  await page.click('#uppdatering_ja');
  await expect(page.locator('#uppdatering-fel')).toBeVisible();
  await expect(page).toHaveURL('/kop/uppdatering');
  await expect(page.locator('#kop_epost')).toHaveValue(email);
  await expect(page.locator('#uppdatering_ja')).toBeEnabled();

  await page.route('**/update-status', (route) => route.abort(), { times: 1 });
  await page.click('#uppdatering_ja');
  await expect(page.locator('#uppdatering-fel')).toBeVisible();
  await expect(page).toHaveURL('/kop/uppdatering');

  await page.click('#uppdatering_ja');
  await expect(page).toHaveURL('/kop/tack');
  await expect.poll(() => registrationsFor(email)[0]?.update_status).toBe('ja');
  expect(registrationsFor(email)).toHaveLength(1);
});

test('sending with the box ticked saves the registration with "ja" and shows the confirmation', async ({ page }) => {
  const email = uniqueEmail('ja');
  await register(page, 'vardag', 'Åsa', email);
  await expect(page.locator('#lead-email')).toHaveText(email);

  await expect.poll(() => registrationsFor(email)[0]?.update_status).toBe('ja');
  const rows = registrationsFor(email);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ name: 'Åsa', cta_id: 'kop_vardag', update_status: 'ja', is_test: 0 });
  expect(rows[0].created_at).toBeTruthy();
  expect(rows[0].update_status_at).toBeTruthy();
  expect(rows[0].update_info_version).toMatch(/^[0-9a-f]{8}$/);
});

test('"Nej tack" and leaving store nothing, even with the fields filled in', async ({ page }) => {
  const declined = uniqueEmail('nej');
  await startCheckout(page, 'hjalpen');
  await fillAndAgree(page, 'Nej', declined);
  await page.click('#uppdatering_nej');
  await expect(page).toHaveURL('/kop/nej-tack');

  const left = uniqueEmail('ingetval');
  await startCheckout(page, 'hjalpen');
  await fillAndAgree(page, 'Inget Val', left);
  await page.goto('/');

  await page.waitForTimeout(1000);
  expect(registrationsFor(declined)).toHaveLength(0);
  expect(registrationsFor(left)).toHaveLength(0);
});

test('a double click creates no duplicate registrations', async ({ page }) => {
  const email = uniqueEmail('dupes');
  await page.goto('/kop/avslut');
  await page.locator('#kop_skicka').dblclick();
  await arrivedAt(page, '/kop/uppdatering');
  await fillAndAgree(page, 'Dupe', email);
  await page.locator('#uppdatering_ja').dblclick();
  await arrivedAt(page, '/kop/tack');

  await stored(email);
  // Give any late duplicate time to land before counting.
  await page.waitForTimeout(1000);
  expect(registrationsFor(email)).toHaveLength(1);
});

test('the whole flow works without horizontal scroll', async ({ page }) => {
  const noHorizontalScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  for (const path of ['/', '/kop/hero', '/kontakt', '/villkor', '/integritet', '/finns-inte']) {
    await page.goto(path);
    expect(await noHorizontalScroll(), path).toBe(true);
  }
  await startCheckout(page, 'hero');
  expect(await noHorizontalScroll(), '/kop/uppdatering').toBe(true);
  await fillAndAgree(page, 'Layout', uniqueEmail('layout'));
  await page.click('#uppdatering_ja');
  await expect(page).toHaveURL('/kop/tack');
  expect(await noHorizontalScroll(), '/kop/tack').toBe(true);
  await page.goto('/kop/nej-tack');
  expect(await noHorizontalScroll(), '/kop/nej-tack').toBe(true);
});

test('the fixed ids are in place independently of the content', async ({ page }) => {
  await page.goto('/');
  for (const id of ['sektion_hero', 'sektion_hjalpen', 'sektion_vardag', 'sektion_pedagog', 'sektion_prenumeration']) {
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
  for (const { ctaId } of CTAS) await expect(page.locator(`[data-cta-id="${ctaId}"]`)).toHaveCount(1);

  await page.goto('/kop/hero');
  for (const id of ['kop_sammanfattning', 'kop_skicka', 'kop_tillbaka']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await startCheckout(page, 'hero');
  for (const id of [
    'kop_namn',
    'kop_epost',
    'uppdatering_samtycke',
    'kop_integritet',
    'uppdatering_ja',
    'uppdatering_nej',
  ]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

test('the export gives correct registrations with update status', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'The export reads the database, so one browser is enough.');
  const email = uniqueEmail('export');
  await register(page, 'pedagog', 'Export Test', email);

  const csv = exportCsv(testInfo.outputPath('registrations.csv'));
  const [header, ...lines] = csv.replace(/^﻿/, '').trim().split(/\r\n/);
  expect(header).toBe(
    'id,created_at,name,email,cta_id,update_status,update_status_at,update_info_version,utm_source,utm_medium,utm_campaign,utm_content,message_id,ad_id,page_version,analytics_consent,is_test',
  );
  const line = lines.find((l) => l.includes(email));
  expect(line).toMatch(new RegExp(`,Export Test,${email.replaceAll('.', '\\.')},kop_pedagog,ja,`));
});

test('the purchase flow works with the keyboard and shows a clear focus indicator', async ({ page }, testInfo) => {
  test.skip(
    !testInfo.project.name.endsWith('chrome'),
    'Safari only tabs to links with "Press Tab to highlight each item" turned on.',
  );

  /** Presses Tab until the element is focused, checking each focused control has a visible outline. */
  async function tabTo(selector: string) {
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate((target) => {
        const element = document.activeElement as HTMLElement;
        const style = getComputedStyle(element);
        return {
          isTarget: element.matches(target),
          outline: style.outlineStyle,
          width: parseFloat(style.outlineWidth),
        };
      }, selector);
      expect(focused.outline, `focus outline while tabbing to ${selector}`).not.toBe('none');
      expect(focused.width).toBeGreaterThanOrEqual(2);
      if (focused.isTarget) return;
    }
    throw new Error(`Could not reach ${selector} with Tab`);
  }

  await page.goto('/kop/hero');
  await tabTo('#kop_skicka');
  await page.keyboard.press('Enter');
  await arrivedAt(page, '/kop/uppdatering');

  await tabTo('#kop_namn');
  await page.keyboard.type('Tangent');
  await tabTo('#kop_epost');
  await page.keyboard.type(uniqueEmail('keyboard'));
  await tabTo('#uppdatering_samtycke');
  await page.keyboard.press('Space');
  await tabTo('#uppdatering_ja');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/kop/tack');
});
