import type { CtaId } from '~/config/site';
import type { ConsentChoice } from './consent';
import type { AdSource } from './tracking';

const STORAGE_KEY = 'musikhjaltarna:registration';
/** Set by the inline script in BaseLayout when a page is opened with `?test`. */
const TEST_KEY = 'musikhjaltarna:test';
/** The address and registration shown on the thank-you page, set when the flow completes. */
const CONFIRMED_KEY = 'musikhjaltarna:confirmation';

/**
 * A visit to the purchase flow, started by "Gå vidare till betalning" in step 1. Nothing is sent to the
 * server for it: the name and e-mail are only asked for in the last step, and only stored when the
 * visitor ticks the consent box there. The id becomes the registration's id, so PostHog's purchase
 * intent and a stored registration can be matched.
 */
export interface Checkout {
  id: string;
  ctaId: CtaId | null;
  /** Set once purchase_intent_submit has been sent, so going back and on again doesn't send it twice. */
  intentTracked?: boolean;
}

/** What the last step stores, with the visitor's consent. Retries reuse the id, so it is never stored twice. */
export interface Registration {
  id: string;
  name: string;
  email: string;
  ctaId: CtaId | null;
  isTest: boolean;
  /** The session's ad source, so registrations can be counted per ad (brief B §3). Empty without consent. */
  source: AdSource;
  /** The analytics choice when sending: tells stored registrations PostHog can see from those it can't. */
  analyticsConsent: ConsentChoice | null;
  /** The page and content version the visitor saw (brief B §2). */
  pageVersion: string;
}

/** What the thank-you page needs once the flow is complete. */
export interface Confirmation {
  email: string;
  registrationId: string;
}

export type UpdateStatus = 'ja' | 'nej';

/** True when this browser session is an internal test, so its registrations are flagged (brief A §7). */
export function isTestSession() {
  try {
    return sessionStorage.getItem(TEST_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveCheckout(checkout: Checkout) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(checkout));
  } catch {
    // Storage can be unavailable (private mode); the flow still works within the page.
  }
}

export function loadCheckout(): Checkout | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Checkout) : null;
  } catch {
    return null;
  }
}

export function clearCheckout() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore: nothing to clear.
  }
}

/**
 * Ends the flow once the registration is stored: the next visit to the purchase flow starts afresh,
 * even if the visitor moves on before the confirmation page has loaded.
 */
export function completeRegistration(registration: Registration) {
  clearCheckout();
  try {
    const confirmation: Confirmation = { email: registration.email, registrationId: registration.id };
    sessionStorage.setItem(CONFIRMED_KEY, JSON.stringify(confirmation));
  } catch {
    // The confirmation page falls back to a generic text.
  }
}

/** The confirmation for the thank-you page, read once. */
export function takeConfirmation(): Confirmation | null {
  try {
    const raw = sessionStorage.getItem(CONFIRMED_KEY);
    sessionStorage.removeItem(CONFIRMED_KEY);
    return raw ? (JSON.parse(raw) as Confirmation) : null;
  } catch {
    return null;
  }
}

async function post(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request to ${url} failed: ${response.status}`);
}

/** Stores the registration (stored in D1 by worker/index.ts). Safe to call again for the same id. */
export const submitRegistration = (registration: Registration) => post('/api/registrations', registration);

/** Records ja or nej on the registration, with the version of the update information shown. */
export const submitUpdateStatus = (id: string, status: UpdateStatus, infoVersion: string) =>
  post(`/api/registrations/${encodeURIComponent(id)}/update-status`, { status, infoVersion });
