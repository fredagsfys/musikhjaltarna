/**
 * Section exposure and buy-button visibility on the offer page (brief B §5 and §6).
 *
 * - A section is viewed when at least 50% of it is visible, or, for a section taller than the
 *   screen, an area of 50% of the screen height, for 2 continuous seconds in an active tab.
 * - A buy button is viewed when at least 50% of it is visible for 1 continuous second.
 *
 * Every qualified view is an episode: it sends `section_view` (or `cta_view`) when it qualifies, and
 * `section_exposure_end` with its duration when it ends. Ending events are best effort; totals are
 * therefore lower bounds when a visitor closes the tab mid-view.
 *
 * Section events also carry the maximum scroll so far, so a visit without a buy click still records
 * how far it got, without relying on a last "leaving the page" event (brief B §7).
 */
import { CTA_SECTION, isCtaId } from '~/config/site';
import { track } from './tracking';

const SECTION_DWELL_MS = 2000;
const CTA_DWELL_MS = 1000;
const THRESHOLDS = Array.from({ length: 101 }, (_, i) => i / 100);

interface Watched {
  element: HTMLElement;
  dwellMs: number;
  qualifies: (entry: IntersectionObserverEntry) => boolean;
  onQualified: () => void;
  onEnd?: (durationMs: number) => void;
  inView: boolean;
  timer?: number;
  qualifiedAt?: number;
}

/** Context attached to each buy click (brief B §6). */
export interface ClickContext {
  sections_seen: string[];
  max_section_seen: string | null;
  last_section_seen: string | null;
  max_scroll_percent: number;
  time_to_click: number;
  active_time_to_click: number;
}

const sectionQualifies = (entry: IntersectionObserverEntry) => {
  const viewport = entry.rootBounds?.height ?? window.innerHeight;
  const tall = entry.boundingClientRect.height > viewport;
  return tall ? entry.intersectionRect.height >= viewport * 0.5 : entry.intersectionRatio >= 0.5;
};
const ctaQualifies = (entry: IntersectionObserverEntry) => entry.intersectionRatio >= 0.5;

export function trackExposure() {
  const start = performance.now();
  let activeMs = 0;
  let activeSince: number | null = document.visibilityState === 'visible' ? start : null;
  const activeTime = () => activeMs + (activeSince === null ? 0 : performance.now() - activeSince);

  let viewOrder = 0;
  let maxScroll = 0;
  const viewCounts = new Map<string, number>();
  const seen: string[] = [];
  let lastSeen: string | null = null;

  const sections = [...document.querySelectorAll<HTMLElement>('section[id^="sektion_"]')];
  const sectionIndex = new Map(sections.map((section, i) => [section.id, i]));
  const watched: Watched[] = [];

  // Scroll depth: position / scrollable height, 0–100 (brief B §6).
  const updateScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
    maxScroll = Math.max(maxScroll, Math.min(100, Math.round(percent)));
  };

  function startDwell(item: Watched) {
    if (item.timer !== undefined || document.visibilityState !== 'visible') return;
    item.timer = window.setTimeout(() => {
      item.qualifiedAt = performance.now() - item.dwellMs;
      item.onQualified();
    }, item.dwellMs);
  }

  function stop(item: Watched) {
    window.clearTimeout(item.timer);
    item.timer = undefined;
    if (item.qualifiedAt !== undefined) {
      item.onEnd?.(Math.round(performance.now() - item.qualifiedAt));
      item.qualifiedAt = undefined;
    }
  }

  for (const section of sections) {
    watched.push({
      element: section,
      dwellMs: SECTION_DWELL_MS,
      qualifies: sectionQualifies,
      inView: false,
      onQualified() {
        const count = (viewCounts.get(section.id) ?? 0) + 1;
        viewCounts.set(section.id, count);
        if (!seen.includes(section.id)) seen.push(section.id);
        lastSeen = section.id;
        updateScroll();
        track('section_view', {
          section_id: section.id,
          section_position: (sectionIndex.get(section.id) ?? 0) + 1,
          view_order: ++viewOrder,
          view_count: count,
          time_since_arrival: Math.round(performance.now() - start),
          max_scroll_percent: maxScroll,
        });
      },
      onEnd(durationMs) {
        updateScroll();
        track('section_exposure_end', {
          section_id: section.id,
          exposure_ms: durationMs,
          max_scroll_percent: maxScroll,
        });
      },
    });
  }

  for (const button of document.querySelectorAll<HTMLElement>('[data-cta-id]')) {
    const ctaId = button.dataset.ctaId;
    if (!isCtaId(ctaId)) continue;
    watched.push({
      element: button,
      dwellMs: CTA_DWELL_MS,
      qualifies: ctaQualifies,
      inView: false,
      onQualified() {
        track('cta_view', { cta_id: ctaId, section_id: CTA_SECTION[ctaId] });
      },
    });
  }

  const byElement = new Map(watched.map((item) => [item.element, item]));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const item = byElement.get(entry.target as HTMLElement);
        if (!item) continue;
        item.inView = entry.isIntersecting && item.qualifies(entry);
        if (item.inView) startDwell(item);
        else stop(item);
      }
    },
    { threshold: THRESHOLDS },
  );
  for (const item of watched) observer.observe(item.element);

  // Exposure only counts in an active tab: pause every episode while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      activeSince = performance.now();
      for (const item of watched) if (item.inView) startDwell(item);
    } else {
      if (activeSince !== null) activeMs += performance.now() - activeSince;
      activeSince = null;
      for (const item of watched) stop(item);
    }
  });

  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });

  return {
    /** Context for a buy click, covering this view of the offer page. */
    clickContext(): ClickContext {
      updateScroll();
      const lowest = seen.reduce<string | null>(
        (max, id) => (max === null || (sectionIndex.get(id) ?? 0) > (sectionIndex.get(max) ?? 0) ? id : max),
        null,
      );
      return {
        sections_seen: [...seen],
        max_section_seen: lowest,
        last_section_seen: lastSeen,
        max_scroll_percent: maxScroll,
        time_to_click: Math.round(performance.now() - start),
        active_time_to_click: Math.round(activeTime()),
      };
    },
  };
}
