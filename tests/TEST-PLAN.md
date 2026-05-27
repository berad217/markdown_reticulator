# Markdown Reticulator — Manual Browser Test Plan

**Audience:** an AI agent (or human) with browser-control capability.
**Goal:** verify the built artifact at `dist/markdown-reticulator.html` behaves correctly across all features shipped in Sprints 1–3.
**Estimated time:** 15–20 minutes.

---

## How to use this document

1. Open `dist/markdown-reticulator.html` directly in a Chromium-based browser (Chrome, Edge). Open from the local filesystem (`file://`) — do not host it on a server.
2. Open browser DevTools (F12) before starting. Keep the **Console** and **Network** tabs visible. You'll watch both for unexpected errors, alert dialogs, and CDN/external requests.
3. Work through the test sections below in order. Each test has a fixed Test ID (e.g. `T-1.1`), explicit Steps, and an Expected outcome.
4. Record results using `REPORT-TEMPLATE.md` in this folder.

## Test fixtures

All fixtures live in `tests/fixtures/`. Use the file picker (click the drop zone) rather than drag-and-drop where possible — file picker is more reliable to automate.

| Fixture                          | Used by tests                       |
|----------------------------------|-------------------------------------|
| `simple.md`                      | T-1.1, T-3.1, T-6.1                 |
| `security-test.md`               | T-1.2                               |
| `code-blocks.md`                 | T-2.1, T-2.2                        |
| `with-local-images.md`           | T-2.4                               |
| `with-many-headings.md`          | T-3.1, T-3.2                        |
| `with-few-headings.md`           | T-3.3                               |
| `with-mermaid.md`                | T-2.5, T-2.6                        |
| `kitchen-sink.md`                | T-5.1, T-6.2                        |

## Browser-automation notes

- **File input:** click the drop zone → a native file picker opens → choose a fixture. The drop zone is `#dropZone`. The hidden file input is `#fileInput`.
- **Drag-and-drop is hard to automate reliably.** Skip it unless your automation framework has solid DnD support.
- **Alert dialogs:** during T-1.2, the page must NOT raise any `alert()` dialogs. Configure your automation to auto-dismiss + record any dialog as a test FAIL. With Playwright: `page.on("dialog", lambda d: failures.append(d.message) or d.dismiss())`.
- **Network monitoring during T-0:** open the file with DevTools Network tab cleared. After page load, there should be zero entries from `http://` or `https://` origins. The page is a single self-contained file.

---

# T-0 — Smoke test (run first)

### T-0.1 — Page loads with no errors

**Steps:**
1. Open `dist/markdown-reticulator.html` in a fresh browser tab.
2. Wait for the page to fully render.

**Expected:**
- Header shows "📝" followed by some title from the ridiculous-references list (e.g. "The Markdown Whisperer", "Markdown: Impossible").
- A subtitle appears below the title.
- An empty-state pane shows a ✨ icon and a message like "Reticulating splines... (just kidding, drop a file)".
- A drop zone with "Drop your markdown file here..." appears.
- An "Or paste markdown text" button appears below the drop zone.
- A theme-toggle button (🌙 or ☀️) appears in the header.
- DevTools Console shows the three boot messages (🚀, 📚, 🎭) and **no errors or warnings**.
- DevTools Network tab shows **zero external requests** after page load.

---

# T-1 — Security & sanitization (HIGHEST PRIORITY)

### T-1.1 — Normal document renders

**Setup:** none.

**Steps:**
1. Click the drop zone. In the file picker, select `tests/fixtures/simple.md`.

**Expected:**
- Document renders below the drop zone.
- A green success banner appears at the top, mentioning "simple.md" plus a ridiculous reference (e.g. "Mission accomplished, Agent").
- All headings, lists, blockquote, link, and horizontal rule render correctly.
- DevTools Console shows no errors.
- Three new buttons appear: "🗑️ ...", "📝 View source", "🖨️ Print", "📋 ...", "💾 ...".

### T-1.2 — XSS payloads are sanitized

**Setup:** ensure DevTools is open and your automation framework will catch any alert dialogs.

**Steps:**
1. Click the drop zone. Select `tests/fixtures/security-test.md`.
2. Wait for render.
3. Scroll through the entire rendered output.
4. Check Network tab for any requests to `evil.example.com`.

**Expected (all must hold — any single failure = critical bug):**
- **No alert dialogs fire.** If any "XSS-FAIL-*" alert appears, this test FAILS.
- No network requests to `evil.example.com`.
- The `<script>`, `<iframe>`, `<object>`, `<embed>` tags do not render anywhere in the output.
- The "javascript:" link renders as plain text or as an inert link with no `href` attribute (inspect with DevTools).
- The image with `onerror` may render as a broken-image icon, but the `onerror` attribute must be gone (inspect with DevTools).
- The SVG renders or doesn't, but the `onload` must not fire.
- DevTools console may show CSP / image-load warnings — those are fine. What matters is that no payload-triggered alert fires and no `evil.example.com` request happens.

