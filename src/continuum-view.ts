import {
	ItemView,
	MarkdownRenderer,
	Scope,
	setIcon,
	TFile,
	WorkspaceLeaf,
} from 'obsidian';
import type { ContinuumController } from './continuum-controller';
import { entryAlignment } from './entry-alignment';
import { resolveNote } from './entry-content';
import { resolveKey } from './pane-keymap';

export const CONTINUUM_VIEW_TYPE = 'continuum';

export class ContinuumView extends ItemView {
	private foldAllEl: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf, private readonly controller: ContinuumController) {
		super(leaf);
	}

	getViewType(): string {
		return CONTINUUM_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Continuum';
	}

	getIcon(): string {
		return 'infinity';
	}

	async onOpen(): Promise<void> {
		// A view-local scope keeps the pane keys inert everywhere else.
		this.scope = new Scope(this.app.scope);
		this.scope.register(null, null, (event) => this.handleKey(event));
		this.registerDomEvent(this.contentEl, 'focusin', (event) => {
			const article = (event.target as Element).closest<HTMLElement>('[data-entry-id]');
			const id = article?.dataset.entryId;
			if (!id || id === this.controller.continuum.snapshot().focusedId) return;
			void this.controller.focusEntry(id);
		});
		this.registerDomEvent(this.contentEl, 'click', (event) => {
			const target = event.target as Element;
			if (target.closest('[data-fold-all]')) {
				void this.controller.toggleAllFolds();
				return;
			}
			const source = target.closest<HTMLElement>('[data-source-path]');
			if (source?.dataset.sourcePath) void this.controller.openSource(source.dataset.sourcePath);
		});
		await this.render();
	}

	async render(): Promise<void> {
		const container = this.contentEl;
		container.empty();
		container.addClass('continuum');
		this.foldAllEl = null;

		const snapshot = this.controller.continuum.snapshot();
		if (snapshot.entries.length === 0) {
			container.createDiv({
				cls: 'continuum-empty',
				text: 'Your Continuum is empty. Use Add current note to collect a note, then Focus Continuum to return here.',
			});
			return;
		}

		const count = snapshot.entries.length;
		const toolbar = container.createDiv({ cls: 'continuum-toolbar' });
		toolbar.createSpan({
			cls: 'continuum-count',
			text: `${count} ${count === 1 ? 'entry' : 'entries'}`,
		});
		this.foldAllEl = toolbar.createEl('button', {
			cls: 'clickable-icon continuum-fold-all',
			attr: { type: 'button', 'data-fold-all': 'true' },
		});

		for (const entry of snapshot.entries) {
			const article = container.createEl('article', {
				cls: 'continuum-entry',
				attr: { 'data-entry-id': entry.id, tabindex: '0' },
			});

			article.createEl('button', {
				cls: 'continuum-source',
				text: entry.sourcePath,
				attr: {
					type: 'button',
					'aria-label': `Open source ${entry.sourcePath}`,
					'data-source-path': entry.sourcePath,
				},
			});

			const file = this.app.vault.getAbstractFileByPath(entry.sourcePath);
			if (!(file instanceof TFile)) continue;
			const markdown = await this.app.vault.cachedRead(file);
			const position = this.app.metadataCache.getFileCache(file)?.frontmatterPosition;
			const resolved = resolveNote(entry, {
				markdown,
				...(position
					? {
						frontmatter: {
							startOffset: position.start.offset,
							endOffset: position.end.offset,
						},
					}
					: {}),
			});
			const body = article.createDiv({ cls: 'continuum-entry-body' });
			await MarkdownRenderer.render(
				this.app,
				resolved.markdown,
				body,
				resolved.sourcePath,
				this,
			);
			body.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
				.forEach((checkbox) => { checkbox.disabled = true; });
		}

		this.syncState();
	}

	/** Paints focus and fold state onto the rendered entries. Never moves focus. */
	syncState(): void {
		const { focusedId, foldedIds = [] } = this.controller.continuum.snapshot();
		let expanded = 0;
		this.contentEl
			.querySelectorAll<HTMLElement>('[data-entry-id]')
			.forEach((article) => {
				const id = article.dataset.entryId ?? '';
				const folded = foldedIds.includes(id);
				if (!folded) expanded += 1;
				// Folding hides the body with `display: none`, which also takes it
				// out of the accessibility tree; `aria-expanded` is invalid here.
				article.toggleClass('is-folded', folded);
				article.toggleClass('is-focused', id === focusedId);
			});

		if (!this.foldAllEl) return;
		const label = expanded > 0 ? 'Fold all entries' : 'Unfold all entries';
		setIcon(this.foldAllEl, expanded > 0 ? 'chevrons-down-up' : 'chevrons-up-down');
		this.foldAllEl.setAttr('aria-label', label);
		this.foldAllEl.setAttr('title', label);
	}

	focusEntry(id: string): void {
		const article = this.entryEl(id);
		if (!article) return;
		article.focus({ preventScroll: true });
		article.scrollIntoView({
			block: entryAlignment(
				article.getBoundingClientRect().height,
				this.contentEl.clientHeight,
				this.controller.settings.alignmentThreshold,
			),
		});
	}

	private entryEl(id: string): HTMLElement | null {
		return this.contentEl.querySelector<HTMLElement>(
			`[data-entry-id="${CSS.escape(id)}"]`,
		);
	}

	/** Only an entry container itself answers pane keys; its controls keep theirs. */
	private handleKey(event: KeyboardEvent): false | void {
		const active = this.contentEl.ownerDocument.activeElement;
		const entryId = active instanceof HTMLElement ? active.dataset.entryId : undefined;
		if (!entryId) return;
		const action = resolveKey(event, this.controller.settings.bindings);
		if (!action) return;
		void this.controller.runPaneAction(action, entryId);
		return false;
	}
}
