import { ItemView, MarkdownRenderer, setIcon, TFile, WorkspaceLeaf } from 'obsidian';
import type { ContinuumController } from './continuum-controller';
import { resolveEntry, type SourceDocument } from './entry-content';
import { entryHeader } from './entry-header';

export const CONTINUUM_VIEW_TYPE = 'continuum';

export class ContinuumView extends ItemView {
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
		this.registerDomEvent(this.contentEl, 'focusin', (event) => {
			const article = (event.target as Element).closest<HTMLElement>('[data-entry-id]');
			if (!article) return;
			this.contentEl.querySelector('.is-focused')?.removeClass('is-focused');
			article.addClass('is-focused');
			void this.controller.focusEntry(article.dataset.entryId ?? '');
		});
		this.registerDomEvent(this.contentEl, 'click', (event) => {
			const source = (event.target as Element).closest<HTMLElement>('[data-source-path]');
			if (source?.dataset.sourcePath) void this.controller.openSource(source.dataset.sourcePath);
		});
		await this.render();
	}

	async render(): Promise<void> {
		const container = this.contentEl;
		container.empty();
		container.addClass('continuum');

		const snapshot = this.controller.continuum.snapshot();
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

			const identity = entryHeader(entry);
			const header = article.createDiv({ cls: 'continuum-entry-header' });
			header.createEl('button', {
				cls: 'continuum-source',
				text: identity.source,
				attr: {
					type: 'button',
					'aria-label': `Open source ${identity.source}`,
					'data-source-path': entry.sourcePath,
				},
			});
			const typeIcon = header.createSpan({
				cls: 'continuum-entry-type',
				attr: { title: identity.label, 'aria-label': identity.label, role: 'img' },
			});
			setIcon(typeIcon, identity.icon);

			const resolved = await resolveEntry(entry, (path) => this.readSource(path));
			if (!resolved) continue;
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

	private async readSource(path: string): Promise<SourceDocument | null> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return null;
		const position = this.app.metadataCache.getFileCache(file)?.frontmatterPosition;
		return {
			markdown: await this.app.vault.cachedRead(file),
			...(position
				? {
					frontmatter: {
						startOffset: position.start.offset,
						endOffset: position.end.offset,
					},
				}
				: {}),
		};
	}

	focusEntry(id: string): void {
		this.contentEl
			.querySelector<HTMLElement>(`[data-entry-id="${CSS.escape(id)}"]`)
			?.focus();
	}
}
