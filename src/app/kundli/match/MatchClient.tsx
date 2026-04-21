'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Heart, Sparkles, ArrowRight, ArrowLeftRight, 
  RotateCcw, ShieldCheck, ChevronRight, Lock,
  Info
} from 'lucide-react';

// Components
import MatchScoreRing from '@/components/match/MatchScoreRing';
import KootCard from '@/components/match/KootCard';
import MangalDoshaPanel from '@/components/match/MangalDoshaPanel';
import PersonCard from '@/components/match/PersonCard';
import AdditionalDoshas from '@/components/match/AdditionalDoshas';

interface PersonDetails {
  name: string;
  dob: string;
  tob: string;
  place: string;
  gender: 'male' | 'female';
}

export default function MatchClient() {
  const { user, isLoggedIn } = useAuth();
  const { error, success } = useToast();
  
  const [phase, setPhase] = useState<'input' | 'loading' | 'result'>('input');
  const [isSubmitting, setIsSending] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const [person1, setPerson1] = useState<PersonDetails>({
    name: user?.name || '',
    dob: user?.dob || '',
    tob: user?.tob || '',
    place: user?.pob || '',
    gender: 'male',
  });

  const [person2, setPerson2] = useState<PersonDetails>({
    name: '',
    dob: '',
    tob: '12:00',
    place: '',
    gender: 'female',
  });

  // Pre-fill person 1 if user data becomes available
  useEffect(() => {
    if (user && !person1.name) {
      setPerson1({
        name: user.name || '',
        dob: user.dob || '',
        tob: user.tob || '',
        place: user.pob || '',
        gender: 'male',
      });
    }
  }, [user]);

  const handleSwap = () => {
    const p1 = { ...person1 };
    const p2 = { ...person2 };
    setPerson1({ ...p2, gender: p1.gender }); // Keep original roles usually
    setPerson2({ ...p1, gender: p2.gender });
  };

  const handleMatch = async () => {
    // Basic validation
    if (!person1.name || !person1.dob || !person1.place || !person2.name || !person2.dob || !person2.place) {
      error("Please fill all celestial coordinates for both seekers.");
      return;
    }

    setPhase('loading');
    setIsSending(true);

    try {
      const res = await fetch('/api/match?narrative=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person1, person2 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'The stars are temporarily misaligned.');
      }

      setMatchResult(data);
      setPhase('result');
      success("Celestial alignment complete!");
    } catch (err: any) {
      error(err.message || "Failed to align charts. Please check details.");
      setPhase('input');
    } finally {
      setIsSending(false);
    }
  };

  const resetMatch = () => {
    setPhase('input');
    setMatchResult(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card padding="lg" className="max-w-md w-full text-center !rounded-[32px] border-outline-variant/30">
          <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6 border border-secondary/20">
            <Lock className="w-10 h-10 text-secondary" />
          </div>
          <h2 className="text-2xl font-headline font-bold text-foreground mb-4">
            Auth Required
          </h2>
          <p className="text-sm text-foreground/60 mb-8 leading-relaxed">
            Kundli Matching is a personalized experience. Please login to compute compatibility and save to your history.
          </p>
          <Button href="/login" fullWidth size="lg" className="gold-gradient">
            Login to Match ✨
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {phase === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-10"
          >
            {/* Header Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-widest">
                <Heart size={14} className="fill-current" />
                Ashtakoot Milan
              </div>
              <h1 className="text-4xl sm:text-5xl font-headline font-bold text-foreground tracking-tight">
                Kundli Matching
              </h1>
              <p className="text-foreground/60 leading-relaxed font-body">
                Discover your spiritual and cosmic compatibility using the ancient 36-point Vedic system. 
                Enter the birth details of both individuals to begin.
              </p>
            </div>

            {/* Forms Section */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                {/* Person 1 (Usually Male) */}
                <Card className="!rounded-[32px] border-outline-variant/20 bg-surface/40 backdrop-blur-md p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <span className="text-xl font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-headline font-bold text-foreground leading-tight">First Seeker</h3>
                      <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">Groom Details</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input 
                      label="Full Name" 
                      placeholder="e.g. Ravinder Kumar"
                      value={person1.name}
                      onChange={(e) => setPerson1({...person1, name: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Date of Birth" 
                        type="date"
                        value={person1.dob}
                        onChange={(e) => setPerson1({...person1, dob: e.target.value})}
                      />
                      <Input 
                        label="Time of Birth" 
                        type="time"
                        value={person1.tob}
                        onChange={(e) => setPerson1({...person1, tob: e.target.value})}
                      />
                    </div>
                    <Input 
                      label="Place of Birth" 
                      placeholder="e.g. New Delhi, India"
                      value={person1.place}
                      onChange={(e) => setPerson1({...person1, place: e.target.value})}
                    />
                  </div>
                </Card>

                {/* Person 2 (Usually Female) */}
                <Card className="!rounded-[32px] border-outline-variant/20 bg-surface/40 backdrop-blur-md p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
                      <span className="text-xl font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-headline font-bold text-foreground leading-tight">Second Seeker</h3>
                      <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">Bride Details</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input 
                      label="Full Name" 
                      placeholder="e.g. Aarti Sharma"
                      value={person2.name}
                      onChange={(e) => setPerson2({...person2, name: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Date of Birth" 
                        type="date"
                        value={person2.dob}
                        onChange={(e) => setPerson2({...person2, dob: e.target.value})}
                      />
                      <Input 
                        label="Time of Birth" 
                        type="time"
                        value={person2.tob}
                        onChange={(e) => setPerson2({...person2, tob: e.target.value})}
                      />
                    </div>
                    <Input 
                      label="Place of Birth" 
                      placeholder="e.g. Mumbai, India"
                      value={person2.place}
                      onChange={(e) => setPerson2({...person2, place: e.target.value})}
                    />
                  </div>
                </Card>
              </div>

              {/* Swap Button */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:block">
                <button 
                  onClick={handleSwap}
                  className="w-12 h-12 rounded-full bg-surface border border-outline-variant/30 flex items-center justify-center hover:border-secondary/50 hover:bg-surface-variant/20 transition-all group shadow-2xl"
                >
                  <ArrowLeftRight className="text-foreground/40 group-hover:text-secondary transition-colors" size={20} />
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4">
              <Button 
                onClick={handleMatch}
                size="lg"
                className="px-12 py-5 !rounded-2xl gold-gradient shadow-2xl shadow-secondary/20 text-[14px] uppercase tracking-[0.2em] font-bold"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                Match Kundlis <Sparkles className="ml-2 w-4 h-4" />
              </Button>
              <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={12} className="text-green-500/40" />
                Secure & Private Calculation
              </p>
            </div>
          </motion.div>
        )}

        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <div className="relative w-32 h-32 mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-secondary/20"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border-2 border-dashed border-pink-500/20"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-secondary animate-pulse" size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-headline font-bold text-foreground mb-2">Aligning the Heavens</h2>
            <p className="text-sm text-foreground/40 font-body max-w-xs mx-auto">
              Our Vedic engine is analyzing nakshatras, planet positions, and dasha periods...
            </p>
          </motion.div>
        )}

        {phase === 'result' && matchResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            {/* Phase Result Header */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-surface/20 rounded-[40px] border border-outline-variant/10 p-8 sm:p-12 relative overflow-hidden">
               {/* Background effect */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />

               <MatchScoreRing 
                score={matchResult.total_points} 
                tier={matchResult.match_tier}
               />

               <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-headline font-bold text-foreground">Celestial Verdict</h2>
                    <p className="text-foreground/60 leading-relaxed font-body">
                      {matchResult.match_summary || "The alignment reveals a unique bond between these two charts."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PersonCard 
                      name={person1.name} 
                      gender={person1.gender}
                      rashi={matchResult.groom_details?.rashi}
                      rashiEn={matchResult.groom_details?.rashi_en}
                      nakshatra={matchResult.groom_details?.nakshatra}
                      pada={matchResult.groom_details?.pada}
                    />
                    <PersonCard 
                      name={person2.name} 
                      gender={person2.gender}
                      rashi={matchResult.bride_details?.rashi}
                      rashiEn={matchResult.bride_details?.rashi_en}
                      nakshatra={matchResult.bride_details?.nakshatra}
                      pada={matchResult.bride_details?.pada}
                    />
                  </div>
               </div>
            </div>

            {/* AI Narrative Section - Pro Only */}
            {matchResult.ai_narrative ? (
               <Card className="!rounded-[32px] border-secondary/20 bg-secondary/[0.03] p-8 space-y-4">
                  <div className="flex items-center gap-2 text-secondary">
                    <Sparkles size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Navi's Deep Interpretation</h3>
                  </div>
                  <p className="text-lg font-headline font-medium text-foreground/90 leading-relaxed italic">
                    "{matchResult.ai_narrative}"
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-secondary/40 font-bold uppercase tracking-widest border-t border-secondary/10 pt-4">
                    AI generated interpretation for Pro seekers
                  </div>
               </Card>
            ) : (
              <Card className="!rounded-[32px] border-outline-variant/20 bg-surface/30 p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto text-secondary">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-lg font-headline font-bold text-foreground">AI Match Narrative</h3>
                  <p className="text-sm text-foreground/60 max-w-sm mx-auto">
                    Upgrade to Pro to unlock a detailed AI-generated narrative analyzing the subtle karmic bond between these charts.
                  </p>
                  <Button size="sm" variant="secondary" className="rounded-full px-8">Upgrade to Pro</Button>
              </Card>
            )}

            {/* Detailed Breakdown Grid */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-outline-variant/10" />
                <h3 className="text-[12px] font-bold text-foreground/30 uppercase tracking-[0.3em] whitespace-nowrap">The 8 Cosmic Koots</h3>
                <div className="h-[1px] flex-1 bg-outline-variant/10" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchResult.ashtakoot_milan && Object.entries(matchResult.ashtakoot_milan).map(([key, koot]: [string, any], idx) => (
                  <KootCard 
                    key={key}
                    name={koot.name}
                    sanskritName={koot.sanskrit_name}
                    meaning={koot.meaning}
                    obtained={koot.obtained}
                    max={koot.max}
                    detail={koot.detail}
                    delay={idx * 0.1}
                  />
                ))}
              </div>
            </div>

            {/* Dosha Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7">
                <MangalDoshaPanel 
                  person1={{
                    name: person1.name,
                    ...matchResult.mangal_dosha?.groom
                  }}
                  person2={{
                    name: person2.name,
                    ...matchResult.mangal_dosha?.bride
                  }}
                  verdict={matchResult.mangal_dosha?.verdict}
                  isCompatible={matchResult.mangal_dosha?.is_compatible}
                />
              </div>

              <div className="lg:col-span-5">
                <AdditionalDoshas 
                  doshas={[
                    {
                      name: "Rajju Dosha",
                      meaning: "Well-being & Longevity",
                      isClear: matchResult.rajju_dosha?.is_clear,
                      detail: matchResult.rajju_dosha?.detail
                    },
                    {
                      name: "Vedha Dosha",
                      meaning: "Affliction & Obstacles",
                      isClear: matchResult.vedha_dosha?.is_clear,
                      detail: matchResult.vedha_dosha?.detail
                    },
                    {
                      name: "Stree Deergha",
                      meaning: "Happiness for Bride",
                      isClear: matchResult.stree_deergha?.is_clear,
                      detail: matchResult.stree_deergha?.detail
                    }
                  ]}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10 border-t border-outline-variant/10">
                <Button 
                  onClick={resetMatch} 
                  variant="secondary" 
                  size="lg" 
                  className="rounded-2xl px-10"
                >
                  <RotateCcw className="mr-2 w-4 h-4" /> Match Again
                </Button>
                <Button 
                  href="/chat" 
                  size="lg" 
                  className="rounded-2xl px-10 gold-gradient"
                >
                  Ask Navi About This Match <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
