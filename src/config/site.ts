export const site = {
  /** The company and sender. */
  name: 'Pianotopia',
  /** The app being offered. */
  product: 'Musikhjältarna',
  legalName: 'Pianotopia AB',
  lang: 'sv',
  locale: 'sv_SE',
  title: 'Musikhjältarna – Hjälpen mellan pianolektionerna',
  description:
    'Musikhjältarna är ett övningsverktyg i en app där barnet övar roligt, enkelt och självständigt mellan pianolektionerna. Ett komplement till barnets pianolärare.',
  themeColor: '#fdfaf4',
  ogImage: '/og-image.png',
  offer: {
    price: 79,
    currency: 'SEK',
    priceLabel: '79 kr/månad',
  },
} as const;

/** Every buy button has its own ID so conversion can be attributed per section. */
export const CTA_IDS = ['kop_hero', 'kop_hjalpen', 'kop_vardag', 'kop_pedagog', 'kop_avslut'] as const;
export type CtaId = (typeof CTA_IDS)[number];

export const isCtaId = (value: unknown): value is CtaId =>
  typeof value === 'string' && (CTA_IDS as readonly string[]).includes(value);

/** All buy buttons lead to the same purchase step. */
export const routes = {
  home: '/',
  purchase: '/kop',
  updates: '/kop/uppdatering',
  thanks: '/kop/tack',
  declined: '/kop/nej-tack',
  about: '/om-pianotopia',
  contact: '/kontakt',
  terms: '/villkor',
  privacy: '/integritet',
} as const;
