/**
 * Editable content: texts, price and links from copy.yaml, validated at build time.
 * Editors change copy.yaml (see docs/EDITING.md); fixed ids and behaviour stay in code.
 * A broken edit fails the build with a message naming the key, so the live site is untouched.
 */
import { z } from 'astro/zod';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
import raw from './copy.yaml?raw';

const text = z.string().trim().min(1);
const card = z.strictObject({ title: text, text });
const paragraphs = z.array(text).min(1);
const infoPage = z.strictObject({ title: text, description: text, body: paragraphs.optional() });

const schema = z.strictObject({
  offer: z.strictObject({
    price: z.number().int().positive(),
    period: text,
    periodShort: text,
    buyButton: text,
  }),
  links: z.strictObject({ website: z.url() }),
  seo: z.strictObject({ title: text, description: text }),
  header: z.strictObject({ navHowItWorks: text, navPedagogue: text, navSubscription: text }),
  hero: z.strictObject({
    eyebrow: text,
    title: text,
    titleAccent: text,
    lead: text,
    trust: text,
    imageAlt: text,
    note: text,
  }),
  howItWorks: z.strictObject({
    eyebrow: text,
    title: text,
    intro: text,
    // Exactly three: each step has a fixed picture in code.
    steps: z.array(card).length(3),
    example: z.strictObject({
      eyebrow: text,
      title: text,
      text,
      note: text,
      app: z.strictObject({ speech: text, feedback: text, listen: text, play: text, alt: text }),
    }),
  }),
  everyday: z.strictObject({
    eyebrow: text,
    title: text,
    intro: text,
    // Exactly three: each benefit has a fixed icon in code.
    benefits: z.array(card).length(3),
  }),
  pedagogue: z.strictObject({
    eyebrow: text,
    title: text,
    text: paragraphs,
    photoAlt: text,
    captionName: text,
    captionRole: text,
  }),
  subscription: z.strictObject({
    eyebrow: text,
    title: text,
    priceNote: text,
    boxes: z.array(z.strictObject({ title: text, items: z.array(text).min(1) })).min(1),
    trust: text,
  }),
  footer: z.strictObject({ contact: text, terms: text, privacy: text, consentSettings: text }),
  consent: z.strictObject({
    title: text,
    privacyLink: text,
    acceptAll: text,
    manage: text,
    settingsTitle: text,
    analyticsLabel: text,
    analyticsDescription: text,
    save: text,
  }),
  purchase: z.strictObject({ title: text, subtitle: text, submit: text, back: text }),
  updates: z.strictObject({
    title: text,
    status: paragraphs,
    question: text,
    info: text,
    nameLabel: text,
    namePlaceholder: text,
    emailLabel: text,
    emailPlaceholder: text,
    consent: text,
    privacyLink: text,
    yes: text,
    no: text,
    saving: text,
    errors: z.strictObject({ nameMissing: text, emailMissing: text, emailInvalid: text }),
    error: text,
  }),
  thanks: z.strictObject({ title: text, text, sentTo: text, emailFallback: text, back: text }),
  declined: z.strictObject({ title: text, text, back: text, website: text }),
  notFound: z.strictObject({ title: text, text, link: text }),
  // The privacy policy and the terms are Markdown: src/content/integritetspolicy.md and src/content/villkor.md.
  pages: z.strictObject({
    kontakt: infoPage.extend({
      // The box at the bottom of the contact page.
      box: z.strictObject({ intro: text, address: paragraphs, email: z.email() }),
    }),
  }),
});

function load() {
  const result = schema.safeParse(parse(raw));
  if (result.success) return result.data;
  const problems = result.error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  throw new Error(`src/content/copy.yaml is not valid:\n${problems.join('\n')}`);
}

export const copy = load();

/** Short hash of copy.yaml: changes whenever editors change any text, the price or a link. */
export const contentVersion = createHash('sha256').update(raw).digest('hex').slice(0, 8);

/** "79 kr/månad", used everywhere the price is shown. */
export const priceLabel = `${copy.offer.price} kr/${copy.offer.period}`;
/** "79 kr/mån", the short form used on the buy buttons. */
export const priceLabelShort = `${copy.offer.price} kr/${copy.offer.periodShort}`;
/** The buy buttons' text: "Prenumerera för 79 kr/mån". */
// Non-breaking spaces keep "79 kr/mån" on one line when the button wraps on narrow phones.
export const buyLabel = copy.offer.buyButton.replaceAll('{pris}', priceLabelShort.replaceAll(' ', '\u00a0'));
