import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import type { ContinuumController } from './continuum-controller';

export class ContinuumSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		plugin: Plugin,
		private readonly controller: ContinuumController,
	) {
		super(app, plugin);
	}

	display(): void {
		this.containerEl.empty();
		new Setting(this.containerEl)
			.setName('Automatically add block IDs')
			.setDesc('Add permanent block IDs to future exact Block captures so they stay Live.')
			.addToggle((toggle) => toggle
				.setValue(this.controller.automaticBlockIds)
				.onChange((value) => this.controller.setAutomaticBlockIds(value)));
	}
}
