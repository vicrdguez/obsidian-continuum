import { MarkdownView, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import {
	createContinuum,
	type Continuum,
	type ContinuumAction,
	type ContinuumChange,
	type PersistedContinuum,
} from './continuum';
import { captureNote } from './entry-content';
import { CONTINUUM_VIEW_TYPE, ContinuumView } from './continuum-view';
import type { PaneAction } from './pane-keymap';
import {
	normalizeSettings,
	type ContinuumSettings,
} from './settings';
import { ContinuumSettingTab } from './settings-tab';

type WorkspaceArea = 'left' | 'right' | 'main';

interface ContinuumData extends PersistedContinuum {
	readonly area?: WorkspaceArea;
	readonly settings?: Partial<ContinuumSettings>;
}

export class ContinuumController {
	readonly continuum: Continuum;
	settings: ContinuumSettings;
	private area: WorkspaceArea;
	private recentMarkdownLeaf: WorkspaceLeaf | null = null;

	private constructor(
		private readonly plugin: Plugin,
		saved?: ContinuumData,
	) {
		this.continuum = createContinuum(saved);
		this.settings = normalizeSettings(saved?.settings);
		this.area = saved?.area ?? 'right';
	}

	static async load(plugin: Plugin): Promise<ContinuumController> {
		const saved = (await plugin.loadData()) as ContinuumData | null;
		return new ContinuumController(plugin, saved ?? undefined);
	}

	register(): void {
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
			id: 'next-entry',
			name: 'Focus next entry',
			checkCallback: (checking) => this.whenOpen(checking, () => this.navigate('focus-next')),
		});
		this.plugin.addCommand({
			id: 'previous-entry',
			name: 'Focus previous entry',
			checkCallback: (checking) =>
				this.whenOpen(checking, () => this.navigate('focus-previous')),
		});
		this.plugin.addCommand({
			id: 'toggle-all-folds',
			name: 'Fold or unfold all entries',
			checkCallback: (checking) => this.whenOpen(checking, () => this.toggleAllFolds()),
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
		this.plugin.addSettingTab(new ContinuumSettingTab(this.plugin, this));

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

	async focusEntry(id: string): Promise<void> {
		await this.apply({ type: 'focus-entry', id });
	}

	async toggleFold(id: string): Promise<void> {
		await this.apply({ type: 'toggle-fold', id });
	}

	async toggleAllFolds(): Promise<void> {
		await this.apply({ type: 'toggle-all-folds' });
	}

	async navigate(direction: 'focus-next' | 'focus-previous'): Promise<void> {
		const { focusedEntry } = await this.apply({ type: direction });
		if (focusedEntry) for (const view of this.views()) view.focusEntry(focusedEntry.id);
	}

	async runPaneAction(action: PaneAction, entryId: string): Promise<void> {
		if (action === 'next') return this.navigate('focus-next');
		if (action === 'previous') return this.navigate('focus-previous');
		if (action === 'toggle-fold') return this.toggleFold(entryId);
		const entry = this.continuum
			.snapshot()
			.entries.find(({ id }) => id === entryId);
		if (entry) await this.openSource(entry.sourcePath);
	}

	async saveSettings(patch: Partial<ContinuumSettings>): Promise<void> {
		this.settings = { ...this.settings, ...patch };
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

	private async addCurrentNote(view: MarkdownView): Promise<void> {
		if (!view.file) return;
		this.recentMarkdownLeaf = view.leaf;
		const focusedElement = view.containerEl.ownerDocument.activeElement;
		const change = this.continuum.dispatch({
			type: 'add-entry',
			entry: captureNote({ id: crypto.randomUUID(), path: view.file.path }),
		});
		await this.saveSnapshot();
		const continuumView = await this.openContinuum(false);
		await this.renderViews();
		if (change.focusedEntry) {
			continuumView.focusEntry(change.focusedEntry.id);
			if (focusedElement instanceof HTMLElement) focusedElement.focus();
		}
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

	private whenOpen(checking: boolean, run: () => Promise<void>): boolean {
		if (this.views().length === 0) return false;
		if (!checking) void run();
		return true;
	}

	private async apply(action: ContinuumAction): Promise<ContinuumChange> {
		const change = this.continuum.dispatch(action);
		await this.saveSnapshot();
		for (const view of this.views()) view.syncState();
		return change;
	}

	private views(): ContinuumView[] {
		return this.plugin.app.workspace
			.getLeavesOfType(CONTINUUM_VIEW_TYPE)
			.map((leaf) => leaf.view as ContinuumView);
	}

	private async renderViews(): Promise<void> {
		await Promise.all(this.views().map((view) => view.render()));
	}

	private async saveSnapshot(): Promise<void> {
		await this.plugin.saveData({
			...this.continuum.snapshot(),
			area: this.area,
			settings: this.settings,
		} satisfies ContinuumData);
	}
}
