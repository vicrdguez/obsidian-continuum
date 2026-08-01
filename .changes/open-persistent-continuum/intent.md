# Open and collect notes in a persistent Continuum

## Why
Writers exploring a vault need one durable reading surface for relevant notes instead of accumulating and switching among tabs.

## What
Replace the sample plugin with the first complete Continuum path: open a movable desktop view, collect the active Markdown note as a live entry, render its current body read-only, return to its source, and restore the collection later.

## Scope
- Rename the plugin to Continuum with permanent ID `continuum`, infinity view icon, and desktop-only manifest metadata
- Remove all sample commands, settings, ribbon, status bar, modal, listeners, and interval
- Register one Continuum view per vault
- Open the view in the right sidebar initially and allow standard Obsidian docking
- Remember the last broad placement: left sidebar, right sidebar, or main area
- Respect an intentionally closed view across restarts
- Add `Focus Continuum` and `Add current note` commands without default global hotkeys
- Allow note collection from Source mode, Live Preview, and Reading view
- Append collected notes as live entries while preserving source-editor keyboard focus
- Render current Markdown without YAML frontmatter and without editable task checkboxes
- Keep entry content selectable with normal pointer/browser selection
- Prevent duplicate note entries by focusing the existing entry
- Persist entries and current focus in plugin data
- Open a note entry's source in Live Preview in the most recently active Markdown leaf while preserving Continuum
- Show a concise empty state naming the collection and focus commands
- Add a no-dependency test harness using Node's built-in test runner and the installed esbuild

## Out of Scope
- Blocks, headings, list items, or arbitrary selections
- Snapshot entries
- Source rename, deletion, or stale-content handling
- Pane-local navigation and folding
- Reordering, removal, undo, and clearing
- Insertion into a destination note
- Ribbon or status-bar controls
- Obsidian Mobile

## Definition of Done
- [x] The Continuum view opens in the correct workspace area, remains movable, and can be focused without a ribbon or default hotkey.
- [x] `Add current note` works from every Markdown view mode, appends a live entry, reveals Continuum, and leaves keyboard focus in the source.
- [x] A note entry renders the note's current body without YAML properties and cannot edit task state.
- [x] Adding a note already present keeps one entry and focuses that existing entry.
- [x] Entries and focus survive plugin reloads and Obsidian restarts.
- [x] Activating a note entry's source opens it in Live Preview without replacing Continuum.
- [x] The production build and lint pass, and model/content behavior runs through the repository test command.
