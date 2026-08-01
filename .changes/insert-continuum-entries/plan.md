# Insert Continuum entries into destination notes Plan

## Approach
Resolve the focused Entry through the existing Entry content seam, then pass plain Markdown and destination context to one pure Insertion planner. The planner returns an exact replacement and final cursor offset. The Obsidian adapter owns editor tracking, confirmation, applying one edit, focus preservation, and notices.

Do not scatter whitespace, provenance, or block-ID cleanup among commands and menus. Every route calls the same insertion operation.

## Implementation decisions
- The Destination note is the most recently active Markdown editor leaf, not a configured or pinned file.
- If that editor closes or stops being Markdown, insertion is unavailable and no fallback note is opened or created.
- Available live entries resolve current source content. Missing live entries use persisted cached Markdown. Snapshots use captured Markdown.
- The Insertion planner receives already resolved content and an explicit granularity: note, complete Block, or partial selection.
- Materialize raw Markdown; never generate an embed.
- Frontmatter removal uses Entry content's existing metadata-aware note-body resolution.
- Remove only the stable block ID identifying the entry. Preserve IDs nested in a larger note/heading/list subtree.
- Complete content ensures at least one blank line at each applicable boundary without deleting existing whitespace or adding redundant blank lines.
- Partial content receives no added whitespace.
- Source comments are disabled by default. Generate the link with Obsidian's public Markdown-link helper in the adapter, then pass the resulting link text to the pure planner.
- Stable source preference is block ID, heading, then note. Snapshot provenance uses nearest stable heading or note.
- A block/note comment occupies its own line after content. A partial comment is adjacent inline with no whitespace before or after the comment token.
- Comments are point-in-time text. Do not record destinations, update prior comments, or promise backlink indexing.
- Compare normalized vault paths before applying an edit. Any same-source entry requires confirmation, regardless of granularity.
- Apply one editor replacement, set its resulting cursor explicitly, and return focus to the same Continuum entry.
- Successful insertion never changes entry state or ordering.
- Extend the Pane keymap/settings with `insert`, default `p`.

### Module shapes & seams

#### [NEW] Insertion planner

```ts
interface InsertionInput {
	markdown: string;
	granularity: 'note' | 'block' | 'partial';
	ownBlockId?: string;
	before: string;
	after: string;
	sourceComment?: string;
}

interface InsertionPlan {
	replacement: string;
	cursorOffset: number;
}

function planInsertion(input: InsertionInput): InsertionPlan;
```

This in-process module owns frontmatter/body selection already expressed by resolved content, own-ID stripping, nested-ID preservation, boundary separation, comment placement, and final cursor offset. Tests assert known literal replacement strings and offsets; they do not reimplement formatting in expectations.

If frontmatter exclusion remains inside Entry content, keep it there and pass body-only Markdown. Do not duplicate that rule in both modules.

#### [MODIFIED] Entry content
Expose the current/cached/captured material and stable provenance target needed by insertion. Do not make it aware of destination text or editor state.

#### [MODIFIED] Pane keymap
Add `insert` with default `p` to the existing validation/resolution/settings seam.

#### [MODIFIED] Obsidian adapter
Track the last active Markdown leaf, generate Markdown links, request same-source confirmation, apply the plan through the Editor interface, set the destination cursor, and restore Continuum focus. There is one production adapter; tests do not mock Obsidian editor calls.

Test strategy: automated tests cover all planner literals and source-content selection through pure seams. Manual Obsidian checks verify active-leaf tracking, confirmation, editor replacement, cursor advancement, and focus restoration.

## Sequence
1. Add failing destination-availability and content-selection scenarios.
2. Add planner tests for source-only metadata removal.
3. Add complete/partial whitespace scenarios with literal expected Markdown.
4. Add disabled and enabled source-comment placement scenarios.
5. Add same-source confirmation orchestration.
6. Wire editor replacement, cursor advancement, entry retention, and focus restoration.
7. Extend keymap/settings and the existing entry overflow menu.
8. Run tests, build, lint, and repeated-insertion smoke checks in Obsidian.
