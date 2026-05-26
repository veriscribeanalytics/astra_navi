export function getScoreStyle(score: number, t: (k: string) => string) {
  if (score >= 85) {
    return {
      color: 'text-green-600',
      bg: 'bg-green-600/10',
      hex: '#16a34a',
      label: t('horoscope.excellent')
    };
  }
  if (score >= 70) {
    return {
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      hex: '#4ade80',
      label: t('horoscope.good')
    };
  }
  if (score >= 50) {
    return {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      hex: '#eab308',
      label: t('horoscope.fair')
    };
  }
  return {
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    hex: '#ef4444',
    label: t('horoscope.low')
  };
}
