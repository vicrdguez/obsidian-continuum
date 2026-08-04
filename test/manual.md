# Desktop smoke test

Run against Obsidian 1.13.4 in an isolated vault, through Obsidian's live renderer using the Chrome DevTools Protocol.

## Open and collect (2026-08-01)

Vault: `Alpha.md`, `Beta.md`, `Gamma.md`.

- [x] **B1 — Open and place:** `Focus Continuum` created one infinity-icon view in the right sidebar and focused its content. Moving it to the left sidebar, closing it, and invoking the command reopened it on the left.
- [x] **B2 — Stay closed:** Closing Continuum, terminating Obsidian, and launching it again with the same vault left zero Continuum leaves; `Focus Continuum` reopened it.
- [x] **B3 — Collect from every mode:** Source mode, Live Preview, and Reading view each appended one entry. In all three runs, the same source DOM element retained keyboard focus.
- [x] **B4 — Render read-only:** The Alpha entry omitted `topic: smoke`, rendered the body and task, disabled the task checkbox, and computed `user-select: text`.
- [x] **B5 — Deduplicate:** Adding Alpha again kept three total entries and moved focus from Gamma to Alpha.
- [x] **B6 — Restore:** Terminating Obsidian with Continuum open and launching it again restored the same three ordered entry IDs and focused Gamma entry.
- [x] **B7 — Open source:** After a fresh application launch, opening Continuum and activating Alpha's source reused the attached Gamma Markdown leaf with `{ mode: "source", source: false }` (Live Preview) and left one Continuum view open.

## Navigate and fold (2026-08-04)

Vault: five entries in order `Alpha` (26% of the pane height), `Medium` (61%), `Beta` (12%), `Tall` (247%), `Gamma` (12%). Key presses were injected as trusted input events; the Obsidian window must be frontmost for focus events to fire.

- [x] **B1 — Restore focus:** With a saved `focusedId` naming an entry that no longer exists, `Focus Continuum` focused the newest entry (`Gamma`). After a restart with a valid saved focus, it restored that entry instead.
- [x] **B2 — Navigate one entry at a time:** `j` and `k` moved focus to the adjacent entry in both directions, and the `Focus next entry` / `Focus previous entry` commands produced the same moves. No command ships a default global hotkey.
- [x] **B3 — Stop at boundaries:** `k` on the first entry and `j` on the last left focus unchanged; navigation never wrapped.
- [x] **B4 — Manual scrolling and clicks:** Scrolling the pane left the focused entry unchanged; a real click on another entry focused the clicked entry and repainted the model.
- [x] **B5 — Adaptive alignment:** At the 80% default, the 247% entry aligned to the pane top (offset 0) while the 61% and 12% entries centred (centre offset 0). Entries clamped at the scroll extremes stay where the browser can put them.
- [x] **B6 — Configure the threshold:** The slider read 50–100 in steps of 5 at 80. At 50, the 61% entry switched from centred to top-aligned, and the value survived a restart.
- [x] **B7 — Fold one entry:** `Space` folded only the focused entry, its body left the accessibility tree, the fold survived a restart, and `Tab` still traversed to the entry's source button.
- [x] **B8 — Fold every entry:** The toolbar action and the `Fold or unfold all entries` command each folded a mixed collection and unfolded an entirely folded one, and the toolbar label alternated between **Fold all entries** and **Unfold all entries**.
- [x] **B9 — Replace or disable a binding:** Capturing `Shift+n` for next made `Shift+n` navigate and left `j` inert; clearing the fold field with `Backspace` disabled `Space`.
- [x] **B10 — Reject an unsafe keymap:** Assigning the in-use `Shift+n` to another action was refused with "Shift+n is already used by another action."; `Tab` was refused with "Tab is reserved for keyboard navigation." and still moved focus out of the field. The active keymap was unchanged in both cases.
- [x] **B11 — Restore defaults:** The button reset the four fields and the saved settings to `j`, `k`, `Enter`, and `Space`.
- [x] **B12 — Toolbar:** The toolbar reported "5 entries" and exposed one labelled fold-all action.
