import { Notice, Plugin, PluginSettingTab, Setting, type TextComponent } from 'obsidian';
import type { ContinuumController } from './continuum-controller';
import {
	DEFAULT_BINDINGS,
	describeKey,
	PANE_ACTIONS,
	RESERVED_KEY,
	RESERVED_MESSAGE,
	validateBindings,
	type PaneAction,
} from './pane-keymap';
import { THRESHOLD_RANGE } from './settings';

const ACTION_NAMES: Record<PaneAction, string> = {
	next: 'Next entry',
	previous: 'Previous entry',
	'open-source': 'Open source',
	'toggle-fold': 'Fold entry',
};

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta']);

export class ContinuumSettingTab extends PluginSettingTab {
	constructor(plugin: Plugin, private readonly controller: ContinuumController) {
		super(plugin.app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Alignment threshold')
			.setDesc(
				'Entries at or above this share of the pane height align to the top. Shorter entries are centered.',
			)
			.addSlider((slider) =>
				slider
					.setLimits(THRESHOLD_RANGE.min, THRESHOLD_RANGE.max, THRESHOLD_RANGE.step)
					.setValue(this.controller.settings.alignmentThreshold)
					.setDynamicTooltip()
					.onChange((alignmentThreshold) => {
						this.controller.saveSettings({ alignmentThreshold });
					}),
			);

		new Setting(containerEl)
			.setName('Pane keys')
			.setDesc(
				'Active only while Continuum has focus. Select a field and press a key to bind it, or press Backspace to clear it.',
			)
			.setHeading();

		for (const action of PANE_ACTIONS) {
			new Setting(containerEl).setName(ACTION_NAMES[action]).addText((text) => {
				text
					.setPlaceholder('Disabled')
					.setValue(this.controller.settings.bindings[action] ?? '');
				text.inputEl.addEventListener('keydown', (event) => {
					this.capture(event, action, text);
				});
			});
		}

		new Setting(containerEl).addButton((button) =>
			button.setButtonText('Restore defaults').onClick(() => {
				this.controller.saveSettings({ bindings: DEFAULT_BINDINGS });
				this.display();
			}),
		);
	}

	private capture(event: KeyboardEvent, action: PaneAction, text: TextComponent): void {
		if (MODIFIER_KEYS.has(event.key)) return;
		// Tab is never captured, so it keeps moving focus out of the field.
		if (event.key === RESERVED_KEY) {
			new Notice(RESERVED_MESSAGE);
			return;
		}
		event.preventDefault();

		const current = this.controller.settings.bindings;
		const cleared = event.key === 'Backspace' || event.key === 'Delete';
		const binding = cleared ? null : describeKey(event);
		const bindings = { ...current, [action]: binding };
		const result = validateBindings(bindings);
		if (!result.valid) {
			new Notice(result.message);
			text.setValue(current[action] ?? '');
			return;
		}

		text.setValue(binding ?? '');
		this.controller.saveSettings({ bindings });
	}
}
