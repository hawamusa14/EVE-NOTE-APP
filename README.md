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

## Connecting a real AI later

All model calls go through `EveAI` in `ai.js`. Replace the `complete()` function with a network request and keep the same method names (`summarize`, `improve`, `grammar`, `brainstorm`, `expand`, `actions`, `chat`).

## Keyboard

| Shortcut | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Global search |
| `⌘N` / `Ctrl+N` | New note |
| `Esc` | Close editor, search, or menus |

## Reset demo data

Settings → Restore sample notes.