**How to inspect:** right-click the rendered area → Inspect. Search the rendered HTML for `onerror`, `onclick`, `onload`, `javascript:`. None should be present.

---

# T-2 — Syntax highlighting, code blocks, image warning

### T-2.1 — Code blocks render with syntax colors

**Steps:**
1. Click 🗑️ (clear).
2. Load `tests/fixtures/code-blocks.md`.

**Expected:**
- The JavaScript, Python, Bash, JSON, HTML, and CSS code blocks each display with **multiple colors** (keywords, strings, numbers, comments in different colors).
- The unlabeled SQL block also has colors — highlight.js auto-detected the language.
- Inline `code` spans appear in monospace red on a light background (light theme) or pink on dark gray (dark theme).
- No console errors.

### T-2.2 — Code block backgrounds match the theme

**Steps:**
1. With `code-blocks.md` loaded, click the theme toggle (🌙 or ☀️) and observe the change.
2. Toggle back to the original theme.

**Expected:**
- In light theme: code blocks have a near-white background (github light theme).
- In dark theme: code blocks have a near-black background (github-dark theme).
- The colors of keywords/strings/etc. adapt to the theme — they remain legible in both.
- The toggle does not require a page reload.

### T-2.3 — Theme preference persists

**Steps:**
1. Set the theme to whichever is NOT the current default.
2. Reload the page (F5).

**Expected:**
- The theme you picked is still active after reload.
- Open DevTools → Application → Local Storage → file://. There should be a key `markdown-reticulator.theme` with value `light` or `dark` matching your choice.

### T-2.5 — Mermaid diagrams render

**Steps:**
1. Click 🗑️ (clear).
2. Load `tests/fixtures/with-mermaid.md`.

**Expected:**
- The flowchart renders as an actual SVG diagram (not as raw text or a code block).
- The sequence diagram renders as an actual SVG diagram.
- The intentionally broken diagram displays a visible Mermaid error message in place of the diagram. The page does NOT crash.
- The rest of the document (including the "After the broken diagram" paragraph) renders normally.
- DevTools Console may show one Mermaid error from the broken diagram — expected. No other errors.

### T-2.6 — Mermaid diagrams re-theme on toggle

**Steps:**
1. With `with-mermaid.md` still loaded, note the current diagram colors.
2. Click the 🌙 / ☀️ theme toggle.

**Expected:**
- The diagrams re-render to match the new theme (light → dark gives diagrams a dark background; dark → light gives them a light background).
- The diagram content (boxes, arrows, labels) is the same — only colors change.
- Toggling back restores the original colors.

### T-2.4 — Relative-image warning appears

**Steps:**
1. Click 🗑️ (clear).
2. Load `tests/fixtures/with-local-images.md`.

**Expected:**
- A blue info banner appears near the top of the rendered output.
- The banner says "Heads up: this document references **3** local images..." (the count must be 3 — the absolute https URL must NOT be counted).
- The three local images appear as broken-image icons.
- The fourth (absolute) image may load or appear broken depending on internet, but is irrelevant to the test.

---

# T-3 — TOC, source toggle, print, paste input

### T-3.1 — TOC appears for documents with 3+ headings

**Steps:**
1. Click 🗑️ (clear).
2. Load `tests/fixtures/with-many-headings.md`.

**Expected:**
- An "On this page" collapsible panel appears above the rendered document.
- The panel contains entries for every H1/H2/H3 in the document.
- H3 entries are indented to the right of H2 entries.
- Click "On this page" — the list collapses. Click again — it expands.
- Two entries titled "Implementation" appear. Their links are different (`#implementation` and `#implementation-2`).
- Clicking each "Implementation" link scrolls to a different position in the document.

### T-3.2 — Heading anchor IDs are deduplicated

**Steps:**
1. With `with-many-headings.md` still loaded, inspect the two `<h2>` elements with text "Implementation" using DevTools.

**Expected:**
- The first `<h2 id="implementation">`.
- The second `<h2 id="implementation-2">` (or `-3` if there are other collisions — verify the IDs are unique).

### T-3.3 — TOC is suppressed for short documents

**Steps:**
1. Click 🗑️ (clear).
2. Load `tests/fixtures/with-few-headings.md`.

**Expected:**
- The document renders.
- NO "On this page" panel appears (because the doc has only 2 headings, below the threshold of 3).

### T-3.4 — View source toggle

**Steps:**
1. With any rendered document loaded, click "📝 View source".
2. Observe the output.
3. Click "👁️ View rendered".

**Expected:**
- "View source" shows the raw markdown text in a monospace block.
- The button label changes to "👁️ View rendered".
- Clicking again returns to the rendered HTML view.
- The button label changes back to "📝 View source".

