# Organize Continuum entries safely

## Why
A persistent writing workbench must be rearrangeable and cleanable from the keyboard without making accidental deletion or source modification costly.

## What
Add focused-entry reordering, immediate removal with one-step undo, confirmed clearing with whole-collection undo, and compact mouse-accessible organization controls.

## Scope
- Move the focused entry down with pane-local `Shift+J` and up with `Shift+K` by default
- Expose equivalent move commands without default global hotkeys
- Keep focus attached to the moved entry and persist the new order
- Make movement at the first or last boundary a no-op
- Remove the focused entry immediately with pane-local `x` by default
- After removal, focus the next entry at that position or the previous entry when none follows
- Restore the last removed entry at its former position with pane-local `u` by default
- Keep one in-memory undo only, replacing it after another removal
- Require confirmation before clearing every entry
- Restore an entire cleared Continuum with the same one-step undo
- Restore removed/cleared entries with their identity, type, source, content, and fold state
- Preserve generated source block IDs after entry removal or clearing
- Add move, remove, and insert placeholders to the entry overflow structure; insertion is implemented separately
- Place clear and undo in the pane toolbar overflow menu
- Extend pane-local key settings for move up/down, remove, and undo
- Keep every organization action available as an assignable Obsidian command

## Out of Scope
- Drag-and-drop reordering
- Multiple or named Continuums
- Persistent trash or multi-level undo
- Confirmation for individual removal
- Automatic removal after insertion
- Removing block IDs from source notes
- A pane-local clear shortcut

## Definition of Done
- [ ] Focused entries move up or down predictably, persist their order, and stop at collection boundaries.
- [ ] Removing the focused entry immediately chooses the agreed next focus target.
- [ ] One-step undo restores the most recently removed entry at its former position and expires as specified.
- [ ] Clearing requires confirmation and cancellation leaves the Continuum unchanged.
- [ ] Undo after clearing restores the complete collection and its entry state.
- [ ] Organization never edits source notes or removes generated block IDs.
- [ ] Keyboard bindings, commands, entry overflow actions, and toolbar overflow actions expose the same behavior accessibly.
