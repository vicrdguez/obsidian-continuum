# Keep entries connected to their sources

## Why
A persistent Continuum must remain trustworthy while vault notes evolve. Writers need to know whether content is current, retain collected material when a source disappears, and return to the closest reliable source location without fuzzy guesses.

## What
Complete the source lifecycle for every Entry: live refresh, snapshot stability, rename tracking, missing-source preservation, exact source relocation, and consistent Live Preview navigation.

## Scope
- Refresh live entry content when its note, heading section, or identified block changes
- Keep snapshot Markdown unchanged when its source changes
- Update every entry source path after source-note rename or move
- Persist the last successfully resolved Markdown for live entries
- Preserve live and snapshot entries when a note, heading, or block disappears
- Show a clear `Source missing` state and disable source jumping while unavailable
- Keep Live/Snapshot identity unchanged when a source disappears
- Find snapshot text by exact character match nearest its original source offset
- Open the source note without selecting replacement text when snapshot text is absent
- Open full notes, headings, blocks, and found snapshots in Live Preview
- Select the precise source range when available
- Reuse the most recently active Markdown leaf, creating one only when none exists
- Preserve the Continuum pane during every source or internal-link navigation
- Open internal links in rendered entries in Live Preview through the same navigation path
- Show `Note › Heading` where available, reveal the full path on hover, and display it directly for ambiguous note names

## Out of Scope
- Fuzzy snapshot matching
- Heuristically following renamed headings or removed block IDs
- Converting missing live entries to snapshots
- Automatically removing unavailable entries
- Recreating deleted source notes or IDs
- Opening sources in Reading view or Source mode
- Updating hidden source comments already inserted into destination notes

## Definition of Done
- [ ] Live entries refresh from current source content while snapshots remain exactly captured.
- [ ] Every entry follows source-note renames and moves without changing identity or order.
- [ ] Missing notes, headings, and blocks preserve entry content and expose an explicit unavailable state.
- [ ] Snapshot source navigation selects the nearest exact match or safely opens the note without a replacement selection.
- [ ] Live source navigation selects the exact note, heading, or block location in Live Preview.
- [ ] Internal links use the same Live Preview destination leaf while preserving Continuum.
- [ ] Source labels remain compact while disambiguating duplicate note names and exposing full paths.
