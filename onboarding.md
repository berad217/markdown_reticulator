# Onboarding — markdown_reticulator

A single self-contained HTML file that turns `.md` files into a clean rendered document. Built so non-technical humans can read markdown without installing anything. Open `dist/markdown-reticulator.html` in any modern browser — that's the whole app.

**Project type:** personal / hobby, now public on GitHub
**Human's level:** experienced (medical → EE → software)
**Current phase:** v1.0.0 shipped, maintenance + small features

---

## Getting oriented

**Project docs (all canonical names, no fuzziness needed here):**

- **Spec:** [`docs/spec.md`](docs/spec.md) — sprint plan, architecture decisions, out-of-scope items.
- **DEVLOG:** [`docs/DEVLOG.md`](docs/DEVLOG.md) — what was built and why. Append a dated entry per meaningful session.
- **Human-facing README:** [`README.md`](README.md) — what visitors to the GitHub repo see. Contains the 1-click download button.
- **Test plan:** [`tests/TEST-PLAN.md`](tests/TEST-PLAN.md) — structured manual test procedure runnable by a browser-control agent. Fixtures in [`tests/fixtures/`](tests/fixtures/). No automated tests by design.
- **Handover:** none yet. Solo dev, short sessions, hasn't needed one. If you start one, put it at `docs/.agents/current-handover.md` (create the folder).

**Personal style for this human:** lives in his global Claude memory at `~/.claude/CLAUDE.md` (Windows path: `C:\Users\Brad\.claude\CLAUDE.md`). If you can read user-global files, do — TL;DR below in "About this human".

---

## Repo layout

```
src/                source files
├── index.html      structure + asset links
├── styles/         app.css (layout + print), rendered.css (markdown), themes.css (light/dark)
├── js/             references.js (ridiculous reference table), app.js (everything else)
└── vendor/         marked.min.js, dompurify.min.js, highlight.min.js, highlight themes

dist/               committed build artifact — markdown-reticulator.html
build.py            inlines every local <link>/<script src> into dist/markdown-reticulator.html
scripts/            generate-highlight-themes.py — regenerates the scoped highlight CSS

docs/               spec.md, DEVLOG.md
tests/              TEST-PLAN.md, REPORT-TEMPLATE.md, REPORT-<date>.md, fixtures/*.md
```

**Build:**

```bash
python build.py
```

Output: `dist/markdown-reticulator.html`. The build inlines local relative-path stylesheets and scripts; external URLs would pass through, but everything is currently vendored.

---

## How we work

Sprint-based, lightweight. Brad uses the global lifecycle workflow from his `~/.claude/CLAUDE.md` (sprints, DEVLOG entries, the confidence bar). Project-specific notes:

- **One sprint at a time.** Complete current work before starting the next.
- **No automated tests.** This is a small UI tool — manual checklist in `tests/TEST-PLAN.md` is the contract. Honest signal over green-checkmark theatre.
- **DEVLOG entries are conversational**, not strict templates. Capture decisions and reasoning.
- **Commits batch related changes** with a focused message + Claude co-author trailer when an agent helped.

**Confidence bar:**
- **HIGH** — routine, follows spec → just do it.
- **MODERATE** — clear best path, slight ambiguity → do it, note in DEVLOG.
- **LOW** — multiple paths with real tradeoffs → STOP, propose options.

**Hard constraints (do not break):**

1. **The deliverable stays a single HTML file.** That's the entire point of the project. The build script exists to preserve this while letting source live in proper files.
2. **No CDN dependencies in the built file.** Vendor anything new. The whole app must work offline.
3. **Anything that renders user-supplied content runs through DOMPurify.** XSS sanitization is non-negotiable. The `markdownToSafeHTML()` helper is the only sanctioned path.
4. **Mermaid is out of scope.** ~1 MB for a feature rare in normie markdown.
5. **Automated tests stay out** unless something gets gnarly enough to genuinely demand them.

---

## About this human

Brad. Medical school → electrical engineering → software. Thinks in systems and first principles. Wants direct feedback over hedging — if you're hedging he'll notice and trust you less. Skip pleasantries. Casual language is fine when precision doesn't matter. Likes when an agent **runs point and proposes the next move** ("Teflon mode") rather than asking "what now?". Approvals still required, but momentum matters.

Full notes at `~/.claude/CLAUDE.md` if you have access to user-global files.

---

## Writing handovers

Not needed for typical work on this project (short sessions, solo dev). Write one only if a session genuinely spans context resets or hands off mid-task. Location: `docs/.agents/current-handover.md` (create the folder).

**Include:**
- Quick start: what to read first
- This session's accomplishments
- **Conversation context** — the ephemeral discussion not captured elsewhere
- Decisions in flight, what was tried
- Next concrete steps

Don't duplicate DEVLOG/spec — handover is conversation residue.

---

## Project-specific notes

**Releases (GitHub):**

- The README download badge points at `https://github.com/berad217/markdown_reticulator/releases/latest/download/markdown-reticulator.html`.
- When `dist/` changes meaningfully, cut a new release with `dist/markdown-reticulator.html` as an asset. The `/latest/` redirect keeps the README link evergreen.
- Tags use semver-ish (`v1.0.0`, `v1.1.0`, …). Web UI: Releases → Draft a new release → tag → title → notes → attach file → publish.
- `gh` CLI is not available in every environment. If it's not, the release has to go through the web UI.

**Highlight.js themes:**

- The single `src/vendor/highlight-themes.css` is generated from the two source theme files, with selectors scoped to `[data-theme="light"]` and `[data-theme="dark"]`. Both themes coexist; the active one is determined by an attribute on `<html>`.
- After updating highlight.js or swapping themes, regenerate with: `python scripts/generate-highlight-themes.py`.

**Math (deferred):**

- KaTeX was deferred at the end of Sprint 3 because of font-bundling cost. See `docs/spec.md` for the three documented paths forward (base64-inline fonts, accept a CDN dep for fonts, or pick a lighter renderer). Don't try to revive math without picking one of those first.

**Common gotchas:**

- The Launch preview panel in Claude Desktop renders `src/index.html` without following relative `<link>`/`<script src>` references — so the preview shows unstyled HTML and looks broken. **Always test by opening `dist/markdown-reticulator.html` directly in a real browser.**
- Auto-randomized button labels (Save Ferris, Beam me up Scotty, etc.) come from `src/js/references.js`. The Save .md and Print / PDF buttons intentionally have stable labels because their format matters.
- Filename derivation for paste-input → tries first H1, falls back to `pasted-YYYY-MM-DD-HHMM.md`. Document title is also synced for nicer PDF filenames from the print dialog.

**Common commands:**

```bash
python build.py                              # rebuild dist/markdown-reticulator.html
python scripts/generate-highlight-themes.py  # regenerate scoped highlight CSS
git status                                   # before any commit/push round
```
