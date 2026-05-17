"""Bundle src/ into a single shareable HTML file in dist/.

Inlines any local <link rel="stylesheet" href="..."> and <script src="..."> tags
whose href/src is a relative path. External URLs (http://, https://, //) are
left alone so the build step works even without network access.

Usage: python build.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
OUT = DIST / "markdown-reticulator.html"

LINK_RE = re.compile(
    r'<link\s+[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*/?>',
    re.IGNORECASE,
)
SCRIPT_RE = re.compile(
    r'<script\s+[^>]*src=["\']([^"\']+)["\'][^>]*>\s*</script>',
    re.IGNORECASE,
)


def is_external(url: str) -> bool:
    return url.startswith(("http://", "https://", "//"))


def read_asset(rel_path: str) -> str:
    """Read an asset file relative to src/. Raises if missing."""
    path = SRC / rel_path
    if not path.is_file():
        raise FileNotFoundError(f"Referenced asset not found: {path}")
    return path.read_text(encoding="utf-8")


def inline_styles(html: str) -> str:
    def repl(match: re.Match) -> str:
        href = match.group(1)
        if is_external(href):
            return match.group(0)
        content = read_asset(href)
        return f"<style>\n{content}\n</style>"

    return LINK_RE.sub(repl, html)


def inline_scripts(html: str) -> str:
    def repl(match: re.Match) -> str:
        src = match.group(1)
        if is_external(src):
            return match.group(0)
        content = read_asset(src)
        return f"<script>\n{content}\n</script>"

    return SCRIPT_RE.sub(repl, html)


def build() -> Path:
    DIST.mkdir(exist_ok=True)
    index = SRC / "index.html"
    if not index.is_file():
        raise FileNotFoundError(f"Missing entry point: {index}")

    html = index.read_text(encoding="utf-8")
    bundled = inline_scripts(inline_styles(html))

    OUT.write_text(bundled, encoding="utf-8")
    return OUT


def main() -> int:
    try:
        out = build()
    except FileNotFoundError as exc:
        print(f"Build failed: {exc}", file=sys.stderr)
        return 1

    size_kb = out.stat().st_size / 1024
    print(f"Built {out.relative_to(ROOT)} ({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
