/**
 * cosmicField — the Layer-1 canvas engine for the 7.2s intro.
 *
 * Strictly sequential animation story:
 *   1. Center glare only
 *   2. Solar system expands outward from center
 *   3. Solar system morphs into zodiac/rashi wheel
 *   4. Brand reveal (logo forms from center light)
 *   5. Hero text
 *   6. Handoff to landing page
 *
 * Every visual is driven by a plain `state` object whose numeric fields
 * GSAP tweens from the master timeline. The same loop positions DOM
 * planet/rashi sprites on the exact ellipses drawn on canvas.
 */

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

export interface CosmicState {
    glare: number;
    starGlow: number;
    solarExpand: number;
    morphToZodiac: number;
    rashiReveal: number;
    brandReveal: number;
    textReveal: number;
    handoff: number;
    particles: number;
    spin: number;
    nebula: number;
    zoom: number;
    fade: number;
}

export interface Orbiter {
    el: HTMLElement | null;
    orbit: number;
    angle: number;
    speed: number;
    tilt: number;
    enter: number;
}

export interface CosmicField {
    state: CosmicState;
    planets: Orbiter[];
    rashi: Orbiter[];
    start: () => void;
    stop: () => void;
    resize: () => void;
}

interface FieldOpts {
    planets: { orbit: number; angle: number; speed: number }[];
    rashiCount: number;
    reduced: boolean;
    lite: boolean;
}


const GOLD = '214, 163, 37';
const GOLD_HI = '244, 194, 83';
const PURPLE_DEEP = '59, 19, 107';
const PURPLE_MID = '91, 33, 182';
const PURPLE_LIGHT = '124, 58, 237';
const IVORY = '248, 241, 223';
const PLANET_TILT = 0.42;

