# Open and collect notes in a persistent Continuum Plan

## Approach
Build the smallest complete note-only Continuum. Keep Obsidian lifecycle and DOM work in thin adapters around two in-process modules: the persistent Continuum model and entry-content resolution. The adapters translate commands and workspace events into model actions, render model state, and persist snapshots.

Use Node's built-in `node:test` and the existing esbuild package to bundle pure TypeScript tests. Do not add a test framework or mock the `obsidian` package. Obsidian workspace behavior is validated manually in a development vault plus build/lint.

## Implementation decisions
- `manifest.json` uses ID `continuum`, name `Continuum`, and `isDesktopOnly: true`.
- The view type and command IDs are stable from this slice onward.
- There is exactly one Continuum per vault and at most one open Continuum leaf.
- First placement is the right sidebar. Persist only the broad area needed to reopen a closed view; do not reconstruct exact splits or floating windows.
- A closed view is not reopened during plugin load. Collection and `Focus Continuum` may open it.
- Plugin data is the only persistence mechanism; no vault note stores Continuum state.
- Full-note content is live and resolved from the current file when shown.
- Use Obsidian's public Markdown renderer with the source path so links and embeds retain normal context.
- Remove frontmatter using Obsidian metadata positions rather than a custom YAML parser.
- Disable rendered task checkbox mutation while preserving links and native text selection.
- Source activation always uses Live Preview and never replaces the Continuum leaf.
- No global command receives a default hotkey.

### Module shapes & seams

#### [NEW] Continuum model
The interface is the model's action input and immutable snapshot output. Callers do not mutate arrays or focus directly.

```ts
type ContinuumAction =
	| { type: 'add-entry'; entry: Entry }
	| { type: 'focus-entry'; id: string };

function createContinuum(saved?: PersistedContinuum): Continuum;

interface Continuum {
	dispatch(action: ContinuumAction): ContinuumChange;
	snapshot(): PersistedContinuum;
}
```

The module owns these invariants:
- ordered entries have unique internal IDs
- one live note source appears at most once
- focused ID is absent or refers to an existing entry
- serializing and restoring preserves order and focus

Dependencies are in-process values only. Tests exercise behavior through `dispatch` and `snapshot`.

#### [NEW] Entry content
The interface accepts source Markdown plus public metadata positions and returns renderable note content.

```ts
function captureNote(source: NoteSource): LiveNoteEntry;
function resolveNote(entry: LiveNoteEntry, source: SourceDocument): ResolvedEntry;
```

This module owns frontmatter exclusion and source identity. It does not access `App`, `Vault`, `Editor`, or the DOM. Tests pass literal Markdown and metadata positions.

#### [NEW] Obsidian adapter
`main.ts`, the ItemView, and workspace/editor helpers form the only Obsidian adapter. It loads/saves snapshots, obtains source documents, renders resolved entries, and executes source navigation. There is one production adapter and no invented port or mock.

Test strategy: manually validate leaf placement, focus transfer, Markdown rendering, and Live Preview opening in Obsidian. Automated tests cover every state/content decision before adapter wiring.

## Sequence
1. Add the esbuild-backed Node test command and a first failing Continuum model test.
2. Implement note addition, deduplication, focus, serialization, and restore through the model seam.
3. Test and implement full-note capture and frontmatter-free resolution.
4. Replace sample lifecycle code and metadata with the Continuum view and commands.
5. Render note entries, disable task mutation, and wire source activation.
6. Persist workspace area and verify close/restore behavior manually.
7. Run tests, build, lint, and a desktop development-vault smoke test.
