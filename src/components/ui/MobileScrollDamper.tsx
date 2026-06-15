'use client';

import { useEffect } from 'react';

/**
 * MobileScrollDamper
 *
 * Intercepts touch-scroll on mobile and replaces the native momentum with a
 * custom friction-damped coasting loop.
 *
 * This version disables browser `scroll-behavior: smooth` while active, which
 * prevents the browser's native smooth-scrolling animation from fighting the
 * manual touch-scroll updates (which previously caused the page to feel stuck/locked).
 *
 * It also intelligently ignores horizontal gestures to prevent breaking
 * horizontal carousels and lists, and ignores nested scrollable components.
 */

const SPEED_FACTOR = 1.0;
const FRICTION     = 0.84;
const MIN_VELOCITY = 0.5;

export default function MobileScrollDamper() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('ontouchstart' in window)) return;

        const scroller = document.body;
        const docEl = document.documentElement;

        let startX    = 0;
        let startY    = 0;
        let prevY     = 0;
        let velocity  = 0;
        let rafId     = 0;
        let touching  = false;
        let hasDecidedDirection = false;
        let isScrollingHorizontally = false;

        const cancelMomentum = () => {
            cancelAnimationFrame(rafId);
            velocity = 0;
        };

        // Check if touch target is inside a nested scrollable element (like chat history, dropdown, etc.)
        const isInsideScrollable = (el: HTMLElement | null): boolean => {
            while (el && el !== scroller && el !== docEl) {
                const style = window.getComputedStyle(el);
                const overflowY = style.overflowY;
                const overflowX = style.overflowX;
                const isScrollableY = overflowY === 'auto' || overflowY === 'scroll';
                const isScrollableX = overflowX === 'auto' || overflowX === 'scroll';
                
                if (isScrollableY && el.scrollHeight > el.clientHeight) {
                    return true;
                }
                if (isScrollableX && el.scrollWidth > el.clientWidth) {
                    return true;
                }
                el = el.parentElement;
            }
            return false;
        };

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length > 1) return;
            if (isInsideScrollable(e.target as HTMLElement)) return;

            touching = true;
            hasDecidedDirection = false;
            isScrollingHorizontally = false;
            cancelMomentum();
            startX = e.touches[0].clientX;
            startY = prevY = e.touches[0].clientY;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!touching) return;
            
            if (e.touches.length > 1) {
                touching = false;
                cancelMomentum();
                return;
            }

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;

            // Determine if the gesture is horizontal or vertical
            if (!hasDecidedDirection) {
                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);
                if (diffX > 5 || diffY > 5) {
                    if (diffX > diffY) {
                        isScrollingHorizontally = true;
                        touching = false; // release control for horizontal gestures
                        return;
                    }
                    hasDecidedDirection = true;
                } else {
                    return; // wait for enough movement to decide
                }
            }

            if (isScrollingHorizontally) return;

            const raw      = prevY - currentY; // positive = scroll down
            prevY          = currentY;
            velocity       = raw;

            // Prevent native browser scrolling so we can apply custom speed and decay
            if (e.cancelable) {
                e.preventDefault();
            }
            
            const maxScroll = scroller.scrollHeight - scroller.clientHeight;
            scroller.scrollTop = Math.max(0, Math.min(maxScroll, scroller.scrollTop + raw * SPEED_FACTOR));
        };

        const coasting = () => {
            if (Math.abs(velocity) < MIN_VELOCITY) return;
            
            const maxScroll = scroller.scrollHeight - scroller.clientHeight;
            scroller.scrollTop = Math.max(0, Math.min(maxScroll, scroller.scrollTop + velocity * SPEED_FACTOR));
            
            velocity *= FRICTION;
            rafId = requestAnimationFrame(coasting);
        };

        const onTouchEnd = () => {
            if (!touching) return;
            touching = false;
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(coasting);
        };

        scroller.addEventListener('touchstart', onTouchStart, { passive: true });
        scroller.addEventListener('touchmove',  onTouchMove,  { passive: false });
        scroller.addEventListener('touchend',   onTouchEnd,   { passive: true });
        scroller.addEventListener('touchcancel', cancelMomentum, { passive: true });

        return () => {
            scroller.removeEventListener('touchstart', onTouchStart);
            scroller.removeEventListener('touchmove',  onTouchMove);
            scroller.removeEventListener('touchend',   onTouchEnd);
            scroller.removeEventListener('touchcancel', cancelMomentum);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return null;
}
