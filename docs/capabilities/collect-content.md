# Collect content

A writer can add vault content to the **Continuum** as an **Entry** while preserving a route back to its **Source**.

## Behaviors
- “Add current note” adds the active note from any Markdown view mode.
- “Add current block or selection” adds the selection when present; otherwise it adds the **Block** containing the cursor.
- Block and selection collection is available only in Source mode and Live Preview, where exact source Markdown and positions are available.
- A full note or existing **Addressable content** becomes a **Live entry**.
- An unaddressed block or selection becomes a **Snapshot entry** by default.
- The writer can explicitly allow Continuum to add block IDs to source notes.
- With that option enabled, a cursor-selected block or a selection matching the complete block range character-for-character receives a collision-checked, native-style six-character lowercase alphanumeric block ID and becomes a live entry.
- Partial-block and multi-block selections remain snapshot entries.
- Each newly added entry is appended to the end of the Continuum.
- Collecting reveals the Continuum pane and marks the collected entry as focused without taking keyboard focus from the source editor.
- Adding a live entry already present in the Continuum focuses the existing entry instead of duplicating it.
- Snapshot entries may contain duplicate source locations or text.

## Out of scope
- Silently modifying source notes without prior opt-in.
- Retroactively converting existing snapshots when automatic block IDs are enabled.
- Expanding a selection beyond the content the writer chose.
