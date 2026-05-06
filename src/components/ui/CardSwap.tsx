'use client';

import React, {
    Children,
    cloneElement,
    forwardRef,
    isValidElement,
    useEffect,
    useMemo,
    useRef,
    useCallback
} from 'react';
import gsap from 'gsap';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, ...rest }, ref) => (
    <div ref={ref} {...rest} className={`card ${customClass ?? ''} ${rest.className ?? ''}`.trim()} />
));
Card.displayName = 'Card';

const makeSlot = (i: number, distX: number, distY: number, total: number) => ({
    x: i * distX,
    y: -i * distY,
    z: -i * distX * 1.5,
    zIndex: total - i
});

const placeNow = (el: HTMLElement | null, slot: ReturnType<typeof makeSlot>, skew: number) => {
    if (!el) return;
    gsap.set(el, {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        xPercent: -50,
        yPercent: -50,
        skewY: skew,
        transformOrigin: 'center center',
        zIndex: slot.zIndex,
        force3D: true
    });
};

interface CardSwapProps {
    width?: number | string;
    height?: number | string;
    cardDistance?: number;
    verticalDistance?: number;
    delay?: number;
    pauseOnHover?: boolean;
    onCardClick?: (index: number) => void;
    skewAmount?: number;
    easing?: 'elastic' | 'smooth';
    activeIndex?: number;
    children: React.ReactNode;
}

