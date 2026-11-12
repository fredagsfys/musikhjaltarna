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
