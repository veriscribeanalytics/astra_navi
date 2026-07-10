import React, { Suspense } from 'react';
import PlansClient from './PlansClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Premium Plans | AstraNavi',
  description: 'Unlock deeper astrological insights, premium features, and Navi credits with our Vedic AI plans.',
};

export default function PlansPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 sm:pt-24 pb-10 flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-secondary/20 animate-spin" />
      </div>
    }>
      <PlansClient />
    </Suspense>
  );
}