import {
	DEFAULT_BINDINGS,
	PANE_ACTIONS,
	validateBindings,
	type KeyBindings,
	type PaneAction,
} from './pane-keymap';

export interface ContinuumSettings {
	readonly alignmentThreshold: number;
	readonly bindings: KeyBindings;
}

export const THRESHOLD_RANGE = { min: 50, max: 100, step: 5 } as const;

export const DEFAULT_SETTINGS: ContinuumSettings = {
	alignmentThreshold: 80,
	bindings: DEFAULT_BINDINGS,
};

export function normalizeThreshold(value: unknown): number {
	const { min, max, step } = THRESHOLD_RANGE;
	return typeof value === 'number' &&
		value >= min &&
		value <= max &&
		value % step === 0
		? value
		: DEFAULT_SETTINGS.alignmentThreshold;
}

/** Saved settings are user-editable JSON, so anything unusable falls back. */
export function normalizeSettings(saved?: Partial<ContinuumSettings>): ContinuumSettings {
	const bindings: Record<PaneAction, string | null> = { ...DEFAULT_BINDINGS };
	for (const action of PANE_ACTIONS) {
		const binding: unknown = saved?.bindings?.[action];
		if (typeof binding === 'string' || binding === null) bindings[action] = binding;
	}
	return {
		alignmentThreshold: normalizeThreshold(saved?.alignmentThreshold),
		bindings: validateBindings(bindings).valid ? bindings : DEFAULT_BINDINGS,
	};
}
