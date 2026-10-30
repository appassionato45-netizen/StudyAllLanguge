# StudyAllLanguge

A static language-learning site: Korean for English speakers, Japanese for Korean speakers.
No server, no build step, no AI API. Hosted on GitHub Pages.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly from disk will not work, because browsers block `fetch` of local JSON files.)

## Layout

```
index.html          entry page
css/style.css
js/app.js           hash router and views
js/data.js          lazy content loading
js/store.js         progress in localStorage
js/srs.js           Leitner spaced repetition
js/tts.js           browser text-to-speech
js/i18n.js          UI strings (English / Korean)
data/courses.json   course → level → unit index
data/<course>/<level>/<unit>.json
docs/content-schema.md
```

Adding a lesson means adding one JSON file and one line to `data/courses.json`. See [docs/content-schema.md](docs/content-schema.md).

## Deploy

Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
