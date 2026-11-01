/**
 * The tracking from brief B, checked against the events the page sends to PostHog (stubbed in
 * tests/fixtures.ts). Event catalogue: docs/TRACKING.md.
 */
import { registrationsFor } from './d1';
import { arrivedAt, expect, stored, submitPurchase, test, uniqueEmail } from './fixtures';

const AD = {
  utm_source: 'facebook',
  utm_medium: 'paid_social',
  utm_campaign: 'mh_test_1',
  utm_content: 'video_a',
  message_id: 'budskap_2',
  ad_id: '120210000000',
};
const adUrl = (path: string) => `${path}?${new URLSearchParams(AD)}`;

test('every event carries ids, a UTC timestamp, the page version and the environment', async ({ page, analytics }) => {
  await page.goto('/');
  const [view] = await analytics.waitFor('offer_view');
  expect(view.properties.event_id).toMatch(/^[0-9a-f-]{36}$/);
  expect(view.properties.event_timestamp).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  expect(view.properties.page_version).toMatch(/^[0-9a-f]+\.[0-9a-f]{8}$/);
  expect(view.properties.environment).toBe('development');
  expect(view.properties.$session_id).toBeUndefined(); // Assigned by PostHog's servers in cookieless mode.
});

test('the ad source follows the visitor through the flow and onto the registration', async ({ page, analytics }) => {
  await page.goto(adUrl('/'));
  const [view] = await analytics.waitFor('offer_view');
  expect(view.properties).toMatchObject(AD);

  // Internal navigation drops the parameters from the URL; the session keeps them.
  const email = uniqueEmail('kalla');
  await submitPurchase(page, 'hjalpen', 'Källa Test', email);
  const [checkout] = await analytics.waitFor('checkout_view');
  expect(checkout.properties).toMatchObject(AD);

  const [row] = await stored(email);
  expect(row).toMatchObject(AD);
  expect(row.page_version).toBe(view.properties.page_version);
});

test('a later tagged arrival in the same session does not overwrite the source', async ({ page, analytics }) => {
  await page.goto(adUrl('/'));
  await analytics.waitFor('offer_view');
  await page.goto('/?utm_source=instagram&ad_id=999');
  const views = await analytics.waitFor('offer_view', 2);
  expect(views[1].properties).toMatchObject({ utm_source: 'facebook', ad_id: AD.ad_id });
});

test('section and buy-button views need the dwell time', async ({ page, analytics }) => {
  await page.goto('/');
  const [hero] = await analytics.waitFor('section_view');
  expect(hero.properties).toMatchObject({
    section_id: 'sektion_hero',
    section_position: 1,
    view_order: 1,
    view_count: 1,
  });
  expect(hero.properties.time_since_arrival).toBeGreaterThanOrEqual(2000);
  // On some screens the hero button starts just below the fold, and a sliver doesn't count.
  await page.locator('[data-cta-id="kop_hero"]').scrollIntoViewIfNeeded();
  const [cta] = await analytics.waitFor('cta_view');
  expect(cta.properties).toMatchObject({ cta_id: 'kop_hero', section_id: 'sektion_hero' });

  // Scrolling straight past a section does not count it.
  await page.locator('#sektion_prenumeration').scrollIntoViewIfNeeded();
  await analytics.waitFor('section_view', 2);
  const viewed = analytics.named('section_view').map((event) => event.properties.section_id);
  expect(viewed).toEqual(['sektion_hero', 'sektion_prenumeration']);
  // Leaving the hero ends its exposure episode.
  const [end] = await analytics.waitFor('section_exposure_end');
  expect(end.properties).toMatchObject({ section_id: 'sektion_hero' });
  expect(end.properties.exposure_ms).toBeGreaterThan(0);
});

test('a buy click carries what the visitor had seen', async ({ page, analytics }) => {
  await page.goto('/');
  await analytics.waitFor('section_view');
  await page.locator('[data-cta-id="kop_hero"]').click();
  await arrivedAt(page, '/kop/hero');

  const [click] = await analytics.waitFor('purchase_click');
  expect(click.properties).toMatchObject({
    cta_id: 'kop_hero',
    section_id: 'sektion_hero',
    sections_seen: ['sektion_hero'],
    max_section_seen: 'sektion_hero',
    last_section_seen: 'sektion_hero',
  });
  expect(click.properties.max_scroll_percent).toBeGreaterThanOrEqual(0);
  expect(click.properties.time_to_click).toBeGreaterThanOrEqual(2000);
  expect(click.properties.active_time_to_click).toBeGreaterThan(0);
});

