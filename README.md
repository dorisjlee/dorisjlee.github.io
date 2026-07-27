# Robododo Diary 🤖

Personal website and robotics learning diary for **Doris Lee** — documenting hands-on experiments in Physical AI and real robot systems.

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
│   ├── diary/                    # Robododo Diary
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

1. Push to GitHub
2. Enable **Pages** → Source: **GitHub Actions**
3. For project sites (`username.github.io/robododo-diary/`), the workflow sets `BASE_PATH=/robododo-diary/`
4. For user/org sites (`username.github.io`), change `BASE_PATH` to `/` in `.github/workflows/deploy.yml`

Update `site` in `astro.config.mjs` with your actual domain.

## Customization

- **Contact links**: Edit `src/pages/contact.astro`
- **GitHub username**: Search/replace `dorislee` across the project
- **Site URL**: Update `site` in `astro.config.mjs`
- **Colors & fonts**: Edit CSS variables in `src/styles/global.css`

## License

Personal site — content © Doris Lee.
