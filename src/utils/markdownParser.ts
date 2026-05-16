import hljs from 'highlight.js/lib/common';

export function parseMarkdown(text: string): string {
  if (!text) return '';

  let html = text;

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    let highlighted: string;
    try {
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(code, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(code).value;
      }
    } catch {
      highlighted = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
    const copyBtn = '<button class="code-copy-btn" data-action="copy-code">Copy</button>';
    return `<div class="code-block-wrapper">${langLabel}${copyBtn}<pre class="code-block"><code class="hljs language-${lang || 'plaintext'}">${highlighted}</code></pre></div>`;
  });

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  html = html.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, '<em>$1</em>');
  html = html.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');

  html = html.replace(/`(.+?)`/g, '<code class="inline-code">$1</code>');

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, linkText, url) => {
    const isExternal = url.startsWith('http');
    const icon = isExternal ? ' <svg class="md-link-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' : '';
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="md-link">${linkText}${icon}</a>`;
  });

  html = html.replace(/\n/g, '<br>');

  html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li class="md-li">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\s*(?:<br>)?)+/g, '<ul class="md-ul">$&</ul>');

  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="md-li-ordered">$1</li>');
  html = html.replace(/(<li[^>]*class="md-li-ordered"[^>]*>.*<\/li>\s*(?:<br>)?)+/g, '<ol class="md-ol">$&</ol>');

  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="md-h1">$1</h1>');

  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

  html = html.replace(/^(---|\*\*\*)$/gm, '<hr class="md-hr">');

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