test('the purchase step reports view, start, errors and back', async ({ page, analytics }) => {
  await page.goto('/');
  await page.locator('[data-cta-id="kop_vardag"]').click();
  await arrivedAt(page, '/kop/vardag');
  await analytics.waitFor('checkout_view');

  await page.click('#kop_skicka');
  const [error] = await analytics.waitFor('checkout_error');
  expect(error.properties).toMatchObject({ category: 'validation', fields: ['name', 'email'], cta_id: 'kop_vardag' });

  await page.fill('#kop_namn', 'Någon');
  await page.fill('#kop_epost', 'inte-en-adress');
  await analytics.waitFor('checkout_start');
  await page.click('#kop_skicka');
  const errors = await analytics.waitFor('checkout_error', 2);
  expect(errors[1].properties.fields).toEqual(['email']);

  await page.click('#kop_tillbaka');
  await expect(page).toHaveURL('/');
  const [back] = await analytics.waitFor('checkout_back');
  expect(back.properties.cta_id).toBe('kop_vardag');
  expect(analytics.named('checkout_start')).toHaveLength(1);
});

test('the registration, choice and confirmation are each sent once, on confirmed storage', async ({
  page,
  analytics,
}) => {
  const email = uniqueEmail('spar');
  await submitPurchase(page, 'pedagog', 'Spår Test', email);
  const [{ id }] = await stored(email);

  const [intent] = await analytics.waitFor('purchase_intent_submit');
  expect(intent.properties).toMatchObject({
    event_id: `purchase_intent_submit:${id}`,
    registration_id: id,
    cta_id: 'kop_pedagog',
    price: 79,
    currency: 'SEK',
  });
  const [notice] = await analytics.waitFor('availability_notice_view');
  expect(notice.properties.registration_id).toBe(id);

  // Going back and sending again updates the same registration without a second intent.
  await page.goBack();
  await arrivedAt(page, '/kop/pedagog');
  await page.click('#kop_skicka');
  await arrivedAt(page, '/kop/uppdatering');
  await analytics.waitFor('availability_notice_view', 2);
  expect(analytics.named('purchase_intent_submit')).toHaveLength(1);

  await page.click('#uppdatering_ja');
  await arrivedAt(page, '/kop/tack');
  const [choice] = await analytics.waitFor('updates_choice');
  expect(choice.properties).toMatchObject({ event_id: `updates_choice:${id}:ja`, registration_id: id, choice: 'ja' });
  expect(choice.properties.info_version).toBe(registrationsFor(email)[0].update_info_version);
  const [confirmation] = await analytics.waitFor('updates_confirmation_view');
  expect(confirmation.properties.registration_id).toBe(id);

  // Names and addresses never reach the analytics.
  for (const body of analytics.bodies) {
    expect(body).not.toContain(email);
    expect(body).not.toContain('Spår Test');
  }
});

test('direct visits to later steps send no step events', async ({ page, analytics }) => {
  await page.goto('/kop/tack');
  await analytics.waitFor('$pageview');
  await page.goto('/kop/uppdatering');
  await arrivedAt(page, '/kop');
  await analytics.waitFor('checkout_view');
  expect(analytics.named('updates_confirmation_view')).toHaveLength(0);
  expect(analytics.named('availability_notice_view')).toHaveLength(0);
});

test('links to Pianotopia are tracked with their placement', async ({ page, analytics }) => {
  await page.route('https://pianotopia.se/**', (route) => route.fulfill({ body: 'ok' }));
  await page.goto('/');
  await page.locator('footer [data-link-id="pianotopia_website"]').click();
  const [link] = await analytics.waitFor('external_link_click');
  expect(link.properties).toMatchObject({ link_id: 'pianotopia_website', placement: 'footer' });
});

test('tracking sets no cookies and stores nothing but the session source', async ({ page, context, analytics }) => {
  await page.goto(adUrl('/'));
  await analytics.waitFor('section_view');
  expect(await context.cookies()).toEqual([]);
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  expect(storage.local).toEqual([]);
  expect(storage.session).toEqual(['musikhjaltarna:source']);
});

test.describe('with PostHog blocked', () => {
  test.use({ blockAnalytics: true });

  test('the purchase flow still works', async ({ page }) => {
    const email = uniqueEmail('blockerad');
    await page.goto('/');
    await page.locator('[data-cta-id="kop_avslut"]').click();
    await arrivedAt(page, '/kop/avslut');
    await page.fill('#kop_namn', 'Blockerad Test');
    await page.fill('#kop_epost', email);
    await page.click('#kop_skicka');
    await arrivedAt(page, '/kop/uppdatering');
    await page.click('#uppdatering_nej');
    await arrivedAt(page, '/kop/nej-tack');
    await expect.poll(() => registrationsFor(email)[0]?.update_status).toBe('nej');
  });
});
