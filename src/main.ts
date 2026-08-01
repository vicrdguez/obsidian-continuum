import { MarkdownView, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import {
	createContinuum,
	type Continuum,
	type PersistedContinuum,
} from './continuum';
import { captureNote } from './entry-content';
import { CONTINUUM_VIEW_TYPE, ContinuumView } from './continuum-view';

type WorkspaceArea = 'left' | 'right' | 'main';

interface ContinuumData extends PersistedContinuum {
	readonly area?: WorkspaceArea;
}

export default class ContinuumPlugin extends Plugin {
	continuum!: Continuum;
	private area: WorkspaceArea = 'right';
	private recentMarkdownLeaf: WorkspaceLeaf | null = null;

	async onload(): Promise<void> {
		const saved = (await this.loadData()) as ContinuumData | null;
		this.continuum = createContinuum(saved ?? undefined);
		this.area = saved?.area ?? 'right';

		this.registerView(
			CONTINUUM_VIEW_TYPE,
			(leaf) => new ContinuumView(leaf, this),
		);
		this.addCommand({
			id: 'focus-continuum',
			name: 'Focus Continuum',
			callback: () => void this.openContinuum(true),
		});
		this.addCommand({
			id: 'add-current-note',
			name: 'Add current note',
			checkCallback: (checking) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view?.file) return false;
				if (!checking) void this.addCurrentNote(view);
				return true;
			},
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf?.view instanceof MarkdownView) this.recentMarkdownLeaf = leaf;
			}),
		);
		this.registerEvent(
			this.app.workspace.on('layout-change', () => void this.capturePlacement()),
		);
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (
					file instanceof TFile &&
					this.continuum
						.snapshot()
						.entries.some(({ sourcePath }) => sourcePath === file.path)
				) void this.renderViews();
			}),
		);

		this.app.workspace.onLayoutReady(() => {
			const active = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (active) this.recentMarkdownLeaf = active.leaf;
		});
	}

	async focusEntry(id: string): Promise<void> {
		this.continuum.dispatch({ type: 'focus-entry', id });
		await this.saveSnapshot();
	}

	async openSource(path: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;
		const leaf = this.recentMarkdownLeaf ?? this.app.workspace.getLeaf('tab');
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
		let [leaf, ...duplicates] = this.app.workspace.getLeavesOfType(
			CONTINUUM_VIEW_TYPE,
		);
		for (const duplicate of duplicates) duplicate.detach();
		leaf ??= this.createLeaf(this.area);
		if (leaf.view.getViewType() !== CONTINUUM_VIEW_TYPE) {
			await leaf.setViewState({ type: CONTINUUM_VIEW_TYPE, active: focus });
		}
		await this.app.workspace.revealLeaf(leaf);
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
		if (area === 'left') return this.app.workspace.getLeftLeaf(false) ?? this.app.workspace.getLeaf('tab');
		if (area === 'right') return this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf('tab');
		return this.app.workspace.getLeaf('tab');
	}

	private async capturePlacement(): Promise<void> {
		const leaf = this.app.workspace.getLeavesOfType(CONTINUUM_VIEW_TYPE)[0];
		if (!leaf) return;
		const root = leaf.getRoot();
		const area = root === this.app.workspace.leftSplit
			? 'left'
			: root === this.app.workspace.rightSplit
				? 'right'
				: 'main';
		if (area !== this.area) {
			this.area = area;
			await this.saveSnapshot();
		}
	}

	private async renderViews(): Promise<void> {
		await Promise.all(
			this.app.workspace
				.getLeavesOfType(CONTINUUM_VIEW_TYPE)
				.map((leaf) => (leaf.view as ContinuumView).render()),
		);
	}

	private async saveSnapshot(): Promise<void> {
		await this.saveData({ ...this.continuum.snapshot(), area: this.area });
	}
}
