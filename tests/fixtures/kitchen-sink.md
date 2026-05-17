# Kitchen Sink — Realistic Document

A representative "normal" markdown document — what a non-technical user might actually drop into the viewer. Exercises tables, code, lists, links, blockquotes, and a TOC.

## Project status

We shipped three sprints' worth of work last week. The full feature list is in the table below.

| Feature             | Status      | Notes                                  |
|---------------------|-------------|----------------------------------------|
| File drop input     | ✅ Done     | Supports `.md`, `.markdown`, `.txt`    |
| Paste-text input    | ✅ Done     | Ctrl/Cmd+Enter renders                 |
| Syntax highlighting | ✅ Done     | highlight.js 11.9.0 common bundle      |
| Light/dark theme    | ✅ Done     | Respects `prefers-color-scheme`        |
| Math (KaTeX)        | ⏸️ Deferred | Font bundling unresolved               |

## How to install

1. Download the file from the release page.
2. Save it anywhere on your computer.
3. Double-click to open in your browser.

That's it — no install required.

## Configuration

The default settings work for most users, but if you want to tweak behavior, edit the `marked.setOptions` call:

```javascript
marked.setOptions({
    breaks: true,   // Convert single newlines to <br>
    gfm: true       // Enable GitHub Flavored Markdown
});
```

## Known issues

> **Note:** local image references (`![](./pic.png)`) won't load when opening the file directly from disk. This is a browser security restriction, not a bug in the viewer.

If you need to share a document with images, either:

- Use absolute URLs: `![](https://example.com/pic.png)`, or
- Host the markdown file and images together on a web server.

## Credits

Built on the shoulders of these excellent libraries:

- [marked](https://marked.js.org/) — markdown parsing
- [DOMPurify](https://github.com/cure53/DOMPurify) — HTML sanitization
- [highlight.js](https://highlightjs.org/) — syntax highlighting

## Contact

Questions, feedback, bug reports: file an issue on the project repo.
