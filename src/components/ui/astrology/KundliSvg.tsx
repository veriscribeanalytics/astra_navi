"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Skeleton } from '@/components/ui/Skeleton';

interface KundliSvgProps {
    className?: string;
    style?: 'north' | 'south';
}

export default function KundliSvg({ className = '', style = 'north' }: KundliSvgProps) {
    const { theme } = useTheme();
    const [svgData, setSvgData] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchSvg = async () => {
            setLoading(true);
            setError(false);
            try {
                // The theme is already resolved to 'light' or 'dark' by useTheme()
                const res = await fetch(`/api/profile/svg?style=${style}&theme=${theme}`);
                if (!res.ok) throw new Error('Failed to fetch SVG');
                const data = await res.text();
                if (isMounted) {
                    setSvgData(data);
                }
            } catch (err) {
                console.error('Error fetching Kundli SVG:', err);
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSvg();

        return () => {
            isMounted = false;
        };
    }, [theme, style]);

    if (loading) {
        return (
            <div className={`w-full aspect-square flex items-center justify-center ${className}`}>
                <Skeleton className="w-full h-full rounded-2xl" />
            </div>
        );
    }

    if (error || !svgData) {
        return (
            <div className={`w-full aspect-square flex items-center justify-center bg-surface-variant/20 border border-outline-variant/10 rounded-2xl text-foreground/40 text-xs font-bold uppercase tracking-widest ${className}`}>
                Chart Unavailable
            </div>
        );
    }

    // Return the injected SVG
    return (
        <div 
            className={`w-full h-auto flex items-center justify-center 
            [&_svg]:!w-full [&_svg]:!h-full [&_svg]:!max-w-full [&_svg]:!max-h-full
            [&_rect]:!fill-transparent
            [&_line]:!stroke-[var(--secondary)] 
            [&_polygon]:!stroke-[var(--secondary)] [&_polygon]:!fill-transparent
            [&_path]:!stroke-[var(--secondary)] [&_path]:!fill-transparent
            [&_circle]:!stroke-[var(--secondary)] [&_circle]:!fill-transparent
            [&_text]:!fill-[var(--foreground)]
            ${className}`}
            dangerouslySetInnerHTML={{ __html: svgData }}
        />
    );
}
