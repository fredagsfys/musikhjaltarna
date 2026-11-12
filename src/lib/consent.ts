/**
 * The visitor's choice about analytics (brief B §9). Nothing is measured until they accept:
 *
 * - undecided: events from the current page are held in memory only, and nothing is sent or stored;
 * - granted: Google Tag Manager (with Google Analytics) and Cloudflare Web Analytics run;
 * - denied: nothing is sent, and the held events are discarded.
 *
 * The choice itself is kept in localStorage, which is strictly necessary to remember it. It is asked
 * again after 12 months, or when CONSENT_VERSION changes: bump it when the analytics tools or what
 * they are used for change.
 */
export type ConsentChoice = 'granted' | 'denied';

export const CONSENT_KEY = 'musikhjaltarna:consent';
export const CONSENT_VERSION = 2;
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

interface StoredConsent {
  choice: ConsentChoice;
  version: number;
  at: string;
}

let current: ConsentChoice | null | undefined;
const listeners: ((choice: ConsentChoice) => void)[] = [];

function load(): ConsentChoice | null {
  try {
    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null') as StoredConsent | null;
    const valid =
      stored &&
      (stored.choice === 'granted' || stored.choice === 'denied') &&
      stored.version === CONSENT_VERSION &&
      Date.now() - Date.parse(stored.at) < MAX_AGE_MS;
    return valid ? stored.choice : null;
  } catch {
    return null;
  }
}

/** The choice that applies on this page, or null while the visitor hasn't decided. */
export function consent(): ConsentChoice | null {
  current ??= load();
  return current;
}

export function setConsent(choice: ConsentChoice) {
  current = choice;
  try {
    const stored: StoredConsent = { choice, version: CONSENT_VERSION, at: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(stored));
  } catch {
    // Without storage the choice holds for this page only, and the banner asks again on the next.
  }
  for (const listener of listeners) listener(choice);
}

/** Calls `listener` whenever the visitor makes or changes their choice on this page. */
export function onConsentChange(listener: (choice: ConsentChoice) => void) {
  listeners.push(listener);
}
