# Markdown Reticulator — Right-Click Edition

You've got the Markdown Whisperer. This bolts it onto your right-click menu so a
`.md` file opens *rendered* with a couple of clicks — no opening the app and
dragging files in like it's the Stone Age.

**What's in the box:** `markdown-reticulator.html` (the app itself),
`Open-Markdown.ps1` (does the heavy lifting), `Install-SendTo.ps1` (the one-time setup).

## Install (once)

1. Park this whole folder somewhere it can live (Documents is fine). The launcher
   looks for the app sitting right next to it — **keep the gang together**, or the
   magic stops working.
2. Open PowerShell in this folder and run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Install-SendTo.ps1
   ```

   If these files arrived by email or download, Windows may quarantine them out of
   an abundance of paranoia. If the launcher refuses to cooperate, spring them once:

   ```powershell
   Get-ChildItem *.ps1 | Unblock-File
   ```

## Use it

Right-click any `.md` file → **Send To → Markdown Reticulator**. Boom goes the
dynamite — it opens rendered in your browser. Select several files first and the
whole fellowship comes along (they pile into the sidebar; combine them if you feel
like it).

## Make it stop

```powershell
powershell -ExecutionPolicy Bypass -File .\Install-SendTo.ps1 -Uninstall
```

## Fine print

- Move this folder later and the shortcut loses the scent — just re-run the install step.
- Not feeling the right-click life? You can always open `markdown-reticulator.html`
  and drag files onto it like a civilized person.
