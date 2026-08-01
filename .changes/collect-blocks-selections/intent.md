# Collect blocks and selections

## Why
Whole notes are too broad for many writing tasks. Writers also need paragraphs, structural Markdown blocks, heading sections, list branches, and arbitrary excerpts while retaining a clear distinction between current source content and captured text.

## What
Add the contextual collection command and complete live/snapshot capture model, including precise Markdown block boundaries and an explicit opt-in for adding native-style block IDs.

## Scope
- Add `Add current block or selection` without a default global hotkey
- Make the command available only in Source mode and Live Preview
- Prefer a non-empty editor selection; otherwise capture the Block containing the cursor
- Treat paragraphs, fenced code blocks, tables, and callouts as complete Blocks
- Treat a heading as its section through the next heading of equal or higher level
- Treat a list item and all nested descendants as one Block, excluding sibling items
- Preserve arbitrary, partial-block, and multi-block selections character-for-character as snapshots
- Treat full notes, headings, and existing block IDs as live entries
- Keep unaddressed Blocks and selections as snapshots by default
- Add an `Automatically add block IDs` setting, disabled by default and affecting future captures only
- Require selection ranges to match complete Block ranges character-for-character before adding an ID
- Apply automatic IDs to cursor-selected complete Blocks
- Generate collision-checked native-style six-character lowercase alphanumeric IDs with browser cryptography
- Apply generated IDs through public editor/file interfaces without undocumented Obsidian commands or clipboard side effects
- Never expand a selection or retroactively convert snapshots
- Leave generated IDs permanently in source notes
- Allow duplicate snapshots but deduplicate live source addresses
- Show source context plus link-icon Live and camera-icon Snapshot indicators with tooltips and accessible labels

## Out of Scope
- Collecting blocks or selections from Reading view DOM text
- Heuristic or whitespace-tolerant exact-block detection
- Splitting multi-block selections into entries
- Adding IDs without prior opt-in
- Removing generated IDs later
- Live source refresh, rename/deletion handling, and precise source relocation
- Keyboard text-range selection inside Continuum

## Definition of Done
- [ ] Cursor-based capture chooses the agreed complete Markdown Block for every supported structure.
- [ ] Editor selections take precedence and snapshots preserve arbitrary selected Markdown exactly.
- [ ] Existing headings and block IDs create live entries without modifying their sources.
- [ ] With automatic IDs disabled, unaddressed Blocks remain snapshots.
- [ ] With automatic IDs enabled, cursor Blocks and character-for-character complete-Block selections receive safe native-style IDs and become live entries.
- [ ] Partial and multi-block selections never cause source edits or selection expansion.
- [ ] The contextual command is unavailable in Reading view while full-note collection remains available.
- [ ] Live source addresses deduplicate while snapshot captures may duplicate.
- [ ] Entry headers compactly and accessibly communicate source context and Live/Snapshot type.
