import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// This deploys as a user site (dorisjlee.github.io), so base stays '/'.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site: 'https://dorisjlee.github.io',
  base,
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
