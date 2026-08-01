# Navigate and fold with configurable pane keys Plan

## Approach
Extend the Continuum model for focus and fold transitions. Add one pure Pane keymap module that validates configured bindings and resolves normalized key events to actions. Keep DOM listeners thin: the ItemView activates the keymap only in its own scope, dispatches the resolved action, and performs a measured scroll after state changes.

Adaptive alignment is a pure decision from entry height, viewport height, and threshold. DOM measurement remains in the view; the alignment rule remains testable without a browser environment.

## Implementation decisions
- Focus is entry identity, not current scroll position.
- Persist focused entry and fold states with the Continuum snapshot.
- New entries start expanded. Missing persisted focus falls back to the newest entry.
- Navigation never wraps and manual scroll never changes focus.
- The threshold comparison is inclusive: an entry at or above the threshold top-aligns; a shorter entry centers.
- The threshold UI is a 50–100 slider in steps of 5, default 80.
- Use the public view-local key scope rather than global DOM or application listeners.
- Do not consume key events originating from interactive rendered content or controls, except when the focused entry container itself owns the configured action.
- Never register `Tab`; it remains native keyboard traversal.
- Key settings capture one key or modifier combination. Empty disables. Multi-key sequences are unsupported.
- Duplicate normalized bindings and `Tab` are invalid; failed changes do not partially update the active keymap.
- This slice configures `j`, `k`, `Enter`, and `Space`. Downstream organization/insertion slices extend the same module and settings UI for their actions.
- No plugin command receives a default global hotkey.

### Module shapes & seams

#### [MODIFIED] Continuum model
Extend the current action interface rather than exposing focus/fold fields.

```ts
type NavigationAction =
	| { type: 'focus-next' }
	| { type: 'focus-previous' }
	| { type: 'focus-entry'; id: string }
	| { type: 'toggle-fold'; id: string }
	| { type: 'toggle-all-folds' };
```

The model owns boundary no-ops, focus validity, fold defaults, fold-all semantics, and serialization. Tests use existing `dispatch` and `snapshot` only.

#### [NEW] Pane keymap

```ts
type PaneAction = 'next' | 'previous' | 'open-source' | 'toggle-fold';
type KeyBindings = Record<PaneAction, string | null>;

function validateBindings(bindings: KeyBindings): ValidationResult;
function resolveKey(event: KeyDescriptor, bindings: KeyBindings): PaneAction | null;
```

The module normalizes keys/modifiers, rejects duplicates and `Tab`, and resolves only exact configured combinations. It has no DOM dependency. Tests pass literal descriptors and observe actions/errors through this interface.

#### [NEW] Alignment rule

```ts
function entryAlignment(
	entryHeight: number,
	viewportHeight: number,
	thresholdPercent: number,
): 'center' | 'start';
```

This small internal seam earns a test because the threshold edge is an explicit invariant. Do not wrap DOM measurement in an adapter interface.

#### [MODIFIED] Obsidian view adapter
Register current bindings in the view's active scope, render focus/fold state and toolbar, measure geometry after render, and call `scrollIntoView` with the pure alignment result. Manually validate real focus, keyboard traversal, and scrolling in Obsidian.

## Sequence
1. Add failing model tests for focus restore, navigation boundaries, click focus, and fold state.
2. Implement model actions one scenario at a time.
3. Add failing keymap validation/resolution tests and implement the module.
4. Add alignment threshold examples and implement the pure rule.
5. Wire scoped key handling, focus DOM state, fold controls, and measured scrolling.
6. Add settings controls, validation, disabling, and restore defaults.
7. Add toolbar count/fold-all behavior and accessible labels.
8. Run tests, build, lint, and desktop keyboard/accessibility smoke checks.
