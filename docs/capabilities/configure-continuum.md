# Configure Continuum

A writer can adjust Continuum’s optional behavior and pane-local keyboard controls for their vault.

## Behaviors
- Automatic block-ID creation is disabled by default and affects only future collection.
- Hidden source comments are disabled by default and apply when entries are inserted.
- The adaptive navigation alignment threshold defaults to 80% and can be set from 50% to 100% in 5% steps.
- Every pane-local action has a key-capture setting: next `j`, previous `k`, open source `Enter`, insert `p`, fold `Space`, move down `Shift+J`, move up `Shift+K`, remove `x`, and undo `u` by default.
- A binding can be cleared to disable it, and all pane-local bindings can be restored to defaults.
- Duplicate bindings and reserved `Tab` bindings are rejected.
- No command has a default global hotkey; commands remain assignable through Obsidian’s Hotkeys settings.

## Out of scope
- Multi-key pane-local sequences.
- Preset or JSON keymaps.
