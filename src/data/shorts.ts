/**
 * YouTube Shorts, shown on the homepage. Not every post has one, and a short
 * can point at a post that doesn't exist yet (postSlug omitted) — it just
 * links straight to YouTube in that case.
 */
export type Short = {
  youtubeId: string;
  caption: string;
  /** Matches an experiment's URL slug (filename minus .md and the numeric prefix), e.g. "lerobot-so-arm101" */
  postSlug?: string;
};

export const shorts: Short[] = [
  {
    youtubeId: 'kappIozO9ys',
    caption: 'Sorting blocks by color',
    postSlug: 'sorting-blocks-by-color',
  },
  {
    youtubeId: 'QowCPleHGvk',
    caption: 'Single-block pick and place with ACT',
    postSlug: 'lerobot-so-arm101',
  },
];
