/**
 * Simple markdown parser for AI responses
 * Converts markdown formatting to HTML
 */

export function parseMarkdown(text: string): string {
  if (!text) return '';

  let html = text;

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (but not inside words)
  html = html.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, '<em>$1</em>');
  html = html.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');

  // Code: `code`
  html = html.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-surface-variant/40 rounded text-secondary text-sm font-mono">$1</code>');

  // Line breaks: Convert \n to <br>
  html = html.replace(/\n/g, '<br>');

  // Lists: - item or * item
  html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li class="ml-4">$1</li>');
  
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[^>]*>.*<\/li>\s*)+/g, '<ul class="list-disc list-inside space-y-1 my-2">$&</ul>');

  // Numbered lists: 1. item
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>');
  
  // Wrap consecutive numbered <li> in <ol>
  html = html.replace(/(<li[^>]*>.*<\/li>\s*)+/g, (match) => {
    if (match.includes('list-disc')) return match; // Already wrapped as <ul>
    return `<ol class="list-decimal list-inside space-y-1 my-2">${match}</ol>`;
  });

  // Headers: ## Header
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-base font-bold text-secondary mt-3 mb-1">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-bold text-secondary mt-4 mb-2">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-xl font-bold text-secondary mt-4 mb-2">$1</h1>');

  // Blockquotes: > text
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="border-l-2 border-secondary/30 pl-3 italic text-on-surface-variant/70 my-2">$1</blockquote>');

  // Horizontal rule: --- or ***
  html = html.replace(/^(---|\*\*\*)$/gm, '<hr class="border-t border-outline-variant/20 my-3">');

  return html;
}

/**
 * Auto-format astrology terms in plain text
 * Adds markdown formatting to zodiac signs, planets, and key terms
 */
export function autoFormatAstrology(text: string): string {
  if (!text) return '';

  let formatted = text;

  // Zodiac signs (Rashi)
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
    'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'
  ];

  // Planets
  const planets = [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
    'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto',
    'Surya', 'Chandra', 'Budha', 'Shukra', 'Mangal', 'Guru', 'Shani'
  ];

  // Houses
  const houses = [
    '1st house', '2nd house', '3rd house', '4th house', '5th house', '6th house',
    '7th house', '8th house', '9th house', '10th house', '11th house', '12th house',
    'first house', 'second house', 'third house', 'fourth house', 'fifth house', 'sixth house',
    'seventh house', 'eighth house', 'ninth house', 'tenth house', 'eleventh house', 'twelfth house'
  ];

  // Key astrology terms
  const terms = [
    'Rashi', 'Lagna', 'Ascendant', 'Nakshatra', 'Dasha', 'Bhukti', 'Antardasha',
    'Mahadasha', 'Yoga', 'Dosha', 'Kundli', 'Horoscope', 'Transit', 'Retrograde',
    'Exalted', 'Debilitated', 'Combust', 'Vargottama'
  ];

  // Bold zodiac signs
  signs.forEach(sign => {
    const regex = new RegExp(`\\b(${sign})\\b`, 'gi');
    formatted = formatted.replace(regex, '**$1**');
  });

  // Bold planets
  planets.forEach(planet => {
    const regex = new RegExp(`\\b(${planet})\\b`, 'gi');
    formatted = formatted.replace(regex, '**$1**');
  });

  // Bold houses
  houses.forEach(house => {
    const regex = new RegExp(`\\b(${house})\\b`, 'gi');
    formatted = formatted.replace(regex, '**$1**');
  });

  // Bold key terms
  terms.forEach(term => {
    const regex = new RegExp(`\\b(${term})\\b`, 'gi');
    formatted = formatted.replace(regex, '**$1**');
  });

  // Bold degrees (e.g., "10°", "25 degrees")
  formatted = formatted.replace(/\b(\d+)°\b/g, '**$1°**');
  formatted = formatted.replace(/\b(\d+)\s+degrees?\b/gi, '**$1 degrees**');

  return formatted;
}

/**
 * Strip markdown formatting (for copying plain text)
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';

  let plain = text;

  // Remove bold
  plain = plain.replace(/\*\*(.+?)\*\*/g, '$1');
  plain = plain.replace(/__(.+?)__/g, '$1');

  // Remove italic
  plain = plain.replace(/\*(.+?)\*/g, '$1');
  plain = plain.replace(/_(.+?)_/g, '$1');

  // Remove code
  plain = plain.replace(/`(.+?)`/g, '$1');

  // Remove headers
  plain = plain.replace(/^#{1,6}\s+/gm, '');

  // Remove list markers
  plain = plain.replace(/^[\-\*]\s+/gm, '• ');
  plain = plain.replace(/^\d+\.\s+/gm, '');

  // Remove blockquote markers
  plain = plain.replace(/^>\s+/gm, '');

  // Remove horizontal rules
  plain = plain.replace(/^(---|\*\*\*)$/gm, '');

  return plain;
}
