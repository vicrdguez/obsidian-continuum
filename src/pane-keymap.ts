export type PaneAction = 'next' | 'previous' | 'open-source' | 'toggle-fold';

/** A binding is the `describeKey` form of one key press, or `null` when disabled. */
export type KeyBindings = Readonly<Record<PaneAction, string | null>>;

export type ValidationResult =
	| { readonly valid: true }
	| { readonly valid: false; readonly message: string };

export interface KeyDescriptor {
	readonly key: string;
	readonly ctrlKey?: boolean;
	readonly metaKey?: boolean;
	readonly altKey?: boolean;
	readonly shiftKey?: boolean;
}

export const PANE_ACTIONS: readonly PaneAction[] = [
	'next',
	'previous',
	'open-source',
	'toggle-fold',
];

export const DEFAULT_BINDINGS: KeyBindings = {
	next: 'j',
	previous: 'k',
	'open-source': 'Enter',
	'toggle-fold': 'Space',
};

/** Reserved for native keyboard traversal, so it can never be bound. */
const RESERVED = 'Tab';

export function describeKey(event: KeyDescriptor): string {
	const key = event.key === ' ' ? 'Space' : event.key.toLowerCase();
	return [
		...(event.ctrlKey ? ['Ctrl'] : []),
		...(event.metaKey ? ['Meta'] : []),
		...(event.altKey ? ['Alt'] : []),
		...(event.shiftKey ? ['Shift'] : []),
		event.key.length === 1 ? key : event.key,
	].join('+');
}

export function validateBindings(bindings: KeyBindings): ValidationResult {
	const seen = new Set<string>();
	for (const action of PANE_ACTIONS) {
		const binding = bindings[action];
		if (binding === null) continue;
		if (binding === RESERVED || binding.endsWith(`+${RESERVED}`)) {
			return { valid: false, message: `${RESERVED} is reserved for keyboard navigation.` };
		}
		if (seen.has(binding)) {
			return { valid: false, message: `${binding} is already used by another action.` };
		}
		seen.add(binding);
	}
	return { valid: true };
}

export function resolveKey(
	event: KeyDescriptor,
	bindings: KeyBindings,
): PaneAction | null {
	if (event.key === RESERVED) return null;
	const pressed = describeKey(event);
	return PANE_ACTIONS.find((action) => bindings[action] === pressed) ?? null;
}
