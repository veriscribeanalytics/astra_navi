'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks';
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
  const { error, success, ToastContainer } = useToast();
  
  const [activeTab, setActiveTab] = useState<'match' | 'history'>('match');
  const [phase, setPhase] = useState<'input' | 'loading' | 'result'>('input');
  const [isSubmitting, setIsSending] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [loadingMessage, setLoadingMessage] = useState("Aligning celestial bodies...");

  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadingMessages = [
    "Aligning celestial bodies...",
    "Calculating Ashtakoot Milan...",
    "Analyzing Mangal Dosha...",
    "Checking supplemental alignments...",
    "Generating cosmic verdict..."
  ];

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
  }, [phase]);

  // Fetch history when tab changes
  useEffect(() => {
    if (activeTab === 'history' && isLoggedIn) {
      loadHistory();
    }
  }, [activeTab, isLoggedIn]);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/match/history?limit=10');
      const data = await res.json();
      if (res.ok) setHistory(data.results || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/match/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
        success("Record cleared from history.");
      }
    } catch (err) {
      error("Failed to delete record.");
    }
  };

  const viewHistoryItem = (item: any) => {
    setMatchResult(item.details);
    setPerson1(item.person1_details);
    setPerson2(item.person2_details);
    setPhase('result');
    setActiveTab('match');
  };

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
    setPerson1({ ...p2, gender: p1.gender });
    setPerson2({ ...p1, gender: p2.gender });
  };

  const handleMatch = async () => {
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
    <div className="max-w-6xl mx-auto px-4">
      {ToastContainer}
      {/* Tab Switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex p-1 bg-surface border border-outline-variant/10 rounded-2xl">
          <button
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
                      {/* Person 1 */}
                      <Card className="!rounded-[32px] border-outline-variant/20 bg-surface p-6 sm:p-8 space-y-6">
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

                      <div className="lg:hidden flex justify-center -my-3 relative z-20">
                        <button 
                          onClick={handleSwap}
                          className="w-12 h-12 rounded-full bg-surface border border-outline-variant/30 flex items-center justify-center hover:border-secondary/50 hover:bg-surface-variant/20 transition-all group shadow-xl active:scale-95"
                        >
                          <ArrowLeftRight className="text-foreground/40 group-hover:text-secondary transition-colors" size={20} />
                        </button>
                      </div>

                      {/* Person 2 */}
                      <Card className="!rounded-[32px] border-outline-variant/20 bg-surface p-6 sm:p-8 space-y-6">
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

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:block">
                      <button 
                        onClick={handleSwap}
                        className="w-12 h-12 rounded-full bg-surface border border-outline-variant/30 flex items-center justify-center hover:border-secondary/50 hover:bg-surface-variant/20 transition-all group shadow-2xl"
                      >
                        <ArrowLeftRight className="text-foreground/40 group-hover:text-secondary transition-colors" size={20} />
                      </button>
                    </div>
                  </div>

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
                    <h2 className="text-3xl font-headline font-bold text-foreground">Aligning the Heavens</h2>
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
                          <h2 className="text-3xl font-headline font-bold text-foreground">Celestial Verdict</h2>
                          <p className="text-foreground/60 leading-relaxed font-body">{matchResult.summary}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <PersonCard name={person1.name} gender={person1.gender} {...matchResult.mangal_dosha?.person1} />
                          <PersonCard name={person2.name} gender={person2.gender} {...matchResult.mangal_dosha?.person2} />
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchResult.ashtakoot?.koots?.map((koot: any, idx: number) => {
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
                          person1={{ name: person1.name, ...matchResult.mangal_dosha?.person1 }}
                          person2={{ name: person2.name, ...matchResult.mangal_dosha?.person2 }}
                          verdict={matchResult.mangal_dosha?.conclusion}
                          isCompatible={matchResult.mangal_dosha?.is_compatible ?? true}
                        />
                        <AdditionalDoshas 
                          doshas={matchResult.additional_doshas}
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
            <div className="text-center space-y-2 mb-8">
               <h2 className="text-3xl font-headline font-bold text-foreground">Celestial Archive</h2>
               <p className="text-foreground/40 text-sm">Your previously computed matches are stored in the stars.</p>
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
                <p className="text-foreground/40 font-medium">No celestial history found.</p>
                <Button variant="ghost" onClick={() => setActiveTab('match')} className="mt-4 text-secondary">Compute your first match</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
;
