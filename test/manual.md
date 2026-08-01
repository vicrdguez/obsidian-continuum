# Desktop smoke test

Run against Obsidian 1.13.4 in an isolated vault with `Alpha.md`, `Beta.md`, and `Gamma.md`. The 2026-08-01 implementation run passed every check below through Obsidian's live renderer using the Chrome DevTools Protocol.

- [x] **B1 — Open and place:** `Focus Continuum` created one infinity-icon view in the right sidebar and focused its content. Moving it to the left sidebar, closing it, and invoking the command reopened it on the left.
- [x] **B2 — Stay closed:** Closing Continuum, terminating Obsidian, and launching it again with the same vault left zero Continuum leaves; `Focus Continuum` reopened it.
- [x] **B3 — Collect from every mode:** Source mode, Live Preview, and Reading view each appended one entry. In all three runs, the same source DOM element retained keyboard focus.
- [x] **B4 — Render read-only:** The Alpha entry omitted `topic: smoke`, rendered the body and task, disabled the task checkbox, and computed `user-select: text`.
- [x] **B5 — Deduplicate:** Adding Alpha again kept three total entries and moved focus from Gamma to Alpha.
- [x] **B6 — Restore:** Terminating Obsidian with Continuum open and launching it again restored the same three ordered entry IDs and focused Gamma entry.
- [x] **B7 — Open source:** After a fresh application launch, opening Continuum and activating Alpha's source reused the attached Gamma Markdown leaf with `{ mode: "source", source: false }` (Live Preview) and left one Continuum view open.
