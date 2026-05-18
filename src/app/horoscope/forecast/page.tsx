'use client';

import { Suspense } from 'react';
import ForecastPage from '@/components/forecast/ForecastPage';

export default function ForecastRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    }>
      <ForecastPage />
    </Suspense>
  );
}
