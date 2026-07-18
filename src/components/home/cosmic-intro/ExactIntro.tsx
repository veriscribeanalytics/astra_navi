'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './ExactIntro.module.css';

type CssVars = React.CSSProperties & Record<`--${string}`, string>;

const r = (v: number) => Math.round(v * 10000) / 10000;

const PLANETS = [
  { name: 'Moon', src: '/icons/planets/moon.png', fallback: '\u263d', orbitW: 270, orbitH: 105, start: 148, size: 28, c1: '#ddd7ff', c2: '#251257' },
  { name: 'Mercury', src: '/icons/planets/mercury.png', fallback: '\u263f', orbitW: 350, orbitH: 136, start: 276, size: 30, c1: '#d1844f', c2: '#3b1d75' },
  { name: 'Venus', src: '/icons/planets/venus.png', fallback: '\u2640', orbitW: 430, orbitH: 168, start: 70, size: 40, c1: '#e8b36b', c2: '#441253' },
  { name: 'Mars', src: '/icons/planets/mars.png', fallback: '\u2642', orbitW: 510, orbitH: 200, start: 208, size: 34, c1: '#d5533f', c2: '#441253' },
  { name: 'Jupiter', src: '/icons/planets/jupiter.png', fallback: '\u2643', orbitW: 590, orbitH: 232, start: 318, size: 58, c1: '#c2763b', c2: '#221050' },
  { name: 'Saturn', src: '/icons/planets/saturn.png', fallback: '\u2644', orbitW: 670, orbitH: 262, start: 112, size: 52, c1: '#c9a66b', c2: '#10051d' },
] as const;

const RASHIS = [
  ['Aries', 'aries', '\u2648'], ['Taurus', 'taurus', '\u2649'], ['Gemini', 'gemini', '\u264a'],
  ['Cancer', 'cancer', '\u264b'], ['Leo', 'leo', '\u264c'], ['Virgo', 'virgo', '\u264d'],
  ['Libra', 'libra', '\u264e'], ['Scorpio', 'scorpio', '\u264f'], ['Sagittarius', 'sagittarius', '\u2650'],
  ['Capricorn', 'capricorn', '\u2651'], ['Aquarius', 'aquarius', '\u2652'], ['Pisces', 'pisces', '\u2653'],
] as const;

const LABELS: Array<[number, string]> = [
  [0, '0.0s - single star'], [0.5, '0.5s - orbit rings form'], [1, '1.0s - 6 orbiting planets appear'],
  [2.4, '2.4s - solar system compresses'], [3, '3.0s - rashi wheel forms from center'],
  [3.5, '3.5s - rashi icons reveal'], [4.5, '4.5s - rashi wheel dissolves'],
  [5, '5.0s - light pillar'], [5.5, '5.5s - icon forms, no text'],
  [7, '7.0s - tagline appears'], [7.5, '7.5s - AstraMitra appears once'], [8, '8.0s - final hold'],
];

interface ExactIntroProps {
  autoComplete?: boolean;
  onComplete?: () => void;
}

