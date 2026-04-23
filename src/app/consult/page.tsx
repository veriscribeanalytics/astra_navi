import React from 'react';
import ConsultClient from './ConsultClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Guided Consultation | AstraNavi",
  description: "Get precise Vedic astrology insights by selecting your life concern step by step.",
};

export default function ConsultPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] py-20 px-4">
      <ConsultClient />
    </div>
  );
}
