# Organize Continuum entries safely Plan

## Approach
Keep all ordering, removal, focus recovery, clearing, and undo invariants in the existing Continuum model. View keys, commands, and menus dispatch the same actions; no caller manipulates entry arrays or source notes.

The undo buffer is runtime-only state owned by the model. Persisted snapshots contain only the active Continuum, so restart deliberately expires undo.

## Implementation decisions
- Movement swaps the focused entry with one adjacent entry. Boundary movement is a no-op.
- Focus remains on the moved entry by identity.
- Removal requires no confirmation and focuses the next entry now at the removed index, falling back to the previous entry.
- Store one undo payload containing either one removed entry plus original index or the complete cleared collection plus focus.
- Any later removal or clear replaces the prior undo. Adds, focus changes, folds, and moves do not expire it. Restart expires it because undo is not serialized.
- Undo restores entry identity and all persisted entry fields. A restored single entry becomes focused; undo-clear restores prior focus.
- Clearing is applied only after an explicit confirmation from the Obsidian adapter.
- Model organization actions never return source-edit effects. Generated block IDs are source-owned and permanent.
- Extend the Pane keymap with move-down `Shift+J`, move-up `Shift+K`, remove `x`, and undo `u`. All remain configurable, disableable, duplicate-validated, and restorable with the existing settings interface.
- Do not assign a pane-local clear key.
- Entry overflow uses Obsidian `Menu`; toolbar overflow contains clear and conditionally available undo.

### Module shapes & seams

#### [MODIFIED] Continuum model
Extend the existing dispatch interface.

```ts
type OrganizationAction =
	| { type: 'move-focused'; offset: -1 | 1 }
	| { type: 'remove-focused' }
	| { type: 'clear' }
	| { type: 'undo-removal' };
```

The model owns order, focus recovery, undo replacement/expiry, and restoration. Observable `ContinuumChange` results may report `changed: false` for boundaries and unavailable undo but expose no mutable internals.

Tests construct state through public actions, invoke one organization action, and assert through `snapshot`. Runtime-only undo is observed by dispatching undo, never by reading an undo field.

#### [MODIFIED] Pane keymap
Add four actions and defaults to the existing validation/resolution seam. Existing duplicate, `Tab`, empty, and restore-default behavior applies unchanged.

#### [MODIFIED] Obsidian view adapter
Wire keys, commands, overflow menus, and confirmation to model actions. The adapter must not call any source-note edit operation during organization.

Test strategy: automated model tests cover every order/focus/undo invariant. Automated keymap tests cover defaults and custom bindings. Manual Obsidian checks verify confirmation and accessible menu/command/key equivalence.

## Sequence
1. Add failing move and boundary scenarios through the Continuum model seam.
2. Add removal and focus-recovery scenarios.
3. Add one-entry undo, replacement, and restart-expiry scenarios.
4. Add confirmed clear and whole-collection undo scenarios.
5. Extend keymap configuration and resolution.
6. Wire commands and compact entry/toolbar overflow menus to the same actions.
7. Verify no organization path edits a source note.
8. Run tests, build, lint, and desktop keyboard/menu smoke checks.
