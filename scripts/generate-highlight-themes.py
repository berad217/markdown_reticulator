"""Combine highlight.js light + dark themes into one scoped CSS file.

Reads src/vendor/highlight-github.css and highlight-github-dark.css, prefixes
every selector with [data-theme="light"] or [data-theme="dark"] respectively,
and writes the combined file to src/vendor/highlight-themes.css.

Run after updating either of the two source theme files:
    python scripts/generate-highlight-themes.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / "src" / "vendor"


def strip_css_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)


def scope_rules(css_text: str, scope_selector: str) -> str:
    """Prefix every top-level selector in the CSS with scope_selector.

    @-rules (e.g. @keyframes) are emitted as-is. Nested rules inside @-rules
    are NOT prefixed, which is what we want for the highlight.js themes
    (no nested rules in practice).
    """
    css_text = strip_css_comments(css_text)
    out: list[str] = []
    i = 0
    n = len(css_text)
    while i < n:
        brace = css_text.find("{", i)
        if brace == -1:
            tail = css_text[i:].strip()
            if tail:
                out.append(tail)
            break
        depth = 1
        j = brace + 1
        while j < n and depth > 0:
            if css_text[j] == "{":
                depth += 1
            elif css_text[j] == "}":
                depth -= 1
            j += 1
        selector_text = css_text[i:brace].strip()
        block_text = css_text[brace:j]
        if selector_text.startswith("@"):
            out.append(selector_text + block_text)
        else:
            selectors = [s.strip() for s in selector_text.split(",") if s.strip()]
            scoped = ", ".join(f"{scope_selector} {s}" for s in selectors)
            out.append(scoped + block_text)
        i = j
    return "\n".join(out)


def main() -> int:
    light_path = VENDOR / "highlight-github.css"
    dark_path = VENDOR / "highlight-github-dark.css"
    out_path = VENDOR / "highlight-themes.css"

    for p in (light_path, dark_path):
        if not p.is_file():
            print(f"Missing source: {p}", file=sys.stderr)
            return 1

    light = light_path.read_text(encoding="utf-8")
    dark = dark_path.read_text(encoding="utf-8")

    combined = (
        "/* Auto-generated from highlight-github.css and highlight-github-dark.css */\n"
        "/* Regenerate with: python scripts/generate-highlight-themes.py */\n\n"
        "/* === Light theme === */\n"
        + scope_rules(light, '[data-theme="light"]')
        + "\n\n/* === Dark theme === */\n"
        + scope_rules(dark, '[data-theme="dark"]')
        + "\n"
    )

    out_path.write_text(combined, encoding="utf-8")
    print(f"Wrote {out_path.relative_to(ROOT)} ({len(combined):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
