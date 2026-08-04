// DEBT(#9/W6): thin wrapper over one comparison, kept only so the Reading-view
// availability rule stays testable without the `obsidian` runtime. Inline it once
// the command's own checkCallback is directly testable.
export function canCollectCurrentBlock(mode: 'source' | 'preview'): boolean {
	return mode === 'source';
}
