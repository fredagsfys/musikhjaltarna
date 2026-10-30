// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://musikhjaltarna.se',
  trailingSlash: 'never',
  build: {
    // `/kop.html` is served as `/kop`, matching canonical URLs and the sitemap.
    format: 'file',
    // The stylesheet is small; inlining it removes a render-blocking request.
    inlineStylesheets: 'always',
  },
  prefetch: true,
  integrations: [
    sitemap({
      // The purchase flow is noindex and should never appear in the sitemap.
      filter: (page) => !new URL(page).pathname.startsWith('/kop'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
