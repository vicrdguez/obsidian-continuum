# Organize the Continuum

A writer can maintain the vault's single persistent **Continuum** as an ordered reading flow.

## Behaviors
- The Continuum and its entries persist across Obsidian restarts.
- Newly collected entries appear at the end.
- `Shift+J` moves the focused entry down, and `Shift+K` moves it up.
- Equivalent move commands can be assigned Obsidian hotkeys.
- `x` removes the focused entry immediately, then focuses the next entry or the previous one when no next entry exists.
- The same removal is available as an assignable Obsidian command.
- `u` restores the last removed entry or an entire cleared Continuum until Obsidian restarts or another removal occurs.
- The same undo is available as an assignable Obsidian command.
- Clearing every entry requires confirmation.
- Removing entries never removes block IDs previously added to source notes.

## Out of scope
- Multiple or named Continuums.
- Drag-and-drop reordering.