const CardSwap: React.FC<CardSwapProps> = ({
    width = 500,
    height = 400,
    cardDistance = 60,
    verticalDistance = 70,
    delay = 5000,
    pauseOnHover = false,
    onCardClick,
    skewAmount = 6,
    easing = 'elastic',
    activeIndex,
    children
}) => {
    const config = useMemo(() => (
        easing === 'elastic'
            ? {
                ease: 'elastic.out(0.6,0.9)',
                durDrop: 2,
                durMove: 2,
                durReturn: 2,
                promoteOverlap: 0.9,
                returnDelay: 0.05
            }
            : {
                ease: 'power1.inOut',
                durDrop: 0.8,
                durMove: 0.8,
                durReturn: 0.8,
                promoteOverlap: 0.45,
                returnDelay: 0.2
            }
    ), [easing]);

    const childArr = useMemo(() => Children.toArray(children), [children]);
    const refs = useMemo(
        () => childArr.map(() => React.createRef<HTMLDivElement>()),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [childArr.length]
    );

    const order = useRef<number[]>(Array.from({ length: childArr.length }, (_, i) => i));
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const intervalRef = useRef<number | null>(null);
    const container = useRef<HTMLDivElement>(null);
    const isAnimating = useRef(false);

    // Resets every card to its correct slot position based on current order.
    // This is the critical function that makes everything work —
    // by snapping cards to their canonical positions before any new animation,
    // we guarantee the relative `y: '+=500'` always starts from the right place.
    const resetAllToSlots = useCallback(() => {
        const total = refs.length;
        order.current.forEach((cardIdx, slotIdx) => {
            const el = refs[cardIdx]?.current;
            if (el) {
                placeNow(el, makeSlot(slotIdx, cardDistance, verticalDistance, total), skewAmount);
            }
        });
    }, [refs, cardDistance, verticalDistance, skewAmount]);

    // The core swap animation — identical to the original react-bits code.
    // Drops the front card down, promotes remaining cards forward,
    // then returns the dropped card to the back of the stack.
    const swap = useCallback(() => {
        if (order.current.length < 2) return;
        if (isAnimating.current) return;

        const [front, ...rest] = order.current;
        const elFront = refs[front]?.current;
        if (!elFront) return;

        isAnimating.current = true;
        const tl = gsap.timeline();
        tlRef.current = tl;

        // Drop the front card down (relative — this is how the original works)
        tl.to(elFront, {
            y: '+=500',
            duration: config.durDrop,
            ease: config.ease
        });

        // Promote remaining cards forward into their new slots
        tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
        rest.forEach((idx, i) => {
            const el = refs[idx]?.current;
            if (!el) return;
            const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
            tl.set(el, { zIndex: slot.zIndex }, 'promote');
            tl.to(
                el,
                {
                    x: slot.x,
                    y: slot.y,
                    z: slot.z,
                    duration: config.durMove,
                    ease: config.ease
                },
                `promote+=${i * 0.15}`
            );
        });

        // Return the dropped card to the back of the stack
        const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
        tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
        tl.call(
            () => {
                gsap.set(elFront, { zIndex: backSlot.zIndex });
            },
            undefined,
            'return'
        );
        tl.to(
            elFront,
            {
                x: backSlot.x,
                y: backSlot.y,
                z: backSlot.z,
                duration: config.durReturn,
                ease: config.ease
            },
            'return'
        );

        // Update the order array once animation completes
        tl.call(() => {
            order.current = [...rest, front];
            isAnimating.current = false;
        });
    }, [refs, cardDistance, verticalDistance, config]);

    // Main initialization effect — matches the original code exactly.
    // Places all cards, kicks off initial swap, starts the auto-rotation interval.
    useEffect(() => {
        const total = refs.length;
        refs.forEach((r, i) => {
            if (r.current) {
                placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
            }
        });

        // Only auto-rotate when there's no external activeIndex control
        if (activeIndex === undefined) {
            swap();
            intervalRef.current = window.setInterval(swap, delay);
        }

        const node = container.current;
        if (pauseOnHover && node) {
            const pause = () => {
                tlRef.current?.pause();
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
            const resume = () => {
                tlRef.current?.play();
                if (activeIndex === undefined) {
                    intervalRef.current = window.setInterval(swap, delay);
                }
            };
            node.addEventListener('mouseenter', pause);
            node.addEventListener('mouseleave', resume);
            return () => {
                node.removeEventListener('mouseenter', pause);
                node.removeEventListener('mouseleave', resume);
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

    // External activeIndex sync effect.
    // When the left text slider changes the activeIndex, we need to bring
    // the matching card to the front of the gallery.
    useEffect(() => {
        if (activeIndex === undefined) return;
        if (order.current[0] === activeIndex) return;

        // Step 1: Kill any running animation and mark as not animating
        if (tlRef.current) {
            tlRef.current.kill();
            tlRef.current = null;
        }
        isAnimating.current = false;

        // Step 2: Rearrange the internal order so the target card is at position [1]
        // (i.e. "next in line"), keeping the current front card at [0].
        const newOrder = [...order.current];
        const targetPos = newOrder.indexOf(activeIndex);
        if (targetPos === -1) return;

        // Pull the target out and insert it right after the current front
        newOrder.splice(targetPos, 1);
        newOrder.splice(1, 0, activeIndex);
        order.current = newOrder;

        // Step 3: Snap every card to its correct slot position instantly.
        // This is the key fix — by resetting positions before swap(),
        // the relative `y: '+=500'` will always start from the right place.
        resetAllToSlots();

        // Step 4: Run the normal swap animation (drops front, promotes target to front)
        swap();
    }, [activeIndex, swap, resetAllToSlots]);

    const rendered = childArr.map((child, i) => {
        if (!isValidElement(child)) return child;
        const element = child as React.ReactElement<{ style?: React.CSSProperties; onClick?: (e: React.MouseEvent) => void }>;
        return cloneElement(element, {
            key: i,
            ref: refs[i],
            style: { width, height, ...(element.props.style ?? {}) },
            onClick: (e: React.MouseEvent) => {
                element.props.onClick?.(e);
                onCardClick?.(i);
            }
        } as React.Attributes & { style: React.CSSProperties; onClick: (e: React.MouseEvent) => void });
    });

    return (
        <div ref={container} className="card-swap-container" style={{ width, height }}>
            {rendered}
        </div>
    );
};

export default CardSwap;
