export interface Point {
  x: number;
  y: number;
}

/**
 * Converts an array of points into a smooth SVG path using Catmull-Rom to Cubic Bezier conversion.
 * 
 * @param points Array of {x, y} coordinate objects
 * @param tension Curve tightness (0 = sharp lines, 1 = very loose curves, default = 0.3)
 * @returns SVG path string (e.g., "M 0 50 C 10 50 20 40 30 40 ...")
 */
export function catmullRomToBezier(points: Point[], tension: number = 0.3): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : p2;

    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;

    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

/**
 * Builds a closed area path: baseline → smooth curve → baseline close.
 * 
 * @param points Array of {x, y} coordinate objects
 * @param baseY The Y coordinate of the baseline to close the area path to
 * @param tension Curve tightness
 * @returns SVG path string for a filled area
 */
export function catmullRomArea(points: Point[], baseY: number, tension: number = 0.3): string {
  if (points.length === 0) return '';
  const curvePath = catmullRomToBezier(points, tension);
  // Add lines to bottom right, bottom left, and close path
  return `${curvePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
}
