# Doris Lee — Personal Site & Robotics Diary 🤖

Personal website for **Doris Lee** — professional homepage with a robotics learning diary documenting hands-on experiments in Physical AI and real robot systems.

Built with [Astro](https://astro.build), Markdown content collections, and GitHub Pages.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # preview production build
```

**Requires Node.js 18+** — install from [nodejs.org](https://nodejs.org) if needed.

## Project structure

```
src/
├── components/
│   ├── ExperimentCard.astro      # Diary listing card
│   ├── ExperimentTemplate.astro  # Full experiment page layout
│   ├── Header.astro              # Site navigation
│   └── Footer.astro
├── content/
│   └── experiments/              # Markdown experiment entries
├── content.config.ts             # Experiment schema (Zod)
├── layouts/
│   ├── BaseLayout.astro
│   └── PageLayout.astro
├── pages/
│   ├── index.astro               # Homepage
│   ├── about.astro
│   ├── projects.astro
│   ├── diary/                    # Robotics diary
│   ├── open-source.astro
│   ├── writing.astro
│   └── contact.astro
└── styles/
    └── global.css
templates/
└── experiment-template.md        # Copy this for new experiments
public/
└── images/experiments/           # Experiment media
```

## Adding a new experiment

1. Copy the template:
   ```bash
   cp templates/experiment-template.md src/content/experiments/006-my-experiment.md
   ```

2. Edit frontmatter — all structured sections render automatically via `ExperimentTemplate.astro`

3. Add optional markdown body below the frontmatter for freeform notes

4. Experiment URLs: `/diary/006-my-experiment`

## GitHub Pages deployment

This site deploys as a user/org site (`dorisjlee.github.io`), so `BASE_PATH` stays `/` in `.github/workflows/deploy.yml`.

Update `site` in `astro.config.mjs` if the domain ever changes.

## Customization

- **Contact links**: Edit `src/pages/contact.astro`
- **Site URL**: Update `site` in `astro.config.mjs`
- **Colors & fonts**: Edit CSS variables in `src/styles/global.css`

## License

Personal site — content © Doris Lee.
