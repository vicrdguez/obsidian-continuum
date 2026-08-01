# Insert Continuum entries into destination notes

## Why
Collected material only becomes useful writing when it can move into the chosen draft without clipboard steps, lost Markdown, accidental self-duplication, or unclear provenance.

## What
Add direct insertion of the focused Entry into the most recently active Markdown editor, with exact materialization rules, optional hidden source comments, safe same-source confirmation, and keyboard-first repeated use.

## Scope
- Track the most recently active Markdown editor as the Destination note
- Add `Insert focused entry` without a default global hotkey
- Add pane-local `p` by default and an entry-overflow insert action
- Make the `p` binding configurable through the existing pane-local key settings
- Do nothing and ask the writer to focus a destination note when no remembered editor is available
- Insert current resolved Markdown for available live entries
- Insert last cached Markdown for unavailable live entries and exact captured Markdown for snapshots
- Replace the destination selection when present; otherwise insert at its cursor
- Exclude YAML frontmatter from full-note insertion
- Remove only the block ID identifying the inserted entry while preserving nested IDs
- Materialize content rather than inserting embeds
- Ensure at least one blank line around complete Blocks and notes, adding only missing separation
- Insert partial selections character-for-character inline with no added whitespace
- Add an optional `Add source comments` setting, disabled by default
- Write `%% Source: [[…]] %%` using the most specific stable source available
- Put complete-content source comments on their own trailing line
- Put partial-selection source comments inline with no exterior whitespace
- Require confirmation before inserting any entry into its own source note
- Keep the entry and Continuum focus unchanged after successful insertion
- Advance the Destination cursor beyond inserted content, source comment, and trailing separation
- Keep source comments as point-in-time annotations without backlink or rename guarantees

## Out of Scope
- Clipboard-only copying
- Inserting live entries as embeds
- Automatic removal or used-state marking after insertion
- Prompting for or pinning a Destination note
- Appending to the end instead of using selection/cursor
- Updating source comments after source-note, heading, or block rename
- Treating hidden comments as reliable backlinks or graph relationships
- Generating new block IDs for inserted copies

## Definition of Done
- [ ] Insertion uses the most recently active Markdown editor and fails safely when it is unavailable.
- [ ] Live and snapshot entries materialize the correct current, cached, or captured raw Markdown.
- [ ] Full-note frontmatter and the entry's own block ID are excluded while nested block IDs remain intact.
- [ ] Complete content gains only missing blank-line separation while partial selections remain exact inline text.
- [ ] Optional source comments use the agreed target, placement, and whitespace rules.
- [ ] Same-source insertion occurs only after explicit confirmation.
- [ ] Destination replacement/cursor advancement, Continuum focus, and entry retention support repeated insertion.
- [ ] Pane key, command, and overflow action invoke identical insertion behavior and remain configurable.
