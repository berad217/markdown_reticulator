# Project Overview

This document has many headings at different levels. The TOC ("On this page") should appear at the top of the rendered output.

It also contains **two H2 headings with identical text** ("Implementation"), to test slug deduplication. The TOC links for those two should point to different anchors (`#implementation` and `#implementation-2`), and clicking each should scroll to the correct heading.

## Background

Some background paragraphs go here. The TOC entry for this section should link to `#background`.

## Goals

What we're trying to accomplish.

### Primary goal

The primary goal lives under a sub-heading. The TOC should show this as an indented H3 entry.

### Secondary goal

Another sub-heading.

## Implementation

The first "Implementation" heading. Its TOC link should be `#implementation`.

Some text under the first implementation heading.

## Implementation

The second "Implementation" heading (duplicate text on purpose). Its TOC link should be `#implementation-2`.

Some text under the second implementation heading.

## Conclusion

Wrap-up. There should be a TOC entry for this too.

## TOC verification checklist

- TOC appears (because we have ≥3 headings).
- "On this page" is collapsible — clicking it folds/unfolds the list.
- All H2 entries are at the same indent level.
- "Primary goal" and "Secondary goal" (H3s) are indented under "Goals".
- Two "Implementation" entries appear, both clickable, scrolling to different positions.