export function createCosmicField(canvas: HTMLCanvasElement, opts: FieldOpts): CosmicField {
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

    const state: CosmicState = {
        glare: 0, starGlow: 0, solarExpand: 0, morphToZodiac: 0,
        rashiReveal: 0, brandReveal: 0, textReveal: 0, handoff: 0,
        particles: 0, spin: 0, nebula: 0, zoom: 1, fade: 1,
    };

    let w = 0, h = 0, cx = 0, cy = 0, R = 0;

    const planets: Orbiter[] = opts.planets.map((p) => ({
        el: null, orbit: p.orbit, angle: p.angle, speed: p.speed * 0.45, tilt: PLANET_TILT, enter: 0,
    }));

    const rashi: Orbiter[] = Array.from({ length: opts.rashiCount }, (_, i) => ({
        el: null,
        orbit: 1.18,
        angle: (i / opts.rashiCount) * Math.PI * 2 - Math.PI / 2,
        speed: 0.036,
        tilt: 1,
        enter: 0,
    }));

    function seed() {
    }

    function resize() {
        w = canvas.clientWidth || window.innerWidth;
        h = canvas.clientHeight || window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = w / 2;
        cy = h / 2;
        R = Math.min(w, h) * 0.34;
        seed();
    }

    function positionOrbiters() {
        const currentTilt = lerp(PLANET_TILT, 1.0, state.morphToZodiac);

        for (const o of planets) {
            if (!o.el) continue;
            const rad = R * o.orbit * state.solarExpand * state.zoom;
            const a = o.angle + state.spin * o.speed;
            const x = cx + Math.cos(a) * rad;
            const y = cy + Math.sin(a) * rad * currentTilt;
            const s = (0.88 + 0.12 * o.enter) * state.zoom;
            const blurPx = Math.max(0, (1 - o.enter) * 3);
            const goldGlow = o.enter * 0.35;
            const purpleGlow = o.enter * 0.18;
            o.el.style.transform =
                `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${s.toFixed(3)})`;
            o.el.style.opacity = (o.enter * state.fade).toFixed(3);
            o.el.style.filter =
                `blur(${blurPx.toFixed(1)}px) drop-shadow(0 0 10px rgba(244,194,83,${goldGlow.toFixed(2)})) drop-shadow(0 0 22px rgba(124,58,237,${purpleGlow.toFixed(2)}))`;
        }

        for (const o of rashi) {
            if (!o.el) continue;
            const rad = R * o.orbit * state.zoom;
            const a = o.angle + state.spin * o.speed;
            const x = cx + Math.cos(a) * rad;
            const y = cy + Math.sin(a) * rad;
            const s = (0.88 + 0.12 * o.enter) * state.zoom;
            const blurPx = Math.max(0, (1 - o.enter) * 3);
            const goldGlow = o.enter * 0.35;
            const purpleGlow = o.enter * 0.18;
            o.el.style.transform =
                `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${s.toFixed(3)})`;
            o.el.style.opacity = (o.enter * state.fade).toFixed(3);
            o.el.style.filter =
                `blur(${blurPx.toFixed(1)}px) drop-shadow(0 0 10px rgba(244,194,83,${goldGlow.toFixed(2)})) drop-shadow(0 0 22px rgba(124,58,237,${purpleGlow.toFixed(2)}))`;
        }
    }

    function drawBackgroundGradient() {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#07051A');
        g.addColorStop(0.5, '#050716');
        g.addColorStop(1, '#090B22');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    }

    function drawNebula() {
        if (state.nebula <= 0) return;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const blobs = [
            { x: cx - R * 1.4, y: cy - R * 1.1, s: R * 2.4, a: 0.22, c: PURPLE_DEEP },
            { x: cx + R * 1.5, y: cy + R * 1.2, s: R * 2.2, a: 0.18, c: PURPLE_MID },
            { x: cx + R * 1.2, y: cy - R * 1.4, s: R * 1.8, a: 0.14, c: PURPLE_DEEP },
        ];
        for (const b of blobs) {
            const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.s);
            g.addColorStop(0, `rgba(${b.c}, ${(b.a * state.nebula).toFixed(3)})`);
            g.addColorStop(1, `rgba(${b.c}, 0)`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();
    }

    function drawOrbitRings() {
        if (state.solarExpand <= 0) return;
        const ringOpacity = state.solarExpand * (1 - smoothstep(0.3, 0.85, state.morphToZodiac));
        if (ringOpacity <= 0.01) return;

        const currentTilt = lerp(PLANET_TILT, 1.0, state.morphToZodiac);
        ctx.save();
        ctx.lineWidth = 1;
        for (const p of planets) {
            const rx = R * p.orbit * state.solarExpand;
            const ry = rx * currentTilt;
            const g = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
            g.addColorStop(0, `rgba(${GOLD}, 0)`);
            g.addColorStop(0.5, `rgba(${GOLD_HI}, ${(0.55 * ringOpacity).toFixed(3)})`);
            g.addColorStop(1, `rgba(${GOLD}, 0)`);
            ctx.strokeStyle = g;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, state.spin * 0.02, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawZodiacRing() {
        const zodiacOpacity = smoothstep(0.35, 1.0, state.morphToZodiac);
        if (zodiacOpacity <= 0.01) return;
        const rr = R * 1.18;
        ctx.save();
        ctx.globalAlpha = zodiacOpacity;
        ctx.strokeStyle = `rgba(${GOLD_HI}, 0.35)`;
        ctx.lineWidth = 1;
        for (const f of [0.86, 1, 1.12]) {
            ctx.beginPath();
            ctx.arc(cx, cy, rr * f, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.strokeStyle = `rgba(${GOLD}, 0.3)`;
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + state.spin * 0.027;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * rr * 0.86, cy + Math.sin(a) * rr * 0.86);
            ctx.lineTo(cx + Math.cos(a) * rr * 1.12, cy + Math.sin(a) * rr * 1.12);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawCenterStar() {
        if (state.glare <= 0 && state.starGlow <= 0) return;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const bloom = R * (0.55 + 0.45 * state.starGlow);
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloom);
        bg.addColorStop(0, `rgba(${GOLD_HI}, ${(0.40 * state.starGlow).toFixed(3)})`);
        bg.addColorStop(0.25, `rgba(${GOLD}, ${(0.20 * state.starGlow).toFixed(3)})`);
        bg.addColorStop(0.6, `rgba(${PURPLE_DEEP}, ${(0.08 * state.starGlow).toFixed(3)})`);
        bg.addColorStop(1, `rgba(${PURPLE_DEEP}, 0)`);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const core = 3 + 14 * state.glare;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, core);
        cg.addColorStop(0, `rgba(${IVORY}, ${state.glare.toFixed(3)})`);
        cg.addColorStop(0.5, `rgba(${GOLD_HI}, ${(0.85 * state.glare).toFixed(3)})`);
        cg.addColorStop(1, `rgba(${GOLD}, 0)`);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy, core, 0, Math.PI * 2);
        ctx.fill();

        const ray = core * (2.0 + state.starGlow * 0.8);
        ctx.strokeStyle = `rgba(${IVORY}, ${(0.35 * state.glare).toFixed(3)})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * ray, cy + Math.sin(a) * ray);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawBrandFlare() {
        if (state.brandReveal <= 0) return;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const flareR = R * (0.6 + 1.2 * state.brandReveal);
        const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, flareR);
        fg.addColorStop(0, `rgba(${GOLD_HI}, ${(0.45 * state.brandReveal).toFixed(3)})`);
        fg.addColorStop(0.15, `rgba(${GOLD}, ${(0.25 * state.brandReveal).toFixed(3)})`);
        fg.addColorStop(0.4, `rgba(${PURPLE_MID}, ${(0.10 * state.brandReveal).toFixed(3)})`);
        fg.addColorStop(1, `rgba(${PURPLE_DEEP}, 0)`);
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, w, h);

        const floorW = R * 1.4 * state.brandReveal;
        const floorH = R * 0.16 * state.brandReveal;
        const floorG = ctx.createRadialGradient(cx, cy, 0, cx, cy, floorW);
        floorG.addColorStop(0, `rgba(${GOLD_HI}, ${(0.25 * state.brandReveal).toFixed(3)})`);
        floorG.addColorStop(0.5, `rgba(${GOLD}, ${(0.08 * state.brandReveal).toFixed(3)})`);
        floorG.addColorStop(1, `rgba(${GOLD}, 0)`);
        ctx.fillStyle = floorG;
        ctx.save();
        ctx.scale(1, floorH / floorW);
        ctx.beginPath();
        ctx.arc(cx, cy * (floorW / floorH), floorW, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    function drawLightColumn() {
        if (state.brandReveal <= 0.3) return;
        const progress = Math.min(1, (state.brandReveal - 0.3) / 0.7);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const colWidth = R * 0.07 * progress;
        const colHeight = R * 0.8 * progress;
        const cg = ctx.createLinearGradient(cx, cy, cx, cy - colHeight);
        cg.addColorStop(0, `rgba(${GOLD_HI}, ${(0.15 * progress).toFixed(3)})`);
        cg.addColorStop(0.35, `rgba(${GOLD}, ${(0.06 * progress).toFixed(3)})`);
        cg.addColorStop(1, `rgba(${GOLD}, 0)`);
        ctx.fillStyle = cg;

        ctx.beginPath();
        ctx.moveTo(cx - colWidth, cy);
        ctx.lineTo(cx - colWidth * 0.3, cy - colHeight);
        ctx.lineTo(cx + colWidth * 0.3, cy - colHeight);
        ctx.lineTo(cx + colWidth, cy);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    let raf = 0;
    let running = false;
    let last = 0;

    function frame(now: number) {
        if (!running) return;
        if (!last) last = now;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        if (!opts.reduced) state.spin += dt * 0.08;

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.globalAlpha = state.fade;

        ctx.translate(cx, cy);
        ctx.scale(state.zoom, state.zoom);
        ctx.translate(-cx, -cy);

        drawBackgroundGradient();
        drawNebula();
        drawOrbitRings();
        drawZodiacRing();
        drawCenterStar();
        drawBrandFlare();
        drawLightColumn();

        ctx.restore();

        positionOrbiters();
        raf = requestAnimationFrame(frame);
    }

    function start() {
        if (running) return;
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
    }

    resize();

    return { state, planets, rashi, start, stop, resize };
}