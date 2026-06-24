'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { clientFetch } from '@/lib/apiClient';
import { useToast } from '@/hooks';
import { PaywallData } from '@/types/paywall';
import PaywallCard from '@/components/paywall/PaywallCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationSearch, { type LocationResult } from '@/components/ui/LocationSearch';
import { tzOffsetHoursAt } from '@/lib/tzOffset';
import { 
  Heart, Sparkles, ArrowLeftRight, 
  RotateCcw, ShieldCheck, ChevronRight, Lock,
  Users
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
  birthPlaceName?: string;
  birthLatitude?: number;
  birthLongitude?: number;
  birthTimezoneName?: string;
  birthTimezoneOffsetAtBirth?: number;
}

interface KootResult {
  name: string;
  description: string;
  obtained: number;
  max: number;
  detail: string | { technical: string; simple: string };
}

interface MangalDoshaDetail {
  is_present: boolean;
  score: number;
  description: string;
  type?: string;
  is_cancelled?: boolean;
}

interface MatchResult {
  id?: string;
  ashtakoot: {
    total_score: number;
    koots: KootResult[];
  };
  tier: {
    tier: string;
    color: string;
    emoji: string;
    label: string;
  };
  summary: string;
  mangal_dosha: {
    person1: MangalDoshaDetail;
    person2: MangalDoshaDetail;
    conclusion: string;
    is_compatible: boolean;
  };
  additional_doshas: {
    name: string;
    is_present: boolean;
    description: string;
    remedy?: string;
  }[];
}

interface HistoryItem {
  id: string;
  score: number;
  created_at: string;
  person1_name: string;
  person2_name: string;
  person1_details?: PersonDetails;
  person2_details?: PersonDetails;
}

type DoshaSeverity = 'none' | 'low' | 'medium' | 'high';

