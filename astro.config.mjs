// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://pianotopia.se',
  trailingSlash: 'never',
  build: {
    // `/kop.html` is served as `/kop`, matching canonical URLs and the sitemap.
    format: 'file',
  },
  env: {
    schema: {
      PUBLIC_LEAD_ENDPOINT: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
