import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync } from 'node:fs';

// Posts used to live under /diary/ (originally with numeric prefixes, e.g. /diary/002-...).
// Keep those old URLs working by redirecting them to /blog/.
const postFiles = readdirSync('./src/content/experiments').filter((f) => /\.mdx?$/.test(f));
const legacyRedirects = { '/diary': '/blog' };
for (const file of postFiles) {
  const id = file.replace(/\.mdx?$/, '');
  const slug = id.replace(/^\d+-/, '');
  legacyRedirects[`/diary/${slug}`] = `/blog/${slug}`;
  legacyRedirects[`/diary/${id}`] = `/blog/${slug}`;
}
// Renamed posts
legacyRedirects['/diary/pick-and-place-act'] = '/blog/basic-pick-and-place-act';
legacyRedirects['/diary/002-pick-and-place-act'] = '/blog/basic-pick-and-place-act';

// This deploys as a user site (dorisjlee.github.io), so base stays '/'.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site: 'https://dorisjlee.github.io',
  base,
  redirects: legacyRedirects,
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
