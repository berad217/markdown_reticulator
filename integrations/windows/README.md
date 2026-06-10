# Open `.md` files in Markdown Reticulator (Windows)

Open a markdown file from Explorer and see it rendered — without opening the app
and dragging the file in.

## Why a launcher is needed

A local HTML page is sandboxed. When Windows opens a file "with" a browser, it
**can't inject that file's contents into the page** — the page only ever sees
files you drag in or pick. So you can't point `.md → the HTML app` and have it
work directly.

`Open-Markdown.ps1` bridges that gap: it reads the file(s), embeds them into a
copy of the bundled app, writes a self-contained temp HTML, and opens that in
your default browser, already rendered. It only uses the **built** app
(`dist/markdown-reticulator.html`) and never modifies it — the shared
single-file artifact is untouched. Embedded content still goes through the same
DOMPurify sanitization as a dropped file.

## Install (Send To)

```powershell
# from this folder
.\Install-SendTo.ps1
```

Then: **right-click any `.md` file → Send To → Markdown Reticulator.** Select
several files first to open them as a set (they land in the sidebar; combine if
you like).

If PowerShell blocks the script, run it once as:
`powershell -ExecutionPolicy Bypass -File .\Install-SendTo.ps1`

## Remove

```powershell
.\Install-SendTo.ps1 -Uninstall
```

(or just delete `Markdown Reticulator.lnk` from `shell:sendto`.)

## Install on another machine

The launcher finds the app either next to itself or in the repo's `dist/`, so to
move it to another PC you just need the app + the two scripts in one folder.
`Build-Package.ps1` assembles that for you:

```powershell
# from this folder, on the source machine
.\Build-Package.ps1 -Zip      # -> dist-package/MarkdownReticulator(.zip)
```

Copy the folder (or zip) to the other machine, then there:

```powershell
powershell -ExecutionPolicy Bypass -File .\Install-SendTo.ps1
```

The packaged `README.md` (from `PORTABLE-README.md`) has the same steps for the
recipient. `dist-package/` is gitignored — it's a rebuildable artifact.

## Notes

- **Rebuild after app changes.** The launcher reads `dist/markdown-reticulator.html`,
  so run `python build.py` after editing the app source.
- **Want true double-click default?** Windows 10/11 guard the default-app choice
  with an anti-hijack hash, so it can't be set fully programmatically. The Send To
  route sidesteps that. If you want double-click anyway, register a handler and
  pick it once via *Open with → Choose another app → Always*.
- Temp pages are written to `%TEMP%\markdown-reticulator\` and auto-pruned after
  a day.
