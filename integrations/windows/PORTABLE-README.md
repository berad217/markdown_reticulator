# Markdown Reticulator — open `.md` files from Explorer (Windows)

This folder lets you right-click a markdown file and open it rendered, without
opening the app and dragging the file in.

**Contents:** `markdown-reticulator.html` (the app), `Open-Markdown.ps1` (the
launcher), `Install-SendTo.ps1` (one-time setup).

## Install (once)

1. Put this whole folder wherever you want to keep it (e.g. `Documents`). The
   launcher finds the app sitting next to it, so **keep these files together.**
2. Open PowerShell in this folder and run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Install-SendTo.ps1
   ```

   (If these files came as a download/email, Windows may mark them blocked. If
   the launcher won't run, clear it once: `Get-ChildItem *.ps1 | Unblock-File`.)

## Use it

Right-click any `.md` file → **Send To → Markdown Reticulator**. It opens
rendered in your default browser. Select several `.md` files first to open them
together as a set.

## Remove it

```powershell
powershell -ExecutionPolicy Bypass -File .\Install-SendTo.ps1 -Uninstall
```

## Notes

- If you move this folder, re-run the install step (the shortcut points at the
  launcher's location).
- No drag-drop needed, but it still works: you can always open
  `markdown-reticulator.html` directly and drop files onto it.
