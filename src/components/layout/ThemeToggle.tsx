'use client';

import React, { useEffect, useState } from 'react';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check initial theme
        const root = window.document.documentElement;
        const initialColorValue = root.classList.contains('dark') || 
                                (window.matchMedia('(prefers-color-scheme: dark)').matches && !root.classList.contains('light'));
        setIsDark(initialColorValue);
    }, []);

    const toggleTheme = () => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.remove('dark');
            root.classList.add('light');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            root.classList.add('dark');
            root.classList.remove('light');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-surface hover:bg-surface-variant transition-colors border border-secondary/10 group active:scale-95"
            aria-label="Toggle Dark Mode"
        >
            <span className={`material-symbols-outlined text-lg transition-all duration-500 ${isDark ? 'text-secondary rotate-[360deg]' : 'text-primary'}`}>
                {isDark ? 'light_mode' : 'dark_mode'}
            </span>
        </button>
    );
};

export default ThemeToggle;
