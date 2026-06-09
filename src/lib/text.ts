// Small string helpers shared across the app.

/**
 * Truncate `value` to at most `max` Unicode code points without splitting a
 * character.
 *
 * `String.prototype.slice` counts UTF-16 code units, so slicing through an
 * astral-plane character such as the money emoji 💰 (a surrogate pair) at the
 * boundary leaves a lone surrogate like "\ud83d" — an invalid string the chat
 * backend rejects with a 422. `Array.from` iterates by code point, keeping
 * surrogate pairs intact, so the worst case is a clean cut between characters.
 */
export function truncateCodePoints(value: string, max: number): string {
  if (max <= 0 || !value) return '';
  return Array.from(value).slice(0, max).join('');
}
