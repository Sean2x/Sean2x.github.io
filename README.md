Hi this is just an ametuer's first journey

this essentially documents my website and all projects HTML/CSS/JS it links to

## Layout

```
index.html              Home page
ConnectCard.html        Contact card (kept at the root so shared links keep working)
Lexicon.html,
FishGame.html           Redirects from the old game URLs — safe to delete eventually

projects/
  index.html            All projects (cards are generated from assets/js/projects.js)
  <slug>.html           One write-up per project
  _template.html        Copy this to start a new write-up

games/
  lexicon/              Lexicon game (page, script, word list)
  fish-swarm/           Fish Swarm game (page, script, sprites, background video)

assets/
  css/style.css         Shared theme for every page
  js/projects.js        The project list — edit this to add/reorder projects
  js/site.js            Menu, project cards, hover previews, scroll reveal
  js/matrix.js          Matrix rain background
  img/                  Headshot, favicon, link-preview image
  img/internships/      Company logos for the carousel
  img/projects/         Project thumbnails (<slug>.png)
  video/projects/       Hover/preview clips (<slug>.mp4)
  docs/                 Resume

archive/                Old experiments and unused files (still publicly reachable)
```

## Adding a project

1. Add an entry to `assets/js/projects.js` (the home page shows the first 3).
2. Add `assets/img/projects/<slug>.png` and, optionally, `assets/video/projects/<slug>.mp4`.
3. Copy `projects/_template.html` to `projects/<slug>.html` and write it up.
