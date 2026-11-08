# Function check (brief A §9)

The acceptance checklist from brief A §9, run as the automated suite in
[`tests/acceptance.spec.ts`](../tests/acceptance.spec.ts).

- **Run:** 2026-11-01, commit `f482389`, Playwright 1.64.1, Node 24.
- **Environment:** the production build served by `wrangler dev`, with the real Worker and an isolated local D1
  database.
- **Result:** 43 passed, 0 failed, 5 skipped by design (see below).

Rerun at any time:

```sh
npx playwright install chromium webkit   # once
npm run test:e2e                          # HTML report in playwright-report/
```

## Results

| Check                                                                                   | Desktop Chrome | Desktop Safari | Mobile Safari (iPhone) | Mobile Chrome (Android) |
| --------------------------------------------------------------------------------------- | :------------: | :------------: | :--------------------: | :---------------------: |
| All five buy buttons open the same step with the right CTA origin                       |       ✅       |       ✅       |           ✅           |           ✅            |
| Back from the purchase step restores the offer page and scroll position                 |       ✅       |       ✅       |           ✅           |           ✅            |
| The purchase step asks for nothing and stores nothing                                   |       ✅       |       ✅       |           ✅           |           ✅            |
| An invalid form shows the right error and keeps the input                               |       ✅       |       ✅       |           ✅           |           ✅            |
| The box starts unticked, and the send button works only with it ticked                  |       ✅       |       ✅       |           ✅           |           ✅            |
| Failed storage shows an error and a retry option                                        |       ✅       |       ✅       |           ✅           |           ✅            |
| Sending with the box ticked saves the registration with "ja" and shows the confirmation |       ✅       |       ✅       |           ✅           |           ✅            |
| "Nej tack" and leaving store nothing, even with the fields filled in                    |       ✅       |       ✅       |           ✅           |           ✅            |
| A double click creates no duplicate registrations                                       |       ✅       |       ✅       |           ✅           |           ✅            |
| The whole flow works without horizontal scroll                                          |       ✅       |       ✅       |           ✅           |           ✅            |
| The fixed ids are in place independently of the content                                 |       ✅       |       ✅       |           ✅           |           ✅            |
| The export gives correct registrations with update status                               |       ✅       |       –        |           –            |            –            |
| The purchase flow works with the keyboard and shows a clear focus indicator             |       ✅       |       –        |           –            |           ✅            |

**Skips (–), by design:**

- The export reads the database, so one browser is enough.
- Safari only moves Tab focus between links when "Press Tab to highlight each item" is turned on, so the keyboard test
  runs in Chrome.

## Coverage notes

- **In-app browsers:** the Facebook and Instagram in-app browsers are covered by engine, not by the apps themselves.
  On iOS they use WebKit (the Mobile Safari row); on Android they use Chromium (the Mobile Chrome row). A manual check
  in the real apps before launch is still worthwhile.
- **Devices:** the mobile rows use Playwright's iPhone 15 and Pixel 7 emulation, not physical phones.
- **Live site:** HTTPS, the `http://` → `https://` redirect and the `www` → bare-domain redirect were verified against
  `musikhjaltarna.se` itself. Content changes are checked by the build: an invalid `copy.yaml` fails it.
- **Stability:** across about 320 test executions after the final fixes, one failure occurred that could not be
  reproduced or captured. It is noted here rather than hidden; rerun the suite if a single test fails.
