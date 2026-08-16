# EVE Note

A second brain that understands how your ideas connect.

EVE Note is a front-end prototype for an AI note-taking app: elegant pink-and-black interface, distraction-free writing, a constellation-style idea graph, calendar integration, and a personal AI assistant named EVE.

## Open the app

This is a static site. No build step is required.

1. Open `index.html` in a modern browser, or
2. Serve the folder locally, for example:

```bash
python3 -m http.server 5173
```

Then visit [http://localhost:5173](http://localhost:5173).

### With live AI (local)

To run the site **and** the OpenAI proxy together (no Node required):

```bash
cp .env.example .env    # paste your key: OPENAI_API_KEY=sk-...
python3 server.py       # serves the site and /api/eve on :5173
```

Chrome, Safari, Firefox, and Edge are supported. Data is stored in the browser with `localStorage`.

## What’s included

- **Home** — greeting, quick actions, recent notes, today’s schedule
- **Notes** — searchable library with tags, favorites, and grid/list layouts
- **Editor** — title, tags, scheduled date, rich text, checklists, autosave
- **AI tools** — summarize, improve, fix grammar, brainstorm, expand, action items, Ask EVE
- **Ask EVE** — conversational assistant with suggested prompts
- **Idea Graph** — interactive constellation of notes (drag, pan, zoom, search)
- **Calendar** — month view, events, and notes linked to dates
- **Favorites & Recently Deleted**
- **Settings & Profile**

Sample notes for **Hawa** (Rahma Collective, book club, mentorship, journal, and more) load on first visit.

## Project structure

```text
EVE-Note/
├── index.html      # App shell and views
├── style.css       # Pink + black design system
├── script.js       # Navigation, notes, calendar, graph, search
├── ai.js           # Isolated mock AI service (swap in a real API later)
├── assets/icons/   # Logo mark
└── README.md
```

## Connecting a real AI

All model calls go through `EveAI` in `ai.js`. The app first tries the serverless proxy and falls back to the built-in mock when the proxy or key is missing — so the prototype always works.

The proxy keeps your key server-side. Three layouts are included:

| Host | Function path | Endpoint |
| --- | --- | --- |
| Local (Python) | `server.py` | `/api/eve` |
| Vercel | `api/eve.js` | `/api/eve` |
| Netlify | `netlify/functions/eve.js` | `/.netlify/functions/eve` |

### Setup

1. Copy `.env.example` to `.env` and add your key (or set it in the host dashboard):

```bash
OPENAI_API_KEY=sk-...
# optional
OPENAI_MODEL=gpt-4o-mini
```

2. Run locally — either the Python server (no installs) or a functions runner:

```bash
python3 server.py     # serves site + /api/eve
# or, with Node installed:
npx vercel dev        # or: npx netlify dev
```

3. Deploy and set `OPENAI_API_KEY` in the project’s environment variables.

`.env` files are git-ignored, so keys never reach the repo or the browser.

## Keyboard

| Shortcut | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Global search |
| `⌘N` / `Ctrl+N` | New note |
| `Esc` | Close editor, search, or menus |

## Reset demo data

Settings → Restore sample notes.
