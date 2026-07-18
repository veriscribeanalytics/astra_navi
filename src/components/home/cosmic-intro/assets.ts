/**
 * Asset map for the 4-second cosmic intro.
 *
 * Everything here is wired DIRECTLY to whatever already lives in /public — no
 * restructuring, no waiting on final art. When a real asset is missing the UI
 * falls back to a pure CSS / unicode rendering so development is never blocked:
 *
 *   planets  -> /public/icons/planets/*.png   (fallback: colored gradient orb)
 *   rashi    -> /public/icons/rashi/*.png      (fallback: unicode zodiac glyph)
 *   logo     -> none yet                        (fallback: inline gold "sun" SVG)
 *   phone    -> none yet                        (the real <HeroSection/> phone is
 *                                                revealed underneath at t=3.0s)
 *   cosmic   -> /public/animation/*.jpeg exist  (NOT used — canvas draws the
 *                                                midnight-blue + purple nebula)
 *
 * If a PNG fails to load at runtime, <img onError> swaps in the fallback, so a
 * deleted/renamed file degrades gracefully instead of showing a broken image.
 */

export interface PlanetAsset {
    /** Public path to the PNG (may 404 — fallback covers it). */
    src: string;
    /** Fallback gradient used if the PNG is missing. */
    gradient: string;
    /** Relative orbit radius (0..1 of the scene half-size). */
    orbit: number;
    /** Starting angle in radians. */
    angle: number;
    /** Angular speed multiplier (some planets drift faster). */
    speed: number;
    /** Rendered size in px (scaled by DPR/zoom at runtime). */
    size: number;
}

/** Planets that orbit the central star (1.5s–2.0s of the timeline). */
export const PLANETS: PlanetAsset[] = [
    { src: '/icons/planets/mercury.png', gradient: 'radial-gradient(circle at 35% 30%, #d9c4a8, #8a6f4f)', orbit: 0.30, angle: 0.4, speed: 1.4, size: 34 },
    { src: '/icons/planets/venus.png', gradient: 'radial-gradient(circle at 35% 30%, #f0d59a, #b07b2e)', orbit: 0.46, angle: 2.1, speed: 1.0, size: 46 },
    { src: '/icons/planets/mars.png', gradient: 'radial-gradient(circle at 35% 30%, #e08a5a, #9c3b1f)', orbit: 0.62, angle: 3.7, speed: 0.8, size: 42 },
    { src: '/icons/planets/jupiter.png', gradient: 'radial-gradient(circle at 35% 30%, #e8cda0, #a9763f)', orbit: 0.80, angle: 5.2, speed: 0.55, size: 64 },
    { src: '/icons/planets/saturn.png', gradient: 'radial-gradient(circle at 35% 30%, #e6d3a3, #9c7f4a)', orbit: 0.98, angle: 0.9, speed: 0.42, size: 70 },
    { src: '/icons/planets/moon.png', gradient: 'radial-gradient(circle at 35% 30%, #e8e8ee, #9a9aa6)', orbit: 0.38, angle: 4.6, speed: 1.2, size: 28 },
];

export interface RashiAsset {
    src: string;
    /** Unicode zodiac glyph fallback. */
    glyph: string;
    name: string;
}

/** Zodiac order, clockwise from Aries (2.0s–2.5s of the timeline). */
export const RASHIS: RashiAsset[] = [
    { src: '/icons/rashi/aries.png', glyph: '♈', name: 'Aries' },
    { src: '/icons/rashi/taurus.png', glyph: '♉', name: 'Taurus' },
    { src: '/icons/rashi/gemini.png', glyph: '♊', name: 'Gemini' },
    { src: '/icons/rashi/cancer.png', glyph: '♋', name: 'Cancer' },
    { src: '/icons/rashi/leo.png', glyph: '♌', name: 'Leo' },
    { src: '/icons/rashi/virgo.png', glyph: '♍', name: 'Virgo' },
    { src: '/icons/rashi/libra.png', glyph: '♎', name: 'Libra' },
    { src: '/icons/rashi/scorpio.png', glyph: '♏', name: 'Scorpio' },
    { src: '/icons/rashi/sagittarius.png', glyph: '♐', name: 'Sagittarius' },
    { src: '/icons/rashi/capricorn.png', glyph: '♑', name: 'Capricorn' },
    { src: '/icons/rashi/aquarius.png', glyph: '♒', name: 'Aquarius' },
    { src: '/icons/rashi/pisces.png', glyph: '♓', name: 'Pisces' },
];

/** Session cookie shared by all tabs — intro plays once per browser session. */
export const INTRO_SEEN_KEY = 'astramitra_intro_seen_v3';
