/** The playable practice example in "Så fungerar": the lit note shows which key to press. */
import { expect, test } from './fixtures';

test('the practice example can be played: a wrong key asks again, five right keys give five stars', async ({
  page,
}) => {
  await page.goto('/');
  const example = page.locator('[data-app-example]');
  await example.scrollIntoViewIfNeeded();
  const stars = example.locator('[data-star].is-earned');

  await example.locator('[data-play]').click();
  await expect(example.locator('[data-note="C"]')).toHaveClass(/is-lit/);

  await example.locator('[data-key="E"]').click();
  await expect(example.locator('[data-feedback]')).toContainText('Prova igen');
  await expect(stars).toHaveCount(0);

  for (const key of ['C', 'D', 'E', 'F', 'G']) await example.locator(`[data-key="${key}"]`).click();
  await expect(stars).toHaveCount(5);
  await expect(example.locator('[data-speech]')).toContainText('Bra spelat');

  // "Börja om" starts over with no stars.
  await example.locator('[data-play]').click();
  await expect(stars).toHaveCount(0);
});

test('the keys can be played with the keyboard', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.endsWith('chrome'), 'Safari only tabs to buttons with a setting turned on.');
  await page.goto('/');
  const example = page.locator('[data-app-example]');
  await example.scrollIntoViewIfNeeded();
  await example.locator('[data-play]').click();
  await expect(example.locator('[data-key="C"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(example.locator('[data-star].is-earned')).toHaveCount(1);
});

test('a black key is a miss, and two misses show which key to press', async ({ page }) => {
  await page.goto('/');
  const example = page.locator('[data-app-example]');
  await example.scrollIntoViewIfNeeded();
  await example.locator('[data-play]').click();

  const black = example.locator('[data-black]').first();
  await black.click();
  await expect(example.locator('[data-star].is-earned')).toHaveCount(0);
  await expect(example.locator('[data-feedback]')).toContainText('Prova igen');
  await expect(example.locator('.is-hint')).toHaveCount(0);

  await black.click();
  await expect(example.locator('[data-key="C"]')).toHaveClass(/is-hint/);
});

test('"Spela" while the tune is still playing starts a game that is not reset afterwards', async ({ page }) => {
  await page.goto('/');
  const example = page.locator('[data-app-example]');
  await example.scrollIntoViewIfNeeded();
  await example.locator('[data-listen]').click();
  await expect(example).toHaveAttribute('data-state', 'listening');
  await example.locator('[data-play]').click();
  await example.locator('[data-key="C"]').click();

  // Longer than the tune takes to play.
  await page.waitForTimeout(3200);
  await expect(example).toHaveAttribute('data-state', 'playing');
  await expect(example.locator('[data-star].is-earned')).toHaveCount(1);
});
