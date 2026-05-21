export const TONE_COLOR: Record<string, string> = {
  neutral: '#94a3b8',
  positive: '#22c55e',
  challenging: '#ef4444',
  steady: '#3b82f6',
  buoyant: '#f59e0b',
  charged: '#a855f7',
};

export const TONE_LABEL_KEY: Record<string, string> = {
  neutral: 'forecast.toneNeutral',
  positive: 'forecast.tonePositive',
  challenging: 'forecast.toneChallenging',
  steady: 'forecast.toneSteady',
  buoyant: 'forecast.toneBuoyant',
  charged: 'forecast.toneCharged',
};

export function resolveTone(tone: string | undefined, fallbackHex: string) {
  if (!tone) return { color: fallbackHex, labelKey: '' };
  return {
    color: TONE_COLOR[tone] || fallbackHex,
    labelKey: TONE_LABEL_KEY[tone] || '',
  };
}
