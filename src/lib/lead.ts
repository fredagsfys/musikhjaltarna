import type { CtaId } from '~/config/site';

const STORAGE_KEY = 'pianotopia:lead';
/** Stored by the Worker in D1 (see worker/index.ts). */
const ENDPOINT = '/api/leads';

export interface Lead {
  name: string;
  email: string;
  ctaId: CtaId | null;
}

/** Purchase intent and update opt-in are recorded as separate submissions. */
type LeadSubmission = { type: 'purchase_intent'; lead: Lead } | { type: 'updates_opt_in'; email: string };

export function saveLead(lead: Lead) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lead));
  } catch {
    // Storage can be unavailable (private mode); the flow still works without it.
  }
}

export function loadLead(): Lead | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Lead) : null;
  } catch {
    return null;
  }
}

export function clearLead() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore: nothing to clear.
  }
}

export async function submitLead(submission: LeadSubmission) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
    keepalive: true,
  });
  if (!response.ok) throw new Error(`Lead submission failed: ${response.status}`);
}
