# Collect blocks and selections Plan

## Approach
Deepen the existing Entry content module rather than placing source-shape logic in command callbacks or the view. The Obsidian adapter supplies raw Markdown, editor positions, and public metadata-cache ranges. The module returns one capture plan containing the entry and, only when explicitly allowed, a precise source edit.

The command applies a returned source edit through the active editor so Obsidian owns file synchronization and undo history. It then adds the planned entry through the existing Continuum model.

## Implementation decisions
- A Block is the domain definition in `CONTEXT.md`, not simply an editor line or one `SectionCache` object.
- Use public `CachedMetadata.sections`, headings, blocks, and list items. Combine those ranges to derive heading sections and list-item descendant ranges.
- Do not inspect CodeMirror internals or Reading-view DOM.
- A non-empty selection always wins over cursor capture.
- Exact single-Block selection means exact start and end positions, including whitespace and trailing newlines. Do not trim or normalize for eligibility.
- Arbitrary snapshots store exact raw Markdown, original source path/range, and nearest stable heading when available.
- Addressable entries store the note path plus heading or block-ID subpath.
- Automatic block-ID creation is a vault setting, disabled by default, and never migrates existing snapshots.
- Obsidian exposes block ranges but no public ID generator. Generate six lowercase base-36 characters with browser cryptography, retrying against all IDs in the source note until unique.
- Never call undocumented commands such as copy-block-link and never alter the clipboard.
- Insert IDs with valid Obsidian syntax for the source structure. The ID belongs to the source permanently after insertion.
- Entry headers use Obsidian icons and accessible labels; do not add visible text badges.

### Module shapes & seams

#### [MODIFIED] Entry content
Extend the existing module at its current seam.

```ts
interface CaptureInput {
	markdown: string;
	selection: EditorRange | null;
	cursor: EditorPosition;
	metadata: SourceMetadata;
	automaticBlockIds: boolean;
	generateId: () => string;
}

type CapturePlan = {
	entry: Entry;
	sourceEdit?: { range: EditorRange; replacement: string };
};

function capture(input: CaptureInput): CapturePlan;
```

The interface receives plain values, not Obsidian globals. It owns:
- Block-range selection
- strict selection eligibility
- live versus snapshot classification
- stable source identity
- generated-ID collision checking
- exact snapshot text

Browser randomness is a true external dependency supplied as `generateId`; tests provide deterministic candidates, including a collision before success. Tests assert literal ranges, content, identity, and source edits through `capture` only.

#### [MODIFIED] Continuum model
Generalize live deduplication from note path to complete stable source address. Snapshot entries never deduplicate. Keep entry ordering/focus invariants behind the existing action interface.

#### [MODIFIED] Obsidian adapter
Add the editor command, gather public cache data, apply an optional source edit, persist settings, and render headers. Do not duplicate any Block parsing in this adapter.

Test strategy: automated tests cover all capture decisions using literal Markdown and cache ranges. A desktop development-vault check verifies actual Obsidian metadata ranges and block-ID syntax for every supported structure.

## Sequence
1. Add failing table-driven tests for cursor Block boundaries.
2. Implement Block derivation through the Entry content seam.
3. Add failing tests for selection precedence and exact snapshots.
4. Add addressability and strict automatic-ID scenarios one red-green cycle at a time.
5. Generalize Continuum deduplication for stable source addresses.
6. Add the setting and editor command, then apply capture plans through the Obsidian adapter.
7. Add type/source header rendering and accessibility labels.
8. Run tests, build, lint, and supported-structure smoke checks in Obsidian.
