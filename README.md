Hi this is just an ametuer's first journey

this essentially documents my website and all projects HTML/CSS/JS it links to

## Layout

```
index.html              Home page
ConnectCard.html        Redirect to card/ (old NFC tag URL) — keep until all tags are rewritten
Lexicon.html,
FishGame.html           Redirects from the old game URLs — safe to delete eventually

resume/                 Resume viewer (renders assets/docs/Sean-Lirazan-Resume.pdf) + download
                        The PDF syncs daily from the resume Google Doc
                        (.github/workflows/sync-resume.yml); update the page's
                        "Text version" and llms.txt by hand when it changes

card/                   Contact card — the NFC tag points to sean2x.github.io/card
  sean-lirazan.vcf      "Save contact" file

projects/
  index.html            All projects (cards are generated from assets/js/projects.js)
  <slug>.html           One write-up per project
  pid.html              Controls Tooling page: vertical tabs for each tool (assets/js/tabs.js)
  pid/                  PID tool sources: root-locus-explorer (Vite/TS; dist/explorer.html is the
                        committed offline build), pid-demo, zero-g

posts/
  index.html            All posts (rendered from assets/js/posts.js — add new posts at the TOP
                        of that list; the home page shows the latest 3)
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
  img/posts/            Post photos
  img/projects/         Project thumbnails (<slug>.png)
  video/projects/       Hover/preview clips (<slug>.mp4)
  docs/                 Resume

robots.txt, sitemap.xml  Search engine crawling rules + page list (update lastmod when pages change)
llms.txt                Plain-text summary of Sean and key pages for AI assistants
tools/prerender.js      Writes project cards into the HTML for crawlers; runs on every deploy

archive/                Old experiments and unused files (still publicly reachable)
```

## Adding a project

1. Add an entry to `assets/js/projects.js` (the home page shows the first 3).
2. Add `assets/img/projects/<slug>.png` and, optionally, `assets/video/projects/<slug>.mp4`.
3. Copy `projects/_template.html` to `projects/<slug>.html` and write it up.
