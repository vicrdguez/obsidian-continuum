/**
 * Short entries read best centered; an entry at or above the threshold share of
 * the viewport is top-aligned so its beginning stays visible.
 */
export function entryAlignment(
	entryHeight: number,
	viewportHeight: number,
	thresholdPercent: number,
): 'center' | 'start' {
	return entryHeight >= (viewportHeight * thresholdPercent) / 100 ? 'start' : 'center';
}
