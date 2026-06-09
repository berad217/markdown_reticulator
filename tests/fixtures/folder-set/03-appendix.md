# Appendix

The third file. Includes a Mermaid diagram to confirm diagrams render inside a
combined document.

## Diagram

```mermaid
flowchart LR
    A[Drop folder] --> B[Sidebar list]
    B --> C{Combine?}
    C -->|Yes| D[One document]
    C -->|No| E[View individually]
```

## Notes

Duplicate "Notes" heading (also in usage) — combined TOC should give these
distinct anchors.
