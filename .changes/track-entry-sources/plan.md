# Keep entries connected to their sources Plan

## Approach
Deepen Entry content with resolution and location operations. A caller supplies the stored Entry plus the current source document when available; the module returns explicit resolved or missing results. One Obsidian adapter listens for vault/cache events, updates model source paths and cached live Markdown, and executes navigation targets.

Use exact matching only. Keep source lifecycle rules out of the view: the view renders `ResolvedEntry` and invokes one navigation helper.

## Implementation decisions
- Live entries retain a last-resolved raw Markdown cache in persisted plugin data so deletion never blanks the collected material.
- Snapshot entries already own their captured Markdown and never refresh it.
- A missing source does not change Live/Snapshot type, remove the entry, or create a new address.
- A heading rename and a removed block ID are treated as unavailable addresses. Do not retarget the nearest heading or block.
- Vault rename events update note paths for all entry types. Metadata-cache changed events refresh affected live entries.
- Snapshot relocation uses exact string occurrences only, choosing the occurrence with the smallest absolute distance from the original offset. Ties choose the earlier occurrence.
- If exact snapshot text is absent, navigate to the note with no replacement selection.
- Every note opened from Continuum is switched to Live Preview and receives editor focus.
- Reuse the most recently active Markdown leaf. Never open into or replace the Continuum leaf.
- Route rendered internal links through the same navigation helper.
- Source labels prefer `Note › Heading`; ambiguous basenames display the vault path. Full paths remain available as title/tooltip text.
- Register vault, metadata-cache, and DOM events through Obsidian cleanup helpers.

### Module shapes & seams

#### [MODIFIED] Entry content
Add resolution and source-location operations to the existing interface.

```ts
type EntryResolution =
	| { status: 'available'; markdown: string; target: SourceTarget }
	| { status: 'missing'; markdown: string };

function resolve(entry: Entry, source: SourceDocument | null): EntryResolution;
function locateSource(entry: Entry, source: SourceDocument): SourceTarget;
```

The module owns:
- current live extraction by stable subpath
- snapshot immutability
- missing-source classification
- cached fallback content
- exact-nearest snapshot matching
- target ranges

Dependencies are in-process strings, ranges, and cache metadata. Tests cover all outcomes through these functions with known literal Markdown. No Vault, Workspace, or DOM objects enter the interface.

#### [MODIFIED] Continuum model
Add actions for source-path rename and last-resolved content refresh. These actions preserve identity, order, type, fold state, and focus.

#### [NEW] Obsidian source-navigation adapter
A small helper owns WorkspaceLeaf selection, Live Preview activation, editor selection, and rendered-link routing. It is the sole caller of Obsidian workspace navigation methods. There is one production adapter; do not add a fake port.

Test strategy: automated tests verify resolution, exact matching, rename state transitions, and missing fallback through pure seams. Manual Obsidian checks verify event timing, leaf reuse, Live Preview activation, and editor selection.

## Sequence
1. Add failing resolution tests for live refresh and snapshot immutability.
2. Add rename and missing-source model scenarios.
3. Add exact-nearest snapshot location tests, including duplicates and absence.
4. Add heading/block target resolution and missing-address tests.
5. Wire registered vault and metadata-cache events to model updates.
6. Implement the one source-navigation adapter and route entry links through it.
7. Render missing state and disambiguated source labels.
8. Run tests, build, lint, and rename/delete/navigation smoke checks in Obsidian.
