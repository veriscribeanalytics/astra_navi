'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import { Home, RefreshCw } from 'lucide-react';

export default function DashboardError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6 opacity-30">✦</div>
        <h2 className="text-2xl font-headline font-bold text-primary mb-3">Cosmic interruption</h2>
        <p className="text-on-surface-variant mb-8 text-sm">
          Your dashboard encountered an unexpected transit. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} leftIcon={<RefreshCw className="w-4 h-4" />}>
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
