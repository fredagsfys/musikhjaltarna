/**
 * Technical site settings. Texts, price and links editors may change live in src/content/copy.yaml.
 * Kept free of content imports: the Worker imports this file too.
 */
export const site = {
  /** The company and sender. */
  name: 'Pianotopia',
  /** The app being offered. */
  product: 'Musikhjältarna',
  legalName: 'Pianotopia AB',
  lang: 'sv',
  locale: 'sv_SE',
  currency: 'SEK',
  themeColor: '#fdfaf4',
  ogImage: '/og-image.png',
  /** Cloudflare Web Analytics site token. Public by design: it appears in every page's HTML. */
  webAnalyticsToken: 'd1e467b136e34bb7b94a7af4868eea98',
  /**
   * Google Tag Manager, which loads Google Analytics 4 (brief B). The container id is public by design:
   * it is in every page's JavaScript. Empty means tracking is off; PUBLIC_GTM_ID overrides it (used by
   * the tests).
   */
  gtmId: 'GTM-M8WZZXQZ',
  /** The Worker's name, to tell its own workers.dev address from branch previews. */
  workerName: 'musikhjaltarna',
} as const;

/** Fixed section ids from brief A. They are part of the measurement setup; content edits must not change them. */
export const SECTION_IDS = {
  hero: 'sektion_hero',
  hjalpen: 'sektion_hjalpen',
  vardag: 'sektion_vardag',
  pedagog: 'sektion_pedagog',
  prenumeration: 'sektion_prenumeration',
} as const;

/** Every buy button has its own ID so conversion can be attributed per section. */
export const CTA_IDS = ['kop_hero', 'kop_hjalpen', 'kop_vardag', 'kop_pedagog', 'kop_avslut'] as const;
export type CtaId = (typeof CTA_IDS)[number];

export const isCtaId = (value: unknown): value is CtaId =>
  typeof value === 'string' && (CTA_IDS as readonly string[]).includes(value);

/** The section each buy button sits in. */
export const CTA_SECTION: Record<CtaId, string> = {
  kop_hero: SECTION_IDS.hero,
  kop_hjalpen: SECTION_IDS.hjalpen,
  kop_vardag: SECTION_IDS.vardag,
  kop_pedagog: SECTION_IDS.pedagog,
  kop_avslut: SECTION_IDS.prenumeration,
};

/** All buy buttons lead to the same purchase step, each through its own path (see `purchasePath`). */
export const routes = {
  home: '/',
  purchase: '/kop',
  updates: '/kop/uppdatering',
  thanks: '/kop/tack',
  declined: '/kop/nej-tack',
  contact: '/kontakt',
  terms: '/villkor',
  privacy: '/integritet',
} as const;

/** Path segment for a buy button, e.g. `kop_hero` → `hero`. */
export const ctaSlug = (ctaId: CtaId) => ctaId.replace(/^kop_/, '');

/**
 * Each buy button opens its own purchase path, e.g. `/kop/hero`, so page-view analytics
 * attribute clicks per section without query strings or custom events.
 */
export const purchasePath = (ctaId: CtaId) => `${routes.purchase}/${ctaSlug(ctaId)}`;