export default function ExactIntro({ autoComplete = false, onComplete }: ExactIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const replayRef = useRef<() => void>(() => {});
  const [hud, setHud] = useState(LABELS[0][1]);

  const ticks = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const r1 = i % 5 === 0 ? 203 : 208;
    return {
      x1: r(250 + Math.cos(angle) * r1),
      y1: r(250 + Math.sin(angle) * r1),
      x2: r(250 + Math.cos(angle) * 214),
      y2: r(250 + Math.sin(angle) * 214),
    };
  }), []);

  const particles = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    angle: (i * 137.5) % 360,
    radius: 70 + ((i * 73) % 251),
  })), []);

  useEffect(() => {
    document.documentElement.classList.add('intro-playing');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const root = rootRef.current;
    if (!root) return;
    const select = gsap.utils.selector(root);
    const orbitMotion = { angle: 0 };
    let sceneScale = 1;

    const positionPlanets = () => {
      select(`.${styles.planetWrap}`).forEach((element) => {
        const wrap = element as HTMLElement;
        const angle = (Number(wrap.dataset.start) + orbitMotion.angle) * Math.PI / 180;
        gsap.set(wrap, {
          x: Math.cos(angle) * Number(wrap.dataset.orbitW) * sceneScale / 2,
          y: Math.sin(angle) * Number(wrap.dataset.orbitH) * sceneScale / 2,
        });
      });
    };

    const updateSceneScale = () => {
      const widthScale = window.innerWidth / 1040;
      const heightScale = window.innerHeight / 760;
      const minScale = window.innerWidth < 400 ? 0.45 : 0.72;
      sceneScale = Math.min(1.32, Math.max(minScale, Math.min(widthScale, heightScale)));
      root.style.setProperty('--intro-scene-scale', String(sceneScale));

      const solarPlane = select(`.${styles.solarPlane}`)[0] as HTMLElement | undefined;
      if (solarPlane) {
        solarPlane.style.width = `${760 * sceneScale}px`;
        solarPlane.style.height = `${300 * sceneScale}px`;
      }
      select(`.${styles.orbit}`).forEach((element) => {
        const orbit = element as HTMLElement;
        orbit.style.setProperty('--orbit-width', `${Number(orbit.dataset.orbitW) * sceneScale}px`);
        orbit.style.setProperty('--orbit-height', `${Number(orbit.dataset.orbitH) * sceneScale}px`);
      });
      const core = select(`.${styles.core}`)[0] as HTMLElement | undefined;
      if (core) {
        const coreBoost = window.innerWidth <= 700 ? 1.18 : 1.28;
        core.style.setProperty('--core-size', `${34 * sceneScale * coreBoost}px`);
      }
      select(`.${styles.planet}`).forEach((element) => {
        const planet = element as HTMLElement;
        const boost = window.innerWidth <= 700 ? 2.36 : 2.56;
        planet.style.setProperty('--planet-size', `${Number(planet.dataset.size) * sceneScale * boost}px`);
      });
      positionPlanets();
    };

    const baseSet = () => {
      gsap.set(select(`.${styles.core}`), { scale: 0, opacity: 0 });
      gsap.set(select(`.${styles.solar}`), { scale: 0.72, opacity: 0 });
      gsap.set(select(`.${styles.solarPlane}`), { rotation: -11, scale: 1, transformOrigin: '50% 50%' });
      gsap.set(select(`.${styles.orbit}`), { opacity: 0, scale: 0.3, transformOrigin: '50% 50%' });
      orbitMotion.angle = 0;
      positionPlanets();
      gsap.set(select(`.${styles.planet}`), { scale: 0, opacity: 0, x: 0, y: 0 });
      gsap.set(select(`.${styles.zodiac}`), { scale: 0.16, rotation: -8, opacity: 0, transformOrigin: '50% 50%' });
      gsap.set(select(`.${styles.rashiItem}`), { opacity: 0, scale: 1, x: 0, y: 0 });
      select(`.${styles.rashiCounter}`).forEach((el) => {
        const g = el as unknown as SVGElement;
        gsap.set(g, { svgOrigin: `${g.dataset.cx} ${g.dataset.cy}`, rotation: 8 });
      });
      gsap.set(select('[data-wheel-line]'), { opacity: 1 });
      gsap.set(select(`.${styles.particle}`), { scale: 0, opacity: 0, x: 0, y: 0 });
      gsap.set(select(`.${styles.pillar}`), { xPercent: -50, yPercent: -50, scaleY: 0, opacity: 0 });
      gsap.set(select(`.${styles.ground}`), { xPercent: -50, scale: 0.35, opacity: 0 });
      gsap.set(select(`.${styles.logoIcon}`), { xPercent: -50, yPercent: -50, scale: 0.08, rotation: -28, y: 0, opacity: 0 });
      gsap.set(select(`.${styles.logoRay}`), { scale: 0, opacity: 0, transformOrigin: '60px 60px' });
      gsap.set(select(`.${styles.logoRing}`), { scale: 0, opacity: 0, transformOrigin: '60px 60px' });
      gsap.set(select(`.${styles.logoDot}`), { scale: 0, opacity: 0, transformOrigin: '60px 60px' });
      gsap.set(select('[data-tagline]'), { xPercent: -50, y: 28, opacity: 0 });
      gsap.set(select('[data-brand]'), { xPercent: -50, y: 28, opacity: 0 });
      gsap.set(select('[data-progress]'), { width: '0%' });
      setHud(LABELS[0][1]);
    };

    const build = () => {
      timelineRef.current?.kill();
      baseSet();
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onUpdate: () => {
          let current = LABELS[0][1];
          for (const item of LABELS) if (tl.time() >= item[0]) current = item[1];
          setHud(current);
        },
      });
      timelineRef.current = tl;

      tl.to(select('[data-progress]'), { width: '100%', duration: 8, ease: 'none' }, 0)
        .to(select(`.${styles.core}`), { opacity: 0.95, scale: 1, duration: 0.4, ease: 'power3.out' }, 0)
        .to(select(`.${styles.core}`), { scale: 1.45, duration: 1.05, ease: 'sine.inOut', repeat: 2, yoyo: true }, 0.35)
        .to(select(`.${styles.solar}`), { opacity: 1, scale: 0.76, duration: 0.55, ease: 'power3.out' }, 0.5)
        .to(select(`.${styles.orbit}`), { opacity: 1, scale: 1, stagger: 0.045, duration: 0.55, ease: 'power3.out' }, 0.55)
        .to(select(`.${styles.planet}`), { opacity: 1, scale: 1, stagger: 0.07, duration: 0.55, ease: 'back.out(1.5)' }, 1)
        .to(select(`.${styles.solar}`), { scale: 0.88, duration: 1.25, ease: 'sine.inOut' }, 1.05)
        .to(orbitMotion, { angle: 112, duration: 1.35, ease: 'none', onUpdate: positionPlanets }, 1.05)
        .to(select(`.${styles.solarPlane}`), { rotation: 0, duration: 1.35, ease: 'sine.inOut' }, 1.05)
        .to(select(`.${styles.planetWrap}`), { x: 0, y: 0, stagger: 0.018, duration: 0.68, ease: 'power2.inOut' }, 2.32)
        .to(select(`.${styles.planet}`), { opacity: 0, scale: 0.12, stagger: 0.018, duration: 0.58, ease: 'power2.inOut' }, 2.4)
        .to(select(`.${styles.orbit}`), { opacity: 0, scale: 0.08, stagger: 0.014, duration: 0.66, ease: 'power2.inOut' }, 2.34)
        .to(select(`.${styles.solar}`), { opacity: 0, scale: 0.18, duration: 0.7, ease: 'power2.inOut' }, 2.38)
        .to(select(`.${styles.zodiac}`), { opacity: 0.38, scale: 0.34, rotation: 8, duration: 0.38, ease: 'sine.out' }, 2.48)
        .to(select(`.${styles.core}`), { opacity: 1, scale: 2.35, duration: 0.4, ease: 'sine.inOut' }, 2.56)
        .to(select(`.${styles.zodiac}`), { opacity: 1, scale: 0.76, rotation: 22, duration: 0.58, ease: 'power3.out' }, 2.72)
        .to(select(`.${styles.core}`), { scale: 1.1, duration: 0.46, ease: 'power2.out' }, 2.86)
        .to(select(`.${styles.core}`), { opacity: 0, scale: 0.2, duration: 0.32, ease: 'power2.in' }, 3.08)
        .to(select(`.${styles.zodiac}`), { scale: 1, rotation: 48, duration: 0.58, ease: 'power2.out' }, 3.18)
        .to(select(`.${styles.rashiItem}`), { opacity: 1, stagger: 0.04, duration: 0.34, ease: 'power2.out' }, 3.5)
        .to(select(`.${styles.zodiac}`), { rotation: 104, duration: 0.96, ease: 'none' }, 3.9)
        .to(select(`.${styles.rashiItem}`), {
          opacity: 0, scale: 0.1,
          x: (i) => Math.cos((i * 30 - 90) * Math.PI / 180) * -90,
          y: (i) => Math.sin((i * 30 - 90) * Math.PI / 180) * -90,
          stagger: 0.025, duration: 0.42, ease: 'power3.in',
        }, 4.5)
        .to(select('[data-wheel-line]'), { opacity: 0, duration: 0.5, ease: 'power2.in' }, 4.58)
        .to(select(`.${styles.zodiac}`), { scale: 0.22, rotation: 170, opacity: 0, duration: 0.6, ease: 'power4.inOut' }, 4.55)
        .to(select(`.${styles.particle}`), {
          opacity: 1,
          scale: (i) => 0.5 + ((i * 37) % 120) / 100,
          x: (_, element) => Math.cos(Number((element as HTMLElement).dataset.angle) * Math.PI / 180) * Number((element as HTMLElement).dataset.radius),
          y: (_, element) => Math.sin(Number((element as HTMLElement).dataset.angle) * Math.PI / 180) * Number((element as HTMLElement).dataset.radius) * 0.45,
          stagger: 0.004, duration: 0.38, ease: 'power3.out',
        }, 4.65)
        .to(select(`.${styles.particle}`), { opacity: 0, scale: 0, x: 0, y: 0, stagger: 0.003, duration: 0.5, ease: 'power3.in' }, 5.05)
        .to(select(`.${styles.pillar}`), { opacity: 0.92, scaleY: 1, duration: 0.52, ease: 'power4.out' }, 5)
        .to(select(`.${styles.ground}`), { opacity: 0.85, scale: 0.98, duration: 0.65, ease: 'power3.out' }, 5)
        .to(select(`.${styles.logoIcon}`), { opacity: 1, scale: 0.82, rotation: 0, duration: 0.42, ease: 'back.out(1.8)' }, 5.5)
        .to(select(`.${styles.logoRing}`), { opacity: 1, scale: 1, stagger: 0.07, duration: 0.42, ease: 'back.out(2)' }, 5.55)
        .to(select(`.${styles.logoDot}`), { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, 5.7)
        .to(select(`.${styles.logoRay}`), { opacity: 1, scale: 1, stagger: 0.035, duration: 0.34, ease: 'back.out(2)' }, 5.78)
        .to(select(`.${styles.logoIcon}`), { scale: 0.92, duration: 0.5, ease: 'elastic.out(1, 0.65)' }, 6)
        .to(select(`.${styles.pillar}`), { opacity: 0.16, scaleY: 0.34, duration: 0.65, ease: 'power2.out' }, 6.05)
        .to(select(`.${styles.ground}`), { opacity: 0.72, scale: 1.05, duration: 0.55, ease: 'sine.out' }, 6.5)
        .to(select('[data-tagline]'), { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out' }, 7)
        .to(select('[data-tagline]'), { opacity: 0, y: -20, duration: 0.28, ease: 'power2.in' }, 7.46)
        .to(select(`.${styles.logoIcon}`), { y: -118, scale: 0.55, duration: 0.52, ease: 'power3.inOut' }, 7.45)
        .to(select('[data-brand]'), { opacity: 1, y: 0, duration: 0.48, ease: 'power3.out' }, 7.5);

      if (autoComplete) {
        tl.to(root, { opacity: 0, duration: 0.65, ease: 'power2.inOut' }, 8.35)
          .call(() => onComplete?.());
      } else {
        tl.addPause(8);
      }

      tl.to(select(`.${styles.rashiCounter}`), { rotation: -8, duration: 0.38, ease: 'sine.out' }, 2.48)
        .to(select(`.${styles.rashiCounter}`), { rotation: -22, duration: 0.58, ease: 'power3.out' }, 2.72)
        .to(select(`.${styles.rashiCounter}`), { rotation: -48, duration: 0.58, ease: 'power2.out' }, 3.18)
        .to(select(`.${styles.rashiCounter}`), { rotation: -104, duration: 0.96, ease: 'none' }, 3.9)
        .to(select(`.${styles.rashiCounter}`), { rotation: -170, duration: 0.6, ease: 'power4.inOut' }, 4.55);

      return tl;
    };

    updateSceneScale();
    window.addEventListener('resize', updateSceneScale, { passive: true });
    replayRef.current = () => build().play(0);
    const context = gsap.context(() => build().play(0), root);

    return () => {
      context.revert();
      timelineRef.current?.kill();
      window.removeEventListener('resize', updateSceneScale);
      document.body.style.overflow = previousOverflow;
      document.documentElement.classList.remove('intro-playing');
    };
  }, [autoComplete, onComplete]);

  const handleSkip = useCallback(() => {
    const root = rootRef.current;
    const timeline = timelineRef.current;
    if (!root || !timeline) return;
    timeline.pause(8);
    const select = gsap.utils.selector(root);
    gsap.to(select('[data-tagline]'), { opacity: 0, duration: 0.1 });
    gsap.to(select('[data-brand]'), { opacity: 1, y: 0, duration: 0.2 });
    gsap.to(select(`.${styles.logoIcon}`), { opacity: 1, y: -118, scale: 0.55, rotation: 0, duration: 0.2 });
    gsap.to(select('[data-progress]'), { width: '100%', duration: 0.2 });
    setHud(LABELS[LABELS.length - 1][1]);
  }, []);

  return (
    <div ref={rootRef} className={styles.intro}>
      {!autoComplete && <div className={styles.hud}>{hud}</div>}

      <div className={styles.stage}>
        <div className={styles.solar}>
          <div className={styles.solarPlane}>
            {PLANETS.map((planet) => (
              <div
                key={`orbit-${planet.name}`}
                className={styles.orbit}
                data-orbit-w={planet.orbitW}
                data-orbit-h={planet.orbitH}
                style={{ '--orbit-width': `${planet.orbitW}px`, '--orbit-height': `${planet.orbitH}px` } as CssVars}
              />
            ))}
            {PLANETS.map((planet) => (
              <div key={planet.name} className={styles.planetWrap} data-start={planet.start} data-orbit-w={planet.orbitW} data-orbit-h={planet.orbitH}>
                <div className={styles.planet} data-size={planet.size} style={{ '--planet-size': `${planet.size}px`, '--planet-color-1': planet.c1, '--planet-color-2': planet.c2 } as CssVars}>
                  <img src={planet.src} alt={planet.name} draggable={false} onError={(event) => {
                    event.currentTarget.style.display = 'none';
                    (event.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'grid');
                  }} />
                  <span className={styles.planetFallback}>{planet.fallback}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.core} style={{ '--planet-size': 'var(--core-size)', '--planet-color-1': '#f7c56c', '--planet-color-2': '#79311f' } as CssVars}>
          <img src="/icons/planets/sun.png" alt="Sun" draggable={false} onError={(event) => {
            event.currentTarget.style.display = 'none';
            (event.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'grid');
          }} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%', display: 'block' }} />
          <span className={styles.planetFallback}>☉</span>
        </div>
      </div>

      <div className={styles.zodiacStage}>
        <svg className={styles.zodiac} viewBox="0 0 500 500" aria-hidden="true">
          {[{ radius: 214, opacity: 0.62, width: 1.35 }, { radius: 174, opacity: 0.42, width: 1.05 }, { radius: 132, opacity: 0.28, width: 0.8 }, { radius: 82, opacity: 0.18, width: 0.65 }].map(({ radius, opacity, width }) => (
            <circle key={radius} data-wheel-line cx="250" cy="250" r={radius} fill="none" stroke={`color-mix(in srgb, var(--secondary) ${opacity * 100}%, transparent)`} strokeWidth={width} />
          ))}
          <g data-wheel-line>
            <line x1="250" y1="36" x2="250" y2="464" /><line x1="36" y1="250" x2="464" y2="250" />
            <line x1="99" y1="99" x2="401" y2="401" /><line x1="401" y1="99" x2="99" y2="401" />
            <line x1="143" y1="65" x2="357" y2="435" /><line x1="357" y1="65" x2="143" y2="435" />
          </g>
          <g>
            {ticks.map((tick, i) => <line key={i} data-wheel-line className={styles.tick} {...tick} />)}
          </g>
          <g>
            {RASHIS.map(([name, slug, glyph], index) => {
              const angle = (index * 30 - 90) * Math.PI / 180;
              const cx = r(250 + Math.cos(angle) * 188);
              const cy = r(250 + Math.sin(angle) * 188);
              return (
                <g key={slug} className={styles.rashiItem}>
                  <g className={styles.rashiCounter} data-cx={cx} data-cy={cy}>
                    <foreignObject x={r(cx - 32)} y={r(cy - 32)} width="64" height="64">
                      <div style={{ width: 64, height: 64, display: 'grid', placeItems: 'center' }}>
                        <img className={styles.rashiIcon} src={`/icons/rashi/${slug}.png`} alt={name} draggable={false} onError={(event) => {
                          event.currentTarget.style.display = 'none';
                          (event.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'block');
                        }} />
                        <span className={styles.rashiFallback}>{glyph}</span>
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div>{particles.map((particle, i) => <div key={i} className={styles.particle} data-angle={particle.angle} data-radius={particle.radius} />)}</div>
      <div className={styles.pillar} />
      <div className={styles.ground} />

      <div className={styles.logoIcon} aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <defs><radialGradient id="exact-intro-gold" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="var(--flare-ivory)" /><stop offset="45%" stopColor="var(--secondary)" /><stop offset="100%" stopColor="var(--brand-gold-dark)" /></radialGradient></defs>
          <g fill="url(#exact-intro-gold)">
            {['M60 0 L66 28 L60 24 L54 28 Z', 'M60 120 L54 92 L60 96 L66 92 Z', 'M0 60 L28 54 L24 60 L28 66 Z', 'M120 60 L92 66 L96 60 L92 54 Z', 'M18 18 L42 34 L34 42 Z', 'M102 18 L86 42 L78 34 Z', 'M18 102 L34 78 L42 86 Z', 'M102 102 L78 86 L86 78 Z'].map((d) => <path key={d} className={styles.logoRay} d={d} />)}
          </g>
          <circle className={styles.logoRing} cx="60" cy="60" r="31" fill="none" stroke="var(--secondary)" strokeWidth="5" />
          <circle className={styles.logoRing} cx="60" cy="60" r="14" fill="none" stroke="var(--brand-gold-hover)" strokeWidth="5" />
          <circle className={styles.logoDot} cx="60" cy="60" r="4.5" fill="var(--flare-ivory)" />
        </svg>
      </div>

      <section data-tagline className={`${styles.copy}`}>
        <span className={styles.taglineLine}>Your Cosmic Journey,</span>
        <span className={styles.taglineLine}>Finally Understood.</span>
      </section>
      <section data-brand className={`${styles.copy} ${styles.brand}`}>
        <div className={styles.brandName}>AstraMitra</div>
        <div className={styles.brandSub}>Navigate. Understand. <span>Align.</span></div>
      </section>

      <div className={styles.progress}><span data-progress /></div>
      {!autoComplete && (
        <div className={styles.controls}>
          <button type="button" onClick={() => replayRef.current()}>Replay</button>
          <button type="button" onClick={handleSkip}>Skip</button>
        </div>
      )}
    </div>
  );
}
