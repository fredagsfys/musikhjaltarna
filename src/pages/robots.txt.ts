import type { APIRoute } from 'astro';

// The purchase flow is excluded with `noindex` rather than `Disallow`,
// so crawlers can still see the directive.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
