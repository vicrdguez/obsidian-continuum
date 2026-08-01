import { MarkdownView, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import {
	createContinuum,
	type Continuum,
	type PersistedContinuum,
} from './continuum';
import { capture, captureNote, type SourceRange } from './entry-content';
import { canCollectCurrentBlock } from './editor-command';
import { CONTINUUM_VIEW_TYPE, ContinuumView } from './continuum-view';
import { ContinuumSettingTab } from './settings';

type WorkspaceArea = 'left' | 'right' | 'main';

interface ContinuumData extends PersistedContinuum {
	readonly area?: WorkspaceArea;
	readonly automaticBlockIds?: boolean;
}

export class ContinuumController {
	readonly continuum: Continuum;
	automaticBlockIds: boolean;
	private area: WorkspaceArea;
	private recentMarkdownLeaf: WorkspaceLeaf | null = null;

	private constructor(
		private readonly plugin: Plugin,
		saved?: ContinuumData,
	) {
		this.continuum = createContinuum(saved);
		this.area = saved?.area ?? 'right';
		this.automaticBlockIds = saved?.automaticBlockIds === true;
	}

	static async load(plugin: Plugin): Promise<ContinuumController> {
		const saved = (await plugin.loadData()) as ContinuumData | null;
		return new ContinuumController(plugin, saved ?? undefined);
	}

	register(): void {
		this.plugin.addSettingTab(new ContinuumSettingTab(this.plugin.app, this.plugin, this));
		this.plugin.registerView(
			CONTINUUM_VIEW_TYPE,
			(leaf) => new ContinuumView(leaf, this),
		);
		this.plugin.addCommand({
			id: 'focus-continuum',
			name: 'Focus Continuum',
			callback: () => void this.openContinuum(true),
		});
		this.plugin.addCommand({
			id: 'add-current-block-or-selection',
			name: 'Add current block or selection',
			checkCallback: (checking) => {
				const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view?.file || !canCollectCurrentBlock(view.getMode())) return false;
				if (!checking) void this.addCurrentBlock(view);
				return true;
			},
		});
		this.plugin.addCommand({
			id: 'add-current-note',
			name: 'Add current note',
			checkCallback: (checking) => {
				const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view?.file) return false;
				if (!checking) void this.addCurrentNote(view);
				return true;
			},
		});

		this.plugin.registerEvent(
			this.plugin.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf?.view instanceof MarkdownView) this.recentMarkdownLeaf = leaf;
			}),
		);
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('layout-change', () => void this.capturePlacement()),
		);
		this.plugin.registerEvent(
			this.plugin.app.vault.on('modify', (file) => {
				if (
					file instanceof TFile &&
					this.continuum
						.snapshot()
						.entries.some(({ sourcePath }) => sourcePath === file.path)
				) void this.renderViews();
			}),
		);

		this.plugin.app.workspace.onLayoutReady(() => {
			const leaf = this.plugin.app.workspace.getMostRecentLeaf();
			if (leaf?.view instanceof MarkdownView) this.recentMarkdownLeaf = leaf;
		});
	}

	async setAutomaticBlockIds(value: boolean): Promise<void> {
		this.automaticBlockIds = value;
		await this.saveSnapshot();
	}

	async focusEntry(id: string): Promise<void> {
		this.continuum.dispatch({ type: 'focus-entry', id });
		await this.saveSnapshot();
	}

	async openSource(path: string): Promise<void> {
		const file = this.plugin.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;
		const markdownLeaves = this.plugin.app.workspace.getLeavesOfType('markdown');
		const remembered = this.recentMarkdownLeaf;
		const recent = remembered && markdownLeaves.includes(remembered)
			? remembered
			: this.plugin.app.workspace.getMostRecentLeaf();
		const leaf = recent?.view instanceof MarkdownView
			? recent
			: markdownLeaves[0] ?? this.plugin.app.workspace.getLeaf('tab');
		await leaf.openFile(file, {
			active: true,
			state: { mode: 'source', source: false },
		});
		this.recentMarkdownLeaf = leaf;
	}

	private async addCurrentBlock(view: MarkdownView): Promise<void> {
		if (!view.file) return;
		const markdown = view.getViewData();
		const cache = this.plugin.app.metadataCache.getFileCache(view.file);
		const toRange = (position: { start: { line: number; col: number; offset: number }; end: { line: number; col: number; offset: number } }): SourceRange => ({
			start: { line: position.start.line, ch: position.start.col, offset: position.start.offset },
			end: { line: position.end.line, ch: position.end.col, offset: position.end.offset },
		});
		const editor = view.editor;
		const plan = capture({
			markdown,
			cursor: editor.getCursor(),
			selection: editor.somethingSelected()
				? { from: editor.getCursor('from'), to: editor.getCursor('to') }
				: null,
			metadata: {
				path: view.file.path,
				sections: cache?.sections?.map((section) => ({
					type: section.type,
					...(section.id ? { id: section.id } : {}),
					position: toRange(section.position),
				})),
				headings: cache?.headings?.map((heading) => ({
					heading: heading.heading,
					level: heading.level,
					position: toRange(heading.position),
				})),
				listItems: cache?.listItems?.map((item) => ({
					...(item.id ? { id: item.id } : {}),
					parent: item.parent,
					position: toRange(item.position),
				})),
			},
			automaticBlockIds: this.automaticBlockIds,
			generateId: generateBlockId,
			entryId: crypto.randomUUID(),
		});
		if (plan.sourceEdit) {
			editor.replaceRange(
				plan.sourceEdit.replacement,
				plan.sourceEdit.range.from,
				plan.sourceEdit.range.to,
			);
		}
		this.recentMarkdownLeaf = view.leaf;
		const focusedElement = view.containerEl.ownerDocument.activeElement;
		const change = this.continuum.dispatch({ type: 'add-entry', entry: plan.entry });
		await this.presentChange(change.focusedEntry?.id, focusedElement);
	}

	private async addCurrentNote(view: MarkdownView): Promise<void> {
		if (!view.file) return;
		this.recentMarkdownLeaf = view.leaf;
		const focusedElement = view.containerEl.ownerDocument.activeElement;
		const change = this.continuum.dispatch({
			type: 'add-entry',
			entry: captureNote({ id: crypto.randomUUID(), path: view.file.path }),
		});
		await this.presentChange(change.focusedEntry?.id, focusedElement);
	}

	private async presentChange(focusedId: string | undefined, focusedElement: Element | null): Promise<void> {
		await this.saveSnapshot();
		const continuumView = await this.openContinuum(false);
		await this.renderViews();
		if (focusedId) continuumView.focusEntry(focusedId);
		if (focusedElement instanceof HTMLElement) focusedElement.focus();
	}

	private async openContinuum(focus: boolean): Promise<ContinuumView> {
		let [leaf, ...duplicates] = this.plugin.app.workspace.getLeavesOfType(
			CONTINUUM_VIEW_TYPE,
		);
		for (const duplicate of duplicates) duplicate.detach();
		leaf ??= this.createLeaf(this.area);
		if (leaf.view.getViewType() !== CONTINUUM_VIEW_TYPE) {
			await leaf.setViewState({ type: CONTINUUM_VIEW_TYPE, active: focus });
		}
		await this.plugin.app.workspace.revealLeaf(leaf);
		const view = leaf.view as ContinuumView;
		if (focus) {
			const focusedId = this.continuum.snapshot().focusedId;
			if (focusedId) view.focusEntry(focusedId);
			else {
				view.contentEl.tabIndex = -1;
				view.contentEl.focus();
			}
		}
		return view;
	}

	private createLeaf(area: WorkspaceArea): WorkspaceLeaf {
		if (area === 'left') return this.plugin.app.workspace.getLeftLeaf(false) ?? this.plugin.app.workspace.getLeaf('tab');
		if (area === 'right') return this.plugin.app.workspace.getRightLeaf(false) ?? this.plugin.app.workspace.getLeaf('tab');
		return this.plugin.app.workspace.getLeaf('tab');
	}

	private async capturePlacement(): Promise<void> {
		const leaf = this.plugin.app.workspace.getLeavesOfType(CONTINUUM_VIEW_TYPE)[0];
		if (!leaf) return;
		const root = leaf.getRoot();
		const area = root === this.plugin.app.workspace.leftSplit
			? 'left'
			: root === this.plugin.app.workspace.rightSplit
				? 'right'
				: 'main';
		if (area !== this.area) {
			this.area = area;
			await this.saveSnapshot();
		}
	}

	private async renderViews(): Promise<void> {
		await Promise.all(
			this.plugin.app.workspace
				.getLeavesOfType(CONTINUUM_VIEW_TYPE)
				.map((leaf) => (leaf.view as ContinuumView).render()),
		);
	}

	private async saveSnapshot(): Promise<void> {
		await this.plugin.saveData({
			...this.continuum.snapshot(),
			area: this.area,
			automaticBlockIds: this.automaticBlockIds,
		});
	}
}

function generateBlockId(): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from(crypto.getRandomValues(new Uint8Array(6)),
		(value) => alphabet[value % alphabet.length]).join('');
}
