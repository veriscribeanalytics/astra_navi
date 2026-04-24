import React from 'react';
import MatchClient from './MatchClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Kundli Matching (Ashtakoot Milan) | AstraNavi",
  description: "Discover your spiritual and cosmic compatibility using the ancient 36-point Vedic system. Enter the birth details of both individuals to begin.",
};

export default function MatchPage() {
  return (
    <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)] py-10 sm:py-20 px-4">
      <MatchClient />
    </div>
  );
}
