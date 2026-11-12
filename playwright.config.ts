import { defineConfig, devices } from '@playwright/test';

const PORT = 8788;
/** Isolated local D1 for the tests, wiped at the start of every run. */
export const E2E_STATE = '.wrangler/e2e';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  // The tests read the shared local database through Wrangler; two workers keep that contention low.
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'desktop-safari', use: { ...devices['Desktop Safari'] } },
    // Safari's engine; the Facebook and Instagram in-app browsers on iOS use it too.
    { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
    // Chromium on Android, which the in-app browsers there are built on.
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // A placeholder container id, so a missing stub never reaches the real one (tests/fixtures.ts).
    command: `rm -rf ${E2E_STATE} && PUBLIC_GTM_ID=GTM-E2E npx astro build && npx wrangler dev --port ${PORT} --local --persist-to ${E2E_STATE}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
