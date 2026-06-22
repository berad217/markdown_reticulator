# Handover — markdown_reticulator

## Orientation
Oriented via [`onboarding.md`](../../onboarding.md). Maintenance phase, solo dev. Read the latest [`docs/DEVLOG.md`](../DEVLOG.md) entries for current state. Short by design — work lands in files + releases, so there's little ephemeral delta.

## The Delta (not in the files)
- **Truly clean — nothing ahead, nothing in flight.** As of 2026-06-22, `main` (`e400800`) *is* the latest release: **v1.2.1 "The Two Towers of Text"** (the drag-and-drop large-file fix). Unlike the last several sessions, `main` is **not** sitting ahead of a tag — the previously-unreleased Send To launcher work got swept into v1.2.1. Nothing broken, nothing mid-edit. That "nothing's pending" state is the point of this note: don't go hunting for an in-flight delta that isn't there.
- **`gh` CLI works in this environment** — the project docs assume it doesn't. Verified again this session (pushed and cut the release with it). Trust `gh release list` over any DEVLOG "still ahead" line; those go stale.
- **Two known, intentional limitations (not bugs to chase):**
  - Files nested *inside a dropped folder* still read via the async `entry.file()` path, so a folder containing one enormous file could still choke. Dropping the big file directly, or click-to-browse, sidesteps it. Left alone deliberately — see the 2026-06-22 DEVLOG entry.
  - Dropping a second batch of files before the first finishes could race the first-file auto-select. Fine for normal "drop once" use.

## Next Steps
1. Nothing required — await a real-world usage signal (project ethos: no speculative polish).
2. Optional polish lives in the DEVLOG "Still ahead" notes (drag-to-reorder, persist the loaded set, per-file Save .md). Pull one in only if a real need shows up.
