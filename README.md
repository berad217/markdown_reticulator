# markdown_reticulator

easy markdown viewer and converter for normies.  It reticulates all the splines!

[![Download](https://img.shields.io/badge/⬇%20download-markdown--reticulator.html-2962ff?style=for-the-badge)](https://github.com/berad217/markdown_reticulator/releases/latest/download/markdown-reticulator.html)

One click downloads the file. Save it anywhere and double-click to open in your browser. No install, no internet required.

## What it's for

You know those `.md` files people send around — meeting notes, AI chat exports, READMEs from a repo? They look like a mess in Notepad. Drop one into this app and you get a clean, formatted document, the same way it'd look on GitHub.

## What it does

- **Drag in a file** or **paste markdown text** — both work.
- **Light or dark theme** — your pick, the app remembers.
- **Save as HTML or PDF** — file you can email to someone.
- **Copy to clipboard** as formatted content — pastes nicely into Gmail, Word, or Slack.
- **Print** — with proper page breaks and ink-friendly colors.
- **Table of contents** auto-generates for longer documents.
- **Syntax highlighting** for code blocks.
- **View source** if you want to see the original markdown.

## How to use

1. Open `markdown-reticulator.html` in any modern browser (Chrome, Edge, Firefox, Safari).
2. Drop a `.md` file onto the page, or click "Or paste markdown text" to paste.
3. Use the buttons at the top to save, print, copy, or toggle source view.

## Is it safe?

Yes. The whole app is one self-contained HTML file — nothing gets sent anywhere, no internet needed after you have the file. Markdown you paste or drop in is sanitized before display, so even a malicious file can't run scripts in your browser.

## For developers

Source lives in [`src/`](src/), split into HTML / CSS / JS / vendored libraries. The single-file `dist/markdown-reticulator.html` is produced by a small Python build script that inlines every local stylesheet and script:

```bash
python build.py
```

See [`docs/spec.md`](docs/spec.md) for the architecture and the sprint history that got us here, and [`docs/DEVLOG.md`](docs/DEVLOG.md) for the running log.

To verify a build, [`tests/TEST-PLAN.md`](tests/TEST-PLAN.md) has a structured manual test procedure (designed to be runnable by a browser-control agent) plus markdown fixtures in [`tests/fixtures/`](tests/fixtures/).

## Built on

- [marked](https://marked.js.org/) — markdown parsing
- [DOMPurify](https://github.com/cure53/DOMPurify) — HTML sanitization
- [highlight.js](https://highlightjs.org/) — syntax highlighting

All three are vendored into `src/vendor/` and inlined into the bundled file. Total weight ~230 KB.
