import { ItemView, MarkdownRenderer, TFile, WorkspaceLeaf } from 'obsidian';
import type ContinuumPlugin from './main';
import { resolveNote } from './entry-content';

export const CONTINUUM_VIEW_TYPE = 'continuum';

export class ContinuumView extends ItemView {
	constructor(leaf: WorkspaceLeaf, private readonly plugin: ContinuumPlugin) {
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
		this.registerDomEvent(this.contentEl, 'focusin', (event) => {
			const article = (event.target as Element).closest<HTMLElement>('[data-entry-id]');
			if (!article) return;
			this.contentEl.querySelector('.is-focused')?.removeClass('is-focused');
			article.addClass('is-focused');
			void this.plugin.focusEntry(article.dataset.entryId ?? '');
		});
		this.registerDomEvent(this.contentEl, 'click', (event) => {
			const source = (event.target as Element).closest<HTMLElement>('[data-source-path]');
			if (source?.dataset.sourcePath) void this.plugin.openSource(source.dataset.sourcePath);
		});
		await this.render();
	}

	async render(): Promise<void> {
		const container = this.contentEl;
		container.empty();
		container.addClass('continuum');

		const snapshot = this.plugin.continuum.snapshot();
		if (snapshot.entries.length === 0) {
			container.createDiv({
				cls: 'continuum-empty',
				text: 'Your Continuum is empty. Use Add current note to collect a note, then Focus Continuum to return here.',
			});
			return;
		}

		for (const entry of snapshot.entries) {
			const article = container.createEl('article', {
				cls: `continuum-entry${entry.id === snapshot.focusedId ? ' is-focused' : ''}`,
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
	}

	focusEntry(id: string): void {
		this.contentEl
			.querySelector<HTMLElement>(`[data-entry-id="${CSS.escape(id)}"]`)
			?.focus();
	}
}
