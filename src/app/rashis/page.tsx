'use client';

import * as React from 'react';
import { Suspense } from 'react';
import RashisClient from './RashisClient';
import { RefreshCw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Local error boundary for the rashis page.
 * Catches rendering errors within RashisClient so they don't
 * propagate to the global error.tsx boundary.
 */
class RashisErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[RashisPage] Error boundary caught:', error.message, errorInfo.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-6 opacity-30">✦</div>
                        <h2 className="text-2xl font-headline font-bold text-primary mb-3">
                            Celestial Interference
                        </h2>
                        <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
                            The rashis could not be displayed right now.
                            {this.state.error && (
                                <span className="block mt-2 text-xs text-on-surface-variant/50 font-mono">
                                    {this.state.error.message}
                                </span>
                            )}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                leftIcon={<RefreshCw className="w-4 h-4" />}
                            >
                                Try Again
                            </Button>
                            <Button href="/" variant="ghost" leftIcon={<Home className="w-4 h-4" />}>
                                Back to Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function RashisPage() {
    return (
        <RashisErrorBoundary>
            <Suspense fallback={
                <div className="flex-grow flex items-center justify-center min-h-[60vh]">
                    <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
                </div>
            }>
                <RashisClient />
            </Suspense>
        </RashisErrorBoundary>
    );
}
