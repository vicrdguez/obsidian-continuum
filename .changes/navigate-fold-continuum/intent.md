# Navigate and fold with configurable pane keys

## Why
A long Continuum must be navigable without repeatedly reaching for the mouse, while still preserving normal keyboard accessibility and enough surrounding context to understand the sequence.

## What
Add persistent entry focus, pane-local navigation and folding, adaptive scrolling, collection-wide folding, and safe per-action key configuration.

## Scope
- Make `Focus Continuum` reveal the pane and focus its remembered entry
- Persist the last-focused entry across restarts, falling back to the newest existing entry
- Move focus with pane-local `j` and `k` by default
- Expose equivalent next-entry and previous-entry commands without default global hotkeys
- Stop at the first and last entries without wrapping
- Scroll a newly focused entry into view
- Center entries shorter than the alignment threshold and top-align entries at or above it
- Add an alignment slider from 50% to 100% in 5% steps, defaulting to 80%
- Keep focus unchanged during manual scrolling
- Focus an entry when clicked
- Start new entries expanded and persist each fold state
- Toggle the focused entry with pane-local `Space` by default
- Preserve `Tab` for native traversal of links and controls
- Toggle all folds with one command and one toolbar action: fold all if any are expanded, otherwise unfold all
- Show the entry count and fold-all action in the pane toolbar
- Add key-capture settings for next, previous, open source, and fold actions
- Allow empty bindings to disable an action and provide `Restore defaults`
- Reject duplicate bindings and reserved `Tab`
- Keep pane-local bindings active only while Continuum has focus

## Out of Scope
- Global unmodified single-key shortcuts
- Default global command hotkeys
- Multi-key sequences such as `[[` and `]]`
- Vim-style text-range selection
- Reordering, removal, undo, and clearing
- Inserting entries into a destination note
- Automatic focus changes during manual scrolling

## Definition of Done
- [ ] Focusing Continuum restores the last valid entry or falls back predictably.
- [ ] Pane-local and command navigation moves one entry at a time without wrapping or reacting to manual scroll.
- [ ] Focused entries use the configurable adaptive center/top alignment rule.
- [ ] Individual fold state is keyboard-accessible, starts expanded, and persists.
- [ ] One fold-all action deterministically folds a mixed collection and unfolds an entirely folded collection.
- [ ] Pane-local bindings can be captured, disabled, reset, and validated without overriding `Tab` or accepting duplicates.
- [ ] The pane toolbar reports entry count and exposes fold-all without clutter.
