import React from 'react';

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-20 relative">
            <div className="relative z-10 text-center space-y-8 bg-surface/80 dark:bg-surface/50 backdrop-blur-xl p-12 rounded-3xl border border-secondary/10 dark:border-outline-variant">
                <h1 className="text-5xl sm:text-6xl font-headline font-bold text-primary">About AstraNavi</h1>
                <p className="text-lg text-on-surface-variant max-w-xl">
                    Bridging ancient Vedic wisdom with modern AI precision to illuminate your life&apos;s path.
                </p>
            </div>
        </div>
    );
}
