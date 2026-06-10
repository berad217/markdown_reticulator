# Handover — markdown_reticulator

## Orientation
Oriented via [`onboarding.md`](../../onboarding.md). Maintenance phase, solo dev. Read the latest [`docs/DEVLOG.md`](../DEVLOG.md) entries for current state. This handover is intentionally short — the work landed in files + a release, so there's little ephemeral delta.

## The Delta (not in the files)
- **Clean slate, nothing in flight.** `main` is ahead of the last release: **v1.2.0 "The Fellowship of the Files"** shipped the multi-file sidebar. Since then `main` also carries the Windows "Send To" launcher (`integrations/windows/`) and its portable packager — committed, working, not yet in any release. Nothing broken or mid-edit.
- **`gh` CLI works in this environment** — the project docs assume it doesn't. Verify release state with `gh release list` before trusting a DEVLOG "still ahead" note; one was stale earlier this session (claimed v1.1.0 was uncut when it had already shipped Mermaid).
- **Known minor limitation, intentional:** file reads are async, so dropping a second batch of files before the first finishes could race the first-file auto-select. Fine for normal "drop a folder once" use.

## Next Steps
1. Nothing required — await a real-world usage signal (project ethos: no speculative polish).
2. If/when worth it: optional polish is in the DEVLOG "Still ahead" (drag-to-reorder, persist the loaded set, per-file Save .md). The Send To launcher is a local convenience and isn't in a GitHub release — only bundle it into one if there's a reason to.
