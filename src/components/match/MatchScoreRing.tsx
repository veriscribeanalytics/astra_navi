'use client';

import React from 'react';
import ScoreRing from '@/components/ui/ScoreRing';

interface MatchScoreRingProps {
  score: number; // 0 to 36
  tier?: {
    tier: string;
    color: string;
    emoji: string;
    label: string;
  };
}

export default function MatchScoreRing({ score, tier }: MatchScoreRingProps) {
  return <ScoreRing score={score} maxScore={36} size={180} tier={tier} label="Compatibility" animated={true} />;
}
