import type { CtaId } from '~/config/site';

const STORAGE_KEY = 'musikhjaltarna:registration';
/** Set by the inline script in BaseLayout when a page is opened with `?test`. */
const TEST_KEY = 'musikhjaltarna:test';

/** One submission of the purchase form. The id is reused for retries, so the server never stores it twice. */
export interface Registration {
  id: string;
  name: string;
  email: string;
  ctaId: CtaId | null;
  isTest: boolean;
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
