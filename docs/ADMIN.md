# Administration

How registrations are stored, who can reach them, how to export and delete them, and what the platform costs.
Content editing is covered separately in [`EDITING.md`](EDITING.md) (Swedish).

## Platform and integrations

| Part                      | Service                                                  | Notes                                                           |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| Site and API              | Cloudflare Workers with static assets (`musikhjaltarna`) | Pages are static files; only `/api/*` runs `worker/index.ts`    |
| Registrations             | Cloudflare D1 database `musikhjaltarna`                  | Table `registrations`, created by the Worker on first use       |
| Events and funnel         | Google Analytics 4 via Tag Manager (`GTM-M8WZZXQZ`)      | After consent; see [`TRACKING.md`](TRACKING.md)                 |
| Page views                | Cloudflare Web Analytics                                 | Cookieless; beacon in every page (`site.webAnalyticsToken`)     |
| DNS, HTTPS, redirects     | Cloudflare (zone `musikhjaltarna.se`)                    | `www` and `http://` redirect to `https://musikhjaltarna.se`     |
| Domain registration       | Loopia (registrar for `.se`)                             | Nameservers point to Cloudflare; DNSSEC record from Cloudflare  |
| Code, content and deploys | GitHub `fredagsfys/musikhjaltarna`                       | A push to `main` deploys through Cloudflare Workers Builds      |
| Checks                    | GitHub Actions (`.github/workflows/ci.yml`)              | Type check, build and formatting on every push and pull request |

## Access

Only designated administrators can reach registrations:

- **Cloudflare** (registrations, analytics, DNS): invite people under _Manage Account → Members_. Give the least role
  that fits, for example read-only D1 access for someone who only exports.
- **GitHub** (content and code): invite editors under _Settings → Collaborators_. Write access is needed to edit
  `copy.yaml` and images.

Registrations are never exposed through the site. The API only accepts new registrations and choices from the site
itself and has no way to read data back.

## Registrations

One row per submission of the purchase form:

| Column                | Meaning                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| `id`                  | Registration id (UUID), created in step 1; retries reuse it                           |
| `created_at`          | Time the visitor sent the last step with the consent box ticked (UTC)                 |
| `name`, `email`       | First name and e-mail from the last step                                              |
| `cta_id`              | Buy button the visitor came from (`kop_hero` … `kop_avslut`)                          |
| `update_status`       | `ja`; `inget_val` only if the send's second request failed. `nej` is never stored     |
| `update_status_at`    | When `ja` or `nej` was recorded (UTC)                                                 |
| `update_info_version` | Which version of the update information the visitor responded to (a hash of its text) |
| `is_test`             | `1` for internal tests: open any page with `?test` first, for example `/?test`        |

Read them in Cloudflare under _Storage & Databases → D1 → musikhjaltarna → Console_, for example:

```sql
SELECT update_status, COUNT(*) FROM registrations WHERE is_test = 0 GROUP BY update_status;
```

## Export, report and deletion

These commands use Wrangler with your own Cloudflare login, so they only work for administrators. Run `npx wrangler login`
once first. Add `--local` to use the local database from `npx wrangler dev`.

```sh
# All registrations with update status, as CSV (UTF-8, opens correctly in Excel)
npm run export:registrations                       # → registrations-YYYY-MM-DD.csv
npm run export:registrations -- --out=export.csv

# Stored registrations per analytics choice, to compare with GA4 (docs/REPORTS.md)
npm run report:registrations                       # the last 30 days
npm run report:registrations -- --from=2026-11-01 --to=2026-11-30

# Delete a person's registrations, by e-mail or registration id.
# Without --yes it only shows what would be deleted.
npm run delete:registration -- anna@example.com
npm run delete:registration -- anna@example.com --yes
```

Exported files contain personal data and are ignored by git (`registrations-*.csv`). Store and delete them according to
the privacy policy.

## Old `leads` table

Before the registration model, leads were stored in a table called `leads`. It only holds test entries from before
launch. Delete it in the D1 console once you no longer need it:

```sql
DROP TABLE leads;
```

## Running costs

At the expected volume of a purchase-intent test, the platform runs within free plans:

| Service                            | Plan and limits (check current terms)                                                                   | Cost                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| Cloudflare Workers                 | Free: static asset requests are free and unlimited; Worker requests (`/api/*` only) up to 100,000 a day | 0 kr                |
| Cloudflare D1                      | Free: 5 GB storage, 5 million rows read and 100,000 rows written a day                                  | 0 kr                |
| Cloudflare Web Analytics           | Free                                                                                                    | 0 kr                |
| Google Analytics 4 and Tag Manager | Free (standard properties)                                                                              | 0 kr                |
| Cloudflare DNS and HTTPS           | Free                                                                                                    | 0 kr                |
| GitHub and GitHub Actions          | Free for public repositories                                                                            | 0 kr                |
| Domain `musikhjaltarna.se`         | Yearly registration at Loopia                                                                           | Loopia's price list |

Current limits: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).
