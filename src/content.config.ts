import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const experiments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experiments' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    // Social share preview (og:image): path under public/, ideally 1200x630
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

export const collections = { experiments };