### T-3.5 — Print preview

**Steps:**
1. With any rendered document loaded, click "🖨️ Print".

**Expected:**
- The browser's print preview opens.
- In print preview, only the rendered document is visible — no header, no drop zone, no paste section, no buttons, no TOC, no success banner.
- The text is black on white regardless of the current theme.
- Code blocks appear with a light background and black text in print.

**Cleanup:** cancel the print dialog. Do not actually print.

### T-3.6 — Paste-text input

**Steps:**
1. Click 🗑️ (clear).
2. Click "📋 Or paste markdown text" — a textarea panel appears.
3. Type or paste this into the textarea: `# Hello\n\nWorld!` (with real newlines).
4. Click "Render".

**Expected:**
- The textarea panel collapses.
- A document renders with an H1 "Hello" and a paragraph "World!".
- The success banner mentions "pasted-markdown.md".

### T-3.7 — Paste-text Ctrl/Cmd+Enter shortcut

**Steps:**
1. Click 🗑️.
2. Click "📋 Or paste markdown text".
3. Type `# Shortcut test`.
4. Press Ctrl+Enter (or Cmd+Enter on Mac) inside the textarea.

**Expected:**
- The document renders without needing to click the Render button.

### T-3.8 — Paste cancel

**Steps:**
1. Click 🗑️.
2. Click "📋 Or paste markdown text".
3. Type some text.
4. Click "Cancel".

**Expected:**
- The panel collapses.
- The textarea is now empty (verify by re-opening it).
- No document renders.

---

# T-4 — Error handling and clear

### T-4.1 — Invalid file extension is rejected

**Setup:** create a temporary file `tests/fixtures/empty.docx` (just rename any text file). You can also use any non-text file you have on hand.

**Steps:**
1. Click 🗑️.
2. Click the drop zone. Pick the `.docx` file.

**Expected:**
- A red error banner appears at the top (with a random "ridiculous" error message).
- No document renders.
- The error banner auto-disappears after about 5 seconds.

### T-4.2 — Clear resets the app

**Steps:**
1. Load any fixture.
2. Click 🗑️ (the clear button).

**Expected:**
- The document disappears.
- The buttons (View source, Print, Copy, Save, Clear) all hide.
- The drop zone returns to its full size (no longer compact).
- The empty-state pane reappears with a new random "✨" message.
- The clear button briefly shows "✅ Cleared!" before hiding.

---

# T-5 — Export (Copy / Save)

### T-5.1 — Copy HTML to clipboard

**Steps:**
1. Load `tests/fixtures/kitchen-sink.md`.
2. Click "📋 ..." (the copy button — its label is randomized but starts with 📋).
3. Open a new file or text editor and paste.

**Expected:**
- A success banner says "HTML copied to clipboard!".
- The copy button briefly shows "✅ Copied!".
- The pasted content is a complete, standalone HTML document (starts with `<!DOCTYPE html>`, contains the rendered markdown content, includes inline styles).
- Opening the pasted content as an HTML file in a browser renders it correctly.

### T-5.2 — Save as HTML file

**Steps:**
1. With `kitchen-sink.md` still loaded, click "💾 ..." (save button).
2. Confirm the download.
3. Open the downloaded file in a browser.

**Expected:**
- A file named `kitchen-sink.html` downloads.
- A success banner says "HTML file downloaded!".
- The downloaded file opens as a clean rendered document. The styling is the simpler "export" styling, not the full app chrome — that's correct.

---

# T-6 — Cross-feature sanity

### T-6.1 — Multiple loads in a row don't leak state

**Steps:**
1. Load `simple.md`.
2. Without clicking clear, load `kitchen-sink.md` (click drop zone again, pick another file).

**Expected:**
- The second document replaces the first.
- The TOC (if any) updates to reflect the new document.
- The success banner shows the new filename.
- No console errors.

### T-6.2 — Dark theme renders kitchen-sink fully

**Steps:**
1. Switch to dark theme if not already.
2. Load `tests/fixtures/kitchen-sink.md`.

**Expected:**
- All text, headings, table borders, blockquote text, list items, code, and TOC are legible against the dark background.
- The table renders with visible borders.
- Code block has a dark background with bright syntax colors.
- The blue info banner (if any) is readable on dark.
- Take a screenshot of the full rendered view in dark mode for the report.

---

# Done

If every test passes:
- The app is ready to share.
- File the report at `tests/REPORT-<date>.md` (or wherever the user asks for it).

If any test fails:
- Record exactly what happened in the report, including which fixture, which step, browser version, and a screenshot if applicable.
- T-1.2 failures are CRITICAL and block release.
- T-0 failures (smoke test) usually indicate the build is broken — re-run `python build.py` and retry.
