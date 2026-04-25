/**
 * Color Utilities
 * Functions for resolving and manipulating colors, including CSS variables
 */

/**
 * Resolves a CSS color string to a hex or RGB value.
 * Handles hex, rgb, rgba, and CSS variables like var(--primary).
 * @param color - The color string to resolve
 * @returns The resolved color string (hex or rgb)
 */
export function resolveCSSColor(color: string): string {
  if (typeof window === 'undefined') return color;
  if (!color) return '#ffffff';

  // If it's a CSS variable, resolve it
  if (color.startsWith('var(')) {
    const varName = color.match(/var\((--[^,)]+)/)?.[1];
    if (varName) {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (value) return resolveCSSColor(value); // Recursive in case of variables pointing to variables
    }
  }

  return color;
}

/**
 * Converts a hex or RGB color to normalized [r, g, b] array (0-1)
 * @param color - The color string to convert
 * @returns [r, g, b] array
 */
export function colorToRgb(color: string): [number, number, number] {
  const resolved = resolveCSSColor(color);
  
  // Handle Hex
  if (resolved.startsWith('#')) {
    let hex = resolved.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const int = parseInt(hex, 16);
    return [
      ((int >> 16) & 255) / 255,
      ((int >> 8) & 255) / 255,
      (int & 255) / 255
    ];
  }
  
  // Handle RGB/RGBA
  const rgbMatch = resolved.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]) / 255,
      parseInt(rgbMatch[2]) / 255,
      parseInt(rgbMatch[3]) / 255
    ];
  }

  return [1, 1, 1]; // Fallback to white
}
