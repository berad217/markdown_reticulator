# Markdown Reticulator — Test Report

**Date:** YYYY-MM-DD
**Tester:** (your name / agent name)
**Build tested:** `dist/markdown-reticulator.html`
**Build size:** ___ KB (from `python build.py` output)
**Browser:** (e.g. Chrome 132.0.6834.110 on Windows 11)
**Vendor library versions in this build:**
- marked: 15.0.12
- DOMPurify: 3.4.3
- highlight.js: 11.9.0

---

## Summary

| Section                              | Pass | Fail | Skip | Notes                |
|--------------------------------------|------|------|------|----------------------|
| T-0  Smoke                           |      |      |      |                      |
| T-1  Security                        |      |      |      |                      |
| T-2  Highlighting / theme / images   |      |      |      |                      |
| T-3  TOC / source / print / paste    |      |      |      |                      |
| T-4  Error handling / clear          |      |      |      |                      |
| T-5  Export                          |      |      |      |                      |
| T-6  Cross-feature sanity            |      |      |      |                      |
| **TOTAL**                            |      |      |      |                      |

**Overall verdict:** ☐ Ship it  ☐ Ship with notes  ☐ Block — fix needed

---

## Critical-bug check

| Item                                     | Result            |
|------------------------------------------|-------------------|
| T-1.2: Zero XSS alerts fired             | ☐ Pass  ☐ FAIL    |
| T-1.2: Zero requests to evil.example.com | ☐ Pass  ☐ FAIL    |
| T-0.1: Zero external requests on load    | ☐ Pass  ☐ FAIL    |

**Any FAIL in this section blocks release.**

---

## Per-test results

For each test, record: Pass / Fail / Skip, plus a one-line note. Expand on failures in the "Issues" section below.

### T-0 Smoke

- [ ] T-0.1 — Page loads with no errors
  - Result:
  - Notes:

### T-1 Security & sanitization

- [ ] T-1.1 — Normal document renders
  - Result:
  - Notes:

- [ ] T-1.2 — XSS payloads sanitized
  - Result:
  - Notes:
  - Inspected rendered HTML for `onerror`, `onclick`, `onload`, `javascript:` — none present? ☐ Yes  ☐ No

### T-2 Highlighting / theme / images

- [ ] T-2.1 — Code blocks render with syntax colors
  - Result:
  - Notes:

- [ ] T-2.2 — Code block backgrounds match the theme
  - Result:
  - Notes:

- [ ] T-2.3 — Theme preference persists
  - Result:
  - Notes:
  - localStorage key `markdown-reticulator.theme` present? ☐ Yes  ☐ No

- [ ] T-2.4 — Relative-image warning appears
  - Result:
  - Count shown in the banner (should be 3):
  - Notes:

### T-3 TOC / source / print / paste

- [ ] T-3.1 — TOC appears for documents with 3+ headings
  - Result:
  - Notes:

- [ ] T-3.2 — Heading anchor IDs are deduplicated
  - Result:
  - First "Implementation" id:
  - Second "Implementation" id:
  - Notes:

- [ ] T-3.3 — TOC is suppressed for short documents
  - Result:
  - Notes:

- [ ] T-3.4 — View source toggle
  - Result:
  - Notes:

- [ ] T-3.5 — Print preview hides chrome
  - Result:
  - Notes:

- [ ] T-3.6 — Paste-text input
  - Result:
  - Notes:

- [ ] T-3.7 — Paste Ctrl/Cmd+Enter shortcut
  - Result:
  - Notes:

- [ ] T-3.8 — Paste cancel
  - Result:
  - Notes:

### T-4 Error handling / clear

- [ ] T-4.1 — Invalid file extension rejected
  - Result:
  - Notes:

- [ ] T-4.2 — Clear resets the app
  - Result:
  - Notes:

### T-5 Export

- [ ] T-5.1 — Copy HTML to clipboard
  - Result:
  - Notes:

- [ ] T-5.2 — Save as HTML file
  - Result:
  - Notes:

### T-6 Cross-feature sanity

- [ ] T-6.1 — Multiple loads in a row don't leak state
  - Result:
  - Notes:

- [ ] T-6.2 — Dark theme renders kitchen-sink fully
  - Result:
  - Screenshot path:
  - Notes:

---

## Issues found

For each failure or surprise, give:

### Issue 1

- **Test:** T-X.X
- **Severity:** Critical / Major / Minor / Cosmetic
- **What happened:**
- **What was expected:**
- **Reproduction steps:**
- **Browser console messages:**
- **Screenshot (if applicable):**

### Issue 2

(repeat as needed)

---

## Console / network observations

Anything in DevTools that wasn't covered by a specific test? List unexpected warnings, errors, or network activity here.

---

## Suggestions

Non-blocking observations the agent or tester wants to flag for the project owner (UX rough edges, missing-but-nice features, etc.).
