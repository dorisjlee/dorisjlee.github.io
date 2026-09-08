/**
 * YouTube Shorts, shown on the homepage. Not every post has one, and a short
 * can point at a post that doesn't exist yet (postSlug omitted) — it just
 * links straight to YouTube in that case.
 */
export type Short = {
  youtubeId: string;
  caption: string;
  /** Matches an experiment's filename (without .md), e.g. "001-lerobot-so-arm101" */
  postSlug?: string;
};

export const shorts: Short[] = [
  {
    youtubeId: 'kappIozO9ys',
    caption: 'Sorting blocks by color',
    postSlug: '004-sorting-blocks-by-color',
  },
  {
    youtubeId: 'QowCPleHGvk',
    caption: 'Single-block pick and place with ACT',
    postSlug: '001-lerobot-so-arm101',
  },
];
