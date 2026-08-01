# Navigate the Continuum

A writer can move a single focus through the ordered **Entries** without leaving the keyboard.

## Behaviors
- `j` moves focus to the next entry.
- `k` moves focus to the previous entry.
- Moving focus scrolls the focused entry into view without wrapping past the first or last entry.
- Entries shorter than the alignment threshold are centered; taller entries align to the top.
- The alignment threshold is configurable from 50% to 100% of viewport height in 5% steps and defaults to 80%.
- The last-focused entry is restored across restarts; if unavailable, the newest entry receives focus.
- Manual scrolling does not change focus; clicking an entry or using navigation keys does.
- Equivalent next-entry and previous-entry commands can be assigned global Obsidian hotkeys.
- `Enter` opens the focused entry’s source in Live Preview in the most recently active Markdown leaf, creating one only when necessary.
- Source jumps select the source range when one is available and preserve the Continuum pane.
- Internal links in rendered entry content open in Live Preview in the same Markdown leaf and preserve the Continuum pane.

## Out of scope
- Global unmodified single-key shortcuts.
- Two-key pane-local sequences such as `[[` and `]]`.
