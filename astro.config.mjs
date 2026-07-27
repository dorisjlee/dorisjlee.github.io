import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// For GitHub Pages project sites, set BASE_PATH to your repo name:
//   BASE_PATH=/robododo-diary/ npm run build
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
