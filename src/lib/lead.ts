import { PUBLIC_LEAD_ENDPOINT } from 'astro:env/client';
import type { CtaId } from '~/config/site';

const STORAGE_KEY = 'pianotopia:lead';

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
  const body = JSON.stringify({ ...submission, submittedAt: new Date().toISOString() });

  if (!PUBLIC_LEAD_ENDPOINT) {
    console.info('[lead] PUBLIC_LEAD_ENDPOINT is not set; submission not sent:', body);
    return;
  }

  const response = await fetch(PUBLIC_LEAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
  if (!response.ok) throw new Error(`Lead submission failed: ${response.status}`);
}
