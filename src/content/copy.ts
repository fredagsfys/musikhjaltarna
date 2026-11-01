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
const flowEnding = { title: text, text, back: text, website: text };
const infoPage = z.strictObject({ title: text, description: text, body: z.array(text).min(1) });

const schema = z.strictObject({
  offer: z.strictObject({
    price: z.number().int().positive(),
    period: text,
    periodShort: text,
    buyButton: text,
  }),
  links: z.strictObject({ website: z.url() }),
  seo: z.strictObject({ title: text, description: text }),
  header: z.strictObject({ navHowItWorks: text, navPedagogue: text }),
  hero: z.strictObject({
    eyebrow: text,
    title: text,
    titleAccent: text,
    lead: text,
    trust: text,
    imageLabel: text,
    note: z.array(text).min(1),
  }),
  howItWorks: z.strictObject({
    eyebrow: text,
    title: text,
    intro: text,
    steps: z.array(card).min(1),
    example: z.strictObject({ eyebrow: text, title: text, text, imageLabel: text, note: text }),
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
    text,
    readMore: text,
    photoAlt: text,
    captionNote: text,
    captionName: text,
    captionRole: text,
  }),
  subscription: z.strictObject({
    eyebrow: text,
    title: text,
    description: text,
    boxes: z.array(z.strictObject({ title: text, items: z.array(text).min(1) })).min(1),
    trust: text,
  }),
  footer: z.strictObject({ contact: text, terms: text, privacy: text, consentSettings: text }),
  consent: z.strictObject({ title: text, text, privacyLink: text, accept: text, decline: text }),
  purchase: z.strictObject({
    title: text,
    subtitle: text,
    pricePeriod: text,
    nameLabel: text,
    emailLabel: text,
    privacy: text,
    privacyLink: text,
    submit: text,
    submitting: text,
    back: text,
    errors: z.strictObject({ nameMissing: text, emailMissing: text, emailInvalid: text, sendFailed: text }),
  }),
  updates: z.strictObject({
    title: text,
    status: text,
    question: text,
    info: text,
    yes: text,
    no: text,
    saving: text,
    error: text,
  }),
  thanks: z.strictObject({ ...flowEnding, text: text.includes('{epost}'), emailFallback: text }),
  declined: z.strictObject(flowEnding),
  notFound: z.strictObject({ title: text, text, link: text }),
  pages: z.strictObject({ kontakt: infoPage, villkor: infoPage, integritet: infoPage }),
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
/** "79 kr/mån", for tight spaces like the header. */
export const priceLabelShort = `${copy.offer.price} kr/${copy.offer.periodShort}`;
