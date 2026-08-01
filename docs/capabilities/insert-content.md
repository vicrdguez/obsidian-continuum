# Insert content

A writer can insert the focused **Entry** directly into the **Destination note** while working from the Continuum.

## Behaviors
- The Destination note is the most recently active Markdown editor.
- If that editor is unavailable, insertion does nothing and asks the writer to focus a destination note first.
- Insertion replaces the destination editor’s selected text or, when there is no selection, occurs at its current cursor position.
- The entry is materialized as raw Markdown rather than as an embed.
- YAML frontmatter is excluded when inserting a full-note entry.
- Only the block ID identifying the inserted entry is excluded; block IDs nested within larger content are preserved.
- Complete blocks and notes have at least one blank line of separation from surrounding destination content, adding only missing separation.
- Partial selections are inserted inline without added whitespace; an enabled source comment also adds no exterior whitespace.
- An opt-in setting adds `%% Source: [[…]] %%` using the most specific stable source available; it is disabled by default.
- The source comment follows a complete block or note on its own line and follows a partial selection inline.
- Inserting any entry into its own source note requires confirmation.
- A successfully inserted entry remains in the Continuum unchanged.
- Keyboard focus remains on that entry after insertion while the destination cursor advances beyond the inserted content, source comment, and trailing separation.
- `p` inserts the focused entry while the Continuum pane has focus.
- The same action is available as an assignable Obsidian command.

## Out of scope
- Updating previously inserted source comments after source notes, headings, or blocks are renamed.
- Treating hidden source comments as reliable backlinks or graph relationships.
- Clipboard-only copying.
- Prompting for or permanently pinning a destination note.
