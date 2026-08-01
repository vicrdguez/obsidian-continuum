# Read the Continuum

A writer can review every **Entry** as one vertically scrolling reading flow.

## Behaviors
- An empty Continuum names the two collection commands and the “Focus Continuum” command.
- Entry content is rendered as Obsidian Markdown.
- YAML properties are omitted from full-note entries.
- Each entry header shows the most specific stable source available: note, heading, or block ID; snapshots fall back to their nearest heading or note.
- The full vault path appears on hover and disambiguates duplicate note names.
- Entry headers always show a fold chevron, clickable source, and type icon.
- Insert, move, and remove actions are available from each entry’s overflow menu.
- Entry headers use a link icon for live entries and a camera icon for snapshots, each with a tooltip and accessible label.
- Entry content is not editable within the Continuum, and rendered task checkboxes are disabled.
- New entries begin expanded, and each entry’s fold state persists.
- `Space` toggles the focused entry’s fold state while preserving `Tab` for normal keyboard traversal.
- One command folds every entry when any is expanded and unfolds every entry when all are folded.
- The pane toolbar shows the entry count and fold-all toggle; clear and undo remain in an overflow menu.
- Jumping from a snapshot searches for its exact captured text nearest the original position.
- If that text no longer exists, the source note opens without selecting replacement text.
- Live entries refresh when their sources change, and every entry follows source-note renames.
- If any source disappears, the entry remains visible with a “Source missing” status and source jumping is unavailable; live entries show their last rendered content.
- The pane renders its entries while open and is optimized for ordinary collections of roughly 100 entries without imposing a hard limit.

## Out of scope
- Editing source content inside the Continuum.
- Switching entries to a raw Markdown view.
- Vim-style keyboard text-range selection inside rendered content.
