import type { CtaId } from '~/config/site';
import type { AdSource } from './tracking';

const STORAGE_KEY = 'musikhjaltarna:registration';
/** Set by the inline script in BaseLayout when a page is opened with `?test`. */
const TEST_KEY = 'musikhjaltarna:test';
/** The address and registration shown on the thank-you page, set when the flow completes. */
const CONFIRMED_KEY = 'musikhjaltarna:confirmation';

/** One submission of the purchase form. The id is reused for retries, so the server never stores it twice. */
export interface Registration {
  id: string;
  name: string;
  email: string;
  ctaId: CtaId | null;
  isTest: boolean;
  /** The session's ad source, so registrations can be counted per ad (brief B §3). */
  source: AdSource;
  /** The page and content version the visitor saw (brief B §2). */
  pageVersion: string;
  /** Set once purchase_intent_submit has been sent, so a resubmit doesn't send it again (brief B §7). */
  intentTracked?: boolean;
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

export function saveRegistration(registration: Registration) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(registration));
  } catch {
    // Storage can be unavailable (private mode); the flow still works within the page.
  }
}

export function loadRegistration(): Registration | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Registration) : null;
  } catch {
    return null;
  }
}

export function clearRegistration() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore: nothing to clear.
  }
}

/**
 * Ends the flow once the update choice is saved: the next submission starts a new registration,
 * even if the visitor moves on before the confirmation page has loaded.
 */
export function completeRegistration(registration: Registration) {
  clearRegistration();
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
