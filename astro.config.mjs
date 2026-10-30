// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://pianotopia.se',
  trailingSlash: 'never',
  build: {
    // `/kop.html` is served as `/kop`, matching canonical URLs and the sitemap.
    format: 'file',
    // The stylesheet is small; inlining it removes a render-blocking request.
    inlineStylesheets: 'always',
  },
  prefetch: true,
  env: {
    schema: {
      PUBLIC_LEAD_ENDPOINT: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
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