export default function MatchClient() {
  const { user, isLoggedIn } = useAuth();
  const { error, success, ToastContainer } = useToast();
  
  const [activeTab, setActiveTab] = useState<'match' | 'history'>('match');
  const [phase, setPhase] = useState<'input' | 'loading' | 'result'>('input');
  const [isSubmitting, setIsSending] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Analyzing profiles...");

  const [paywall, setPaywall] = useState<PaywallData | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadingMessages = useMemo(() => [
    "Analyzing profiles...",
    "Calculating Ashtakoot Milan...",
    "Checking Mangal Dosha...",
    "Reviewing planetary positions...",
    "Calculating compatibility results..."
  ], []);

  // Cycle loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'loading') {
      let currentIndex = 0;
      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[currentIndex]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [phase, loadingMessages]);

  // Fetch history when tab changes
  useEffect(() => {
    if (activeTab === 'history' && isLoggedIn) {
      loadHistory();
    }
  }, [activeTab, isLoggedIn]);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await clientFetch('/api/match/history?limit=10');
      const data = await res.json();
      if (res.ok) {
        const items: any[] = Array.isArray(data.history) ? data.history : [];
        setHistory(items.map((h) => ({
          id: h.id,
          score: h.score,
          created_at: h.createdAt,
          person1_name: h.person1Name,
          person2_name: h.person2Name,
          person1_details: h.resultData?.person1_details,
          person2_details: h.resultData?.person2_details,
        })));
      }
    } catch (_err) {
      console.error("Failed to load history:", _err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const res = await clientFetch(`/api/match/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
        success("Record cleared from history.");
      }
    } catch {
      error("Failed to delete record.");
    }
  };

  const viewHistoryItem = async (item: HistoryItem) => {
    try {
      setPhase('loading');
      setLoadingMessage("Retrieving from cosmic archives...");
      
      const res = await clientFetch(`/api/match/${item.id}`);
      const data = await res.json();
      
      if (res.ok) {
        const result = data.result || data.details || data;
        setMatchResult(result);
        setPerson1(data.person1_details || result?.person1_details || item.person1_details);
        setPerson2(data.person2_details || result?.person2_details || item.person2_details);
        setPhase('result');
        setActiveTab('match');
      } else {
        error("Failed to retrieve the full record.");
        setPhase('input');
      }
    } catch {
      error("A disruption occurred in the archive retrieval.");
      setPhase('input');
    }
  };

  const [person1, setPerson1] = useState<PersonDetails>({
    name: user?.name || '',
    dob: user?.dob || '',
    tob: user?.tob || '',
    place: user?.pob || '',
    gender: 'male',
    birthPlaceName: user?.birthPlaceName ?? undefined,
    birthLatitude: user?.birthLatitude ?? undefined,
    birthLongitude: user?.birthLongitude ?? undefined,
    birthTimezoneName: user?.birthTimezoneName ?? undefined,
    birthTimezoneOffsetAtBirth: user?.birthTimezoneOffsetAtBirth ?? undefined,
  });

  const [person2, setPerson2] = useState<PersonDetails>({
    name: '',
    dob: '',
    tob: '12:00',
    place: '',
    gender: 'female',
  });

  const [confirmedLocationP1, setConfirmedLocationP1] = useState<LocationResult | null>(() => {
    if (
      typeof user?.birthLatitude === 'number' &&
      typeof user?.birthLongitude === 'number' &&
      user?.birthTimezoneName
    ) {
      return {
        name: user.birthPlaceName || user.pob || '',
        lat: user.birthLatitude,
        lon: user.birthLongitude,
        timezone: user.birthTimezoneName,
      };
    }
    return null;
  });
  const [confirmedLocationP2, setConfirmedLocationP2] = useState<LocationResult | null>(null);

  // Pre-fill person 1 if user data becomes available
  useEffect(() => {
    if (user && !person1.name) {
      setPerson1({
        name: user.name || '',
        dob: user.dob || '',
        tob: user.tob || '',
        place: user.pob || '',
        gender: 'male',
        birthPlaceName: user.birthPlaceName ?? undefined,
        birthLatitude: user.birthLatitude ?? undefined,
        birthLongitude: user.birthLongitude ?? undefined,
        birthTimezoneName: user.birthTimezoneName ?? undefined,
        birthTimezoneOffsetAtBirth: user.birthTimezoneOffsetAtBirth ?? undefined,
      });
      if (
        typeof user.birthLatitude === 'number' &&
        typeof user.birthLongitude === 'number' &&
        user.birthTimezoneName
      ) {
        setConfirmedLocationP1({
          name: user.birthPlaceName || user.pob || '',
          lat: user.birthLatitude,
          lon: user.birthLongitude,
          timezone: user.birthTimezoneName,
        });
      }
    }
  }, [user, person1.name]);

  const handleSwap = () => {
    const p1 = { ...person1 };
    const p2 = { ...person2 };
    setPerson1({ ...p2, gender: p1.gender });
    setPerson2({ ...p1, gender: p2.gender });
    const loc1 = confirmedLocationP1;
    setConfirmedLocationP1(confirmedLocationP2);
    setConfirmedLocationP2(loc1);
  };

  const handleMatch = async () => {
    if (!person1.name || !person1.dob || !person1.place || !person2.name || !person2.dob || !person2.place) {
      error("Please fill all celestial coordinates for both seekers.");
      return;
    }

    const missingCoords = (p: PersonDetails) =>
      typeof p.birthLatitude !== 'number' ||
      typeof p.birthLongitude !== 'number' ||
      !p.birthTimezoneName;
    if (missingCoords(person1)) {
      error("Please select Person 1's exact birth location from the search results.");
      return;
    }
    if (missingCoords(person2)) {
      error("Please select Person 2's exact birth location from the search results.");
      return;
    }

    const offsetP1 = person1.birthTimezoneOffsetAtBirth
      ?? tzOffsetHoursAt(person1.birthTimezoneName, person1.dob, person1.tob);
    const offsetP2 = person2.birthTimezoneOffsetAtBirth
      ?? tzOffsetHoursAt(person2.birthTimezoneName, person2.dob, person2.tob);
    if (offsetP1 === null || offsetP2 === null) {
      error("Could not compute birth-time timezone offset. Please re-select the birth location.");
      return;
    }

    setPhase('loading');
    setIsSending(true);

    try {
      const buildPayload = (p: PersonDetails, offset: number) => ({
        name: p.name,
        dob: p.dob,
        tob: p.tob,
        place: p.place,
        gender: p.gender,
        birthPlaceName: p.birthPlaceName || p.place,
        birthLatitude: p.birthLatitude,
        birthLongitude: p.birthLongitude,
        birthTimezoneName: p.birthTimezoneName,
        birthTimezoneOffsetAtBirth: offset,
        birthTimeFold: null,
      });

      const res = await clientFetch('/api/match?narrative=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1: buildPayload(person1, offsetP1),
          person2: buildPayload(person2, offsetP2),
        }),
      });

      // ── 402 Paywall detection ──
      // If the backend returns 402, the match feature is blocked.
      if (res.status === 402) {
        const data = await res.json();
        if (data.paywall) {
          setPaywall(data.paywall as PaywallData);
          setPhase('input'); // Stay on input step so user can go back
        }
        setIsSending(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'The stars are temporarily misaligned.');
      }

      setMatchResult(data);
      setPhase('result');
      success("Analysis complete!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze profiles. Please check details.";
      error(message);
      setPhase('input');
    } finally {
      setIsSending(false);
    }
  };

  const resetMatch = () => {
    setPhase('input');
    setMatchResult(null);
  };

  const getKootHumanLabel = (name: string) => {
    const labels: Record<string, { label: string; icon: string }> = {
      'Varna': { label: 'Spiritual Alignment', icon: '🌟' },
      'Vashya': { label: 'Mutual Attraction', icon: '🧲' },
      'Tara': { label: 'Star Harmony', icon: '💫' },
      'Yoni': { label: 'Physical Chemistry', icon: '🔥' },
      'Graha Maitri': { label: 'Mental Connection', icon: '🧠' },
      'Gana': { label: 'Temperament Match', icon: '⭐' },
      'Bhakoot': { label: 'Emotional Bond', icon: '💕' },
      'Nadi': { label: 'Health Compatibility', icon: '🏥' },
    };
    return labels[name] || { label: name, icon: '✨' };
  };

  const TabBar = () => (
    <div className="flex justify-center mb-2">
      <div className="inline-flex p-1 bg-surface border border-outline-variant/10 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('match')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'match'
              ? 'bg-secondary text-white shadow-lg'
              : 'text-foreground/40 hover:text-foreground'
          }`}
        >
          New Match
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-secondary text-white shadow-lg'
              : 'text-foreground/40 hover:text-foreground'
          }`}
        >
          History
        </button>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card padding="lg" className="max-w-md w-full text-center !rounded-[32px] border-outline-variant/30">
          <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6 border border-secondary/20">
            <Lock className="w-10 h-10 text-secondary" />
          </div>
          <h2 className="text-2xl font-headline font-bold text-foreground mb-4">
            Login Required
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
    <div className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {ToastContainer}

      {/* Paywall Modal — shown when match is hard-blocked (402) */}
      {paywall && (
        <PaywallCard paywall={paywall} variant="modal" onClose={() => setPaywall(null)} />
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'match' ? (
          <motion.div key="match-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnimatePresence mode="wait">
              {phase === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Header Section */}
                  <div className="text-center space-y-2 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-widest">
                      <Heart size={14} className="fill-current" />
                      Ashtakoot Milan
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-headline font-bold text-foreground tracking-tight">
                      Relationship Analysis
                    </h1>
                    <p className="text-foreground/60 leading-relaxed font-body">
                      Discover your spiritual and personal compatibility using the ancient 36-point Vedic system.
                      Enter the birth details of both individuals to begin.
                    </p>
                  </div>

                  <TabBar />

                  {/* Forms Section */}
                  <div className="relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                      {/* Person 1 */}
                      <Card className="!rounded-[32px] border-outline-variant/20 bg-surface p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <span className="text-xl font-bold">1</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-headline font-bold text-foreground leading-tight">First Person</h3>
                            <p className="text-[11px] text-[#AAA3B8] font-bold uppercase tracking-widest">Groom Details</p>
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
                              helperText="e.g. 11 Nov 2001"
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
                          <LocationSearch
                            label="Place of Birth"
                            placeholder="Search city, e.g. New Delhi"
                            value={person1.place || person1.birthPlaceName}
                            confirmedLocation={confirmedLocationP1}
                            required
                            onSelect={(loc: LocationResult) => {
                              setPerson1({
                                ...person1,
                                place: loc.name,
                                birthPlaceName: loc.name,
                                birthLatitude: loc.lat,
                                birthLongitude: loc.lon,
                                birthTimezoneName: loc.timezone,
                                birthTimezoneOffsetAtBirth: undefined,
                              });
                              setConfirmedLocationP1(loc);
                            }}
                            onChange={(text: string) => {
                              const stillMatches = confirmedLocationP1?.name === text;
                              setPerson1({
                                ...person1,
                                place: text,
                                birthPlaceName: stillMatches ? confirmedLocationP1?.name : undefined,
                                birthLatitude: stillMatches ? confirmedLocationP1?.lat : undefined,
                                birthLongitude: stillMatches ? confirmedLocationP1?.lon : undefined,
                                birthTimezoneName: stillMatches ? confirmedLocationP1?.timezone : undefined,
                                birthTimezoneOffsetAtBirth: undefined,
                              });
                              if (!stillMatches) setConfirmedLocationP1(null);
                            }}
                          />
                        </div>
                      </Card>

                      <div className="lg:hidden flex justify-center -my-3 relative z-20">
                        <button
                          type="button"
                          onClick={handleSwap}
                          title="Swap people"
                          className="w-10 h-10 rounded-full bg-surface border border-outline-variant/30 flex items-center justify-center hover:border-[rgba(201,151,46,0.50)] hover:bg-[rgba(201,151,46,0.15)] hover:shadow-lg transition-all group active:scale-95"
                        >
                          <ArrowLeftRight className="text-foreground/60 group-hover:text-secondary transition-colors" size={22} />
                        </button>
                      </div>

                      {/* Person 2 */}
                      <Card className="!rounded-[32px] border-outline-variant/20 bg-surface p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                          <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
                            <span className="text-xl font-bold">2</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-headline font-bold text-foreground leading-tight">Second Person</h3>
                            <p className="text-[11px] text-[#AAA3B8] font-bold uppercase tracking-widest">Bride Details</p>
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
                              helperText="e.g. 11 Nov 2001"
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
                          <LocationSearch
                            label="Place of Birth"
                            placeholder="Search city, e.g. Mumbai"
                            value={person2.place || person2.birthPlaceName}
                            confirmedLocation={confirmedLocationP2}
                            required
                            onSelect={(loc: LocationResult) => {
                              setPerson2({
                                ...person2,
                                place: loc.name,
                                birthPlaceName: loc.name,
                                birthLatitude: loc.lat,
                                birthLongitude: loc.lon,
                                birthTimezoneName: loc.timezone,
                                birthTimezoneOffsetAtBirth: undefined,
                              });
                              setConfirmedLocationP2(loc);
                            }}
                            onChange={(text: string) => {
                              const stillMatches = confirmedLocationP2?.name === text;
                              setPerson2({
                                ...person2,
                                place: text,
                                birthPlaceName: stillMatches ? confirmedLocationP2?.name : undefined,
                                birthLatitude: stillMatches ? confirmedLocationP2?.lat : undefined,
                                birthLongitude: stillMatches ? confirmedLocationP2?.lon : undefined,
                                birthTimezoneName: stillMatches ? confirmedLocationP2?.timezone : undefined,
                                birthTimezoneOffsetAtBirth: undefined,
                              });
                              if (!stillMatches) setConfirmedLocationP2(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => error("Select from Family is coming soon.")}
                            title="Load a family member's profile"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-outline-variant/20 text-xs font-bold text-[#AAA3B8] hover:text-foreground hover:border-secondary/40 hover:bg-secondary/5 transition-all"
                          >
                            <Users className="w-4 h-4" />
                            Select from Family
                          </button>
                        </div>
                      </Card>
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:block">
                      <button
                        type="button"
                        onClick={handleSwap}
                        title="Swap people"
                        className="w-10 h-10 rounded-full bg-surface border border-outline-variant/30 flex items-center justify-center hover:border-[rgba(201,151,46,0.50)] hover:bg-[rgba(201,151,46,0.15)] hover:shadow-lg transition-all group active:scale-95"
                      >
                        <ArrowLeftRight className="text-foreground/60 group-hover:text-secondary transition-colors" size={22} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <button
                      type="button"
                      onClick={handleMatch}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-12 py-5 rounded-2xl bg-gradient-to-br from-[#C9972E] via-[#D8AD43] to-[#C9972E] text-[#170C2D] shadow-lg shadow-[rgba(201,151,46,0.16)] hover:shadow-[rgba(201,151,46,0.24)] hover:via-[#D8AD43] active:scale-95 transition-all text-[14px] uppercase tracking-[0.2em] font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      {isSubmitting && <RotateCcw className="w-4 h-4 animate-spin" />}
                      Calculate Compatibility <Sparkles className="w-4 h-4" />
                    </button>
                    <p className="text-[11px] text-[#AAA3B8] font-bold uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={12} className="text-green-500/60" />
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
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8"
                >
                  <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
                    <motion.div 
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" as const }}
                      className="absolute inset-0 rounded-full border border-secondary/10 shadow-[0_0_50px_rgba(255,184,0,0.05)]"
                    />
                    <motion.div 
                      animate={{ rotate: -360, scale: [1, 1.05, 1] }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" as const }}
                      className="absolute inset-8 rounded-full border border-pink-500/10 shadow-[0_0_30px_rgba(236,72,153,0.05)]"
                    />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shadow-[0_0_20px_rgba(255,184,0,0.2)]">
                        <Sparkles className="animate-pulse" size={32} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 max-w-md mx-auto px-6">
                    <h2 className="text-3xl font-headline font-bold text-foreground">Analyzing Charts</h2>
                    <div className="h-6 flex items-center justify-center overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.p key={loadingMessage} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-lg text-secondary font-medium tracking-wide italic">
                          {loadingMessage}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

              {phase === 'result' && matchResult && (
                <motion.div 
                  key="result" 
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-surface/20 rounded-[40px] border border-outline-variant/10 p-8 sm:p-12 relative overflow-hidden">
                    <MatchScoreRing score={matchResult.ashtakoot?.total_score || 0} tier={matchResult.tier} />
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="space-y-2">
                          <h2 className="text-3xl font-headline font-bold text-foreground">Compatibility Result</h2>
                          <p className="text-foreground/60 leading-relaxed font-body">{matchResult.summary}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <PersonCard name={person1.name} gender={person1.gender} {...matchResult.mangal_dosha?.person1} />
                          <PersonCard name={person2.name} gender={person2.gender} {...matchResult.mangal_dosha?.person2} />
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchResult.ashtakoot?.koots?.map((koot: KootResult, idx: number) => {
                      const humanLabel = getKootHumanLabel(koot.name);
                      return (
                        <KootCard 
                          key={idx}
                          name={`${humanLabel.icon} ${humanLabel.label}`}
                          sanskritName={koot.name}
                          meaning={koot.description}
                          obtained={koot.obtained}
                          max={koot.max}
                          detail={koot.detail}
                          delay={idx * 0.05}
                        />
                      );
                    })}
                  </div>

                  {/* Dosha Analysis Section */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-outline-variant/20"></div>
                        <h3 className="text-[11px] font-bold text-foreground/40 uppercase tracking-[0.3em]">Dosha Analysis</h3>
                        <div className="h-px flex-1 bg-outline-variant/20"></div>
                     </div>
                     
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <MangalDoshaPanel 
                          person1={{ 
                            name: person1.name, 
                            hasDosha: matchResult.mangal_dosha?.person1.is_present,
                            isCancelled: matchResult.mangal_dosha?.person1.is_cancelled ?? false,
                            severity: (matchResult.mangal_dosha?.person1.score > 75 ? 'high' : matchResult.mangal_dosha?.person1.score > 40 ? 'medium' : matchResult.mangal_dosha?.person1.score > 0 ? 'low' : 'none') as DoshaSeverity,
                            cancellationReason: matchResult.mangal_dosha?.person1.description
                          }}
                          person2={{ 
                            name: person2.name, 
                            hasDosha: matchResult.mangal_dosha?.person2.is_present,
                            isCancelled: matchResult.mangal_dosha?.person2.is_cancelled ?? false,
                            severity: (matchResult.mangal_dosha?.person2.score > 75 ? 'high' : matchResult.mangal_dosha?.person2.score > 40 ? 'medium' : matchResult.mangal_dosha?.person2.score > 0 ? 'low' : 'none') as DoshaSeverity,
                            cancellationReason: matchResult.mangal_dosha?.person2.description
                          }}
                          verdict={matchResult.mangal_dosha?.conclusion}
                          isCompatible={matchResult.mangal_dosha?.is_compatible ?? true}
                        />
                        <AdditionalDoshas 
                          doshas={matchResult.additional_doshas?.map(d => ({
                            name: d.name,
                            isClear: !d.is_present,
                            meaning: d.description,
                            detail: d.remedy || 'No specific remedy required.'
                          })) || []}
                        />
                     </div>
                  </div>

                  <div className="flex justify-center pt-10 border-t border-outline-variant/10">
                      <Button onClick={resetMatch} variant="secondary" size="lg" className="rounded-2xl px-10">
                        <RotateCcw className="mr-2 w-4 h-4" /> Match Again
                      </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="history-tab" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <TabBar />
            <div className="text-center space-y-2 mb-8">
               <h2 className="text-3xl font-headline font-bold text-foreground">Match History</h2>
               <p className="text-foreground/40 text-sm">Your previously computed matches are saved for your review.</p>
            </div>
            {isLoadingHistory ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-surface/30 rounded-[24px] animate-pulse border border-outline-variant/10" />
                ))}
              </div>
            ) : history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map((item) => (
                  <Card key={item.id} className="!rounded-[24px] border-outline-variant/10 bg-surface/20 hover:border-secondary/30 transition-all p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.score >= 25 ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          Score: {item.score}/36
                        </div>
                        <span className="text-[10px] text-foreground/20 font-bold uppercase">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => deleteHistoryItem(item.id)} className="text-foreground/20 hover:text-red-400 transition-colors p-1"><RotateCcw size={14} className="rotate-45" /></button>
                    </div>
                    <div className="flex items-center gap-4 mb-5">
                       <div className="flex-1 text-center">
                          <p className="text-xs text-foreground/40 uppercase font-bold tracking-widest mb-1">Groom</p>
                          <p className="font-headline font-bold text-foreground truncate">{item.person1_name}</p>
                       </div>
                       <Heart size={16} className="text-pink-500/40" />
                       <div className="flex-1 text-center">
                          <p className="text-xs text-foreground/40 uppercase font-bold tracking-widest mb-1">Bride</p>
                          <p className="font-headline font-bold text-foreground truncate">{item.person2_name}</p>
                       </div>
                    </div>
                    <Button fullWidth variant="secondary" size="sm" onClick={() => viewHistoryItem(item)} className="rounded-xl">View Full Analysis <ChevronRight size={14} className="ml-1" /></Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-surface/10 rounded-[40px] border border-dashed border-outline-variant/20">
                <p className="text-foreground/40 font-medium">No saved history found.</p>
                <Button variant="ghost" onClick={() => setActiveTab('match')} className="mt-4 text-secondary">Compute your first match</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
