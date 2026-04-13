/**
 * Parse chart context to extract zodiac signs and key information
 */

export interface RashiSigns {
  sunSign: string | null;
  moonSign: string | null;
  ascendant: string | null;
}

/**
 * Extract Sun and Moon signs from chart context
 */
export function extractRashiSigns(chartContext: string | null | undefined): RashiSigns {
  if (!chartContext) {
    return {
      sunSign: null,
      moonSign: null,
      ascendant: null,
    };
  }

  let sunSign: string | null = null;
  let moonSign: string | null = null;
  let ascendant: string | null = null;

  try {
    // Extract Sun sign
    const sunMatch = chartContext.match(/Sun:\s*(\w+)/i);
    if (sunMatch) {
      sunSign = sunMatch[1];
    }

    // Extract Moon sign (Rashi)
    const moonMatch = chartContext.match(/Moon:\s*(\w+)/i);
    if (moonMatch) {
      moonSign = moonMatch[1];
    }

    // Extract Ascendant (Lagna) - check multiple patterns
    const lagnaMatch = chartContext.match(/Lagna:\s*(\w+)/i) || 
                       chartContext.match(/House\s*1\s*\((\w+)\)/i);
    if (lagnaMatch) {
      ascendant = lagnaMatch[1];
    }
  } catch (error) {
    console.error('Error parsing chart context:', error);
  }

  return {
    sunSign,
    moonSign,
    ascendant,
  };
}

/**
 * Get zodiac sign emoji
 */
export function getZodiacEmoji(sign: string | null): string {
  if (!sign) return '✦';

  const emojiMap: Record<string, string> = {
    aries: '♈',
    taurus: '♉',
    gemini: '♊',
    cancer: '♋',
    leo: '♌',
    virgo: '♍',
    libra: '♎',
    scorpio: '♏',
    sagittarius: '♐',
    capricorn: '♑',
    aquarius: '♒',
    pisces: '♓',
  };

  return emojiMap[sign.toLowerCase()] || '✦';
}

/**
 * Format rashi display text
 */
export function formatRashiDisplay(sunSign: string | null, moonSign: string | null): string {
  if (!sunSign && !moonSign) return 'Complete your profile';
  
  const parts: string[] = [];
  
  if (sunSign) {
    parts.push(`${getZodiacEmoji(sunSign)} ${sunSign} Sun`);
  }
  
  if (moonSign) {
    parts.push(`${getZodiacEmoji(moonSign)} ${moonSign} Moon`);
  }
  
  return parts.join(' · ');
}
