# Desktop smoke test

Run against Obsidian 1.13.4 in an isolated vault with `Alpha.md`, `Beta.md`, and `Gamma.md`. The 2026-08-01 implementation run passed every check below through Obsidian's live renderer using the Chrome DevTools Protocol.

- [x] **B1 — Open and place:** `Focus Continuum` created one infinity-icon view in the right sidebar and focused its content. Moving it to the left sidebar, closing it, and invoking the command reopened it on the left.
- [x] **B2 — Stay closed:** Closing Continuum and disabling/enabling the plugin left zero Continuum leaves; `Focus Continuum` reopened it.
- [x] **B3 — Collect from every mode:** Source mode, Live Preview, and Reading view each appended one entry. In all three runs, the same source DOM element retained keyboard focus.
- [x] **B4 — Render read-only:** The Alpha entry omitted `topic: smoke`, rendered the body and task, disabled the task checkbox, and computed `user-select: text`.
- [x] **B5 — Deduplicate:** Adding Alpha again kept three total entries and moved focus from Gamma to Alpha.
- [x] **B6 — Restore:** Disabling/enabling the plugin restored byte-for-byte-equivalent ordered entries and focused ID.
- [x] **B7 — Open source:** Activating Alpha's source reused the most recently active Markdown leaf with `{ mode: "source", source: false }` (Live Preview) and left one Continuum view open.
