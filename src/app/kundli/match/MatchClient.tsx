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
import { isUnder18 } from '@/utils/age';
import { 
  Heart, Sparkles, ArrowLeftRight, 
  RotateCcw, ChevronRight, Lock,
  MessageCircle, Info, Search, Trash2
} from 'lucide-react';

// Components
import MatchScoreRing from '@/components/match/MatchScoreRing';
import KootCard from '@/components/match/KootCard';
import MangalDoshaPanel from '@/components/match/MangalDoshaPanel';
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
  // Moon-sign details (sourced from the backend's groom/bride_details) so the
  // PersonCard spread ({...mangal_dosha.person1}) can render rashi/nakshatra.
  rashi?: string;
  rashiEn?: string;
  nakshatra?: string;
  pada?: number | string;
}

interface MatchResult {
  id?: string;
  ashtakoot: {
    total_score: number;
    max_score?: number;
    percentage?: number;
    verdict?: string;
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

// Maps the backend's native severity strings to a numeric score that feeds the
// existing render's score-threshold severity computation (lines below) so the
// correct tier badge is shown without altering the render code.
const SEVERITY_SCORE: Record<string, number> = {
  none: 0, mild: 10, moderate: 50, high: 80,
};

/**
 * Normalizes the backend `/api/match` result shape into the `MatchResult`
 * shape this component's render code expects.
 *
 * The backend returns `groom_details`/`bride_details` (moon sign + nakshatra),
 * `mangal_dosha.{person1,person2,compatible,note}` and an `additional` object,
 * whereas the render reads `mangal_dosha.{person1.is_present,is_cancelled,...}`,
 * `conclusion`, `is_compatible` and an `additional_doshas` array. This adapter
 * bridges that gap so saved (history) AND fresh results render identically.
 */
type BackendPersonDosha = {
  has_dosha?: boolean;
  is_present?: boolean;
  severity?: string;
  cancellations?: string[];
};

type BackendMoonDetails = {
  name?: string;
  moon_sign?: string;
  nakshatra?: string;
  pada?: number | string;
};

type BackendAdditionalDosha = { present?: boolean; compatible?: boolean; detail?: string };

type BackendMatchResult = {
  id?: string;
  ashtakoot?: MatchResult['ashtakoot'];
  tier?: MatchResult['tier'];
  summary?: string;
  mangal_dosha?: {
    person1?: BackendPersonDosha;
    person2?: BackendPersonDosha;
    note?: string;
    conclusion?: string;
    compatible?: boolean;
    is_compatible?: boolean;
  };
  groom_details?: BackendMoonDetails;
  bride_details?: BackendMoonDetails;
  additional?: Record<string, BackendAdditionalDosha>;
};

function normalizeMatchResult(raw: BackendMatchResult | null | undefined): MatchResult {
  const md = raw?.mangal_dosha || {};
  const groom = raw?.groom_details || {};
  const bride = raw?.bride_details || {};
  const additional = raw?.additional || {};

  const buildPersonDosha = (
    p: BackendPersonDosha | undefined,
    moon: BackendMoonDetails,
  ): MangalDoshaDetail => ({
    is_present: !!(p?.has_dosha ?? p?.is_present),
    score: SEVERITY_SCORE[String(p?.severity || 'none').toLowerCase()] ?? 0,
    description:
      Array.isArray(p?.cancellations) && p.cancellations.length
        ? p.cancellations.join(', ')
        : (md.note || ''),
    type: p?.severity,
    is_cancelled: Array.isArray(p?.cancellations) && p.cancellations.length > 0,
    rashi: moon?.moon_sign,
    rashiEn: moon?.moon_sign,
    nakshatra: moon?.nakshatra,
    pada: moon?.pada,
  });

  const additional_doshas: MatchResult['additional_doshas'] = [];
  if (additional && typeof additional === 'object') {
    if (additional.rajju_dosha) {
      additional_doshas.push({
        name: 'Rajju Dosha',
        is_present: !!additional.rajju_dosha.present,
        description: additional.rajju_dosha.detail || '',
      });
    }
    if (additional.vedha_dosha) {
      additional_doshas.push({
        name: 'Vedha Dosha',
        is_present: !!additional.vedha_dosha.present,
        description: additional.vedha_dosha.detail || '',
      });
    }
    if (additional.stree_deergha) {
      additional_doshas.push({
        name: 'Stree Deergha',
        is_present: !additional.stree_deergha.compatible,
        description: additional.stree_deergha.detail || '',
      });
    }
  }

  return {
    id: raw?.id,
    ashtakoot: raw?.ashtakoot || { total_score: 0, koots: [] },
    tier: raw?.tier || { tier: '', color: '', emoji: '', label: '' },
    summary: raw?.summary || '',
    mangal_dosha: {
      person1: buildPersonDosha(md.person1, groom),
      person2: buildPersonDosha(md.person2, bride),
      conclusion: md.note || md.conclusion || '',
      is_compatible: md.compatible ?? md.is_compatible ?? true,
    },
    additional_doshas,
  };
}

const KOOT_LABELS: Record<string, { label: string; icon: string }> = {
  'Varna': { label: 'Spiritual Alignment', icon: '🌟' },
  'Vashya': { label: 'Mutual Attraction', icon: '🧲' },
  'Tara': { label: 'Star Harmony', icon: '💫' },
  'Yoni': { label: 'Physical Chemistry', icon: '🔥' },
  'Graha Maitri': { label: 'Mental Connection', icon: '🧠' },
  'Gana': { label: 'Temperament Match', icon: '⭐' },
  'Bhakoot': { label: 'Emotional Bond', icon: '💕' },
  'Nadi': { label: 'Health Compatibility', icon: '🏥' },
};

type KootSummary = { label: string; sanskrit: string; obtained: number; max: number };

/**
 * Splits the 8 koot results into "strengths" (highest score ratios) and
 * "concerns" (lowest score ratios) so the user immediately sees what is
 * working and what needs attention — before drilling into the detail cards.
 */
function getStrengthsAndConcerns(koots: KootResult[]): { strengths: KootSummary[]; concerns: KootSummary[] } {
  const ranked = [...koots]
    .map((k) => {
      const ratio = k.max > 0 ? k.obtained / k.max : 0;
      const human = KOOT_LABELS[k.name] || { label: k.name, icon: '✨' };
      return {
        label: human.label,
        sanskrit: k.name,
        obtained: k.obtained,
        max: k.max,
        ratio,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);

  // Strengths: ratio >= 0.7. Concerns: ratio < 0.5.
  const strengths = ranked.filter((k) => k.ratio >= 0.7).slice(0, 4);
  const concerns = ranked.filter((k) => k.ratio < 0.5).slice(0, 4).reverse();

  return {
    strengths: strengths.map(({ ratio: _r, ...rest }) => rest),
    concerns: concerns.map(({ ratio: _r, ...rest }) => rest),
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Builds a single human-readable result line from the computed strengths and
 * concerns. Replaces the backend's metric-heavy "With X out of Y points (Z%),
 * this is a ... match" summary with something an Indian family can read aloud.
 */
function buildHumanSummary(koots: KootResult[]): string {
  const { strengths, concerns } = getStrengthsAndConcerns(koots);
  const sLabels = strengths.slice(0, 2).map((s) => s.label.toLowerCase());
  const cLabels = concerns.slice(0, 2).map((s) => s.label.toLowerCase());
  let out = '';
  if (sLabels.length) {
    out += `${cap(sLabels[0])}${sLabels[1] ? ` and ${sLabels[1]}` : ''} look strong. `;
  }
  if (cLabels.length) {
    out += `${cap(cLabels[0])}${cLabels[1] ? ' and ' + cLabels[1] : ''} need understanding and communication.`;
  }
  return out.trim();
}

function getMatchVerdict(score: number) {
  if (score >= 30) return { label: 'Strong Match', tone: 'emerald' as const };
  if (score >= 24) return { label: 'Good Match', tone: 'green' as const };
  if (score >= 18) return { label: 'Average Match', tone: 'amber' as const };
  return { label: 'Needs Attention', tone: 'red' as const };
}

const VERDICT_TONES: Record<'emerald' | 'green' | 'amber' | 'red', { pill: string; bar: string }> = {
  emerald: { pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25', bar: 'bg-emerald-500/70' },
  green:   { pill: 'bg-green-500/10 text-green-300 border-green-500/25',     bar: 'bg-green-500/70' },
  amber:   { pill: 'bg-amber-500/10 text-amber-300 border-amber-500/25',     bar: 'bg-amber-500/70' },
  red:     { pill: 'bg-red-500/10 text-red-300 border-red-500/25',           bar: 'bg-red-500/70' },
};

const titleCaseName = (name: string) =>
  (name || '').trim().replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');

const formatHistoryDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

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
  const [historySort, setHistorySort] = useState<'recent' | 'highest'>('recent');
  const [historySearch, setHistorySearch] = useState('');

  const visibleHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    const filtered = history.filter((it) =>
      !q ||
      (it.person1_name || '').toLowerCase().includes(q) ||
      (it.person2_name || '').toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) =>
      historySort === 'highest'
        ? b.score - a.score
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [history, historySearch, historySort]);

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
        const items: {
          id: string; score: number; createdAt: string;
          person1Name: string; person2Name: string;
          resultData?: { person1_details?: PersonDetails; person2_details?: PersonDetails };
        }[] = Array.isArray(data.history) ? data.history : [];
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
        // GET /api/match/{id} returns { id, result: <saved details> }.
        const raw = data.result || data.details || data;
        setMatchResult(normalizeMatchResult(raw));

        // The saved result stores moon/rashi info under groom/bride_details and
        // has no person1_details/person2_details. Reconstruct PersonDetails from
        // the saved names (falling back to the history-list names) so the result
        // render — which reads person1.name / person2.name directly — never
        // receives undefined (which previously crashed the page).
        const groom = raw?.groom_details || {};
        const bride = raw?.bride_details || {};
        setPerson1((prev) => ({
          ...prev,
          name: item.person1_name || groom.name || prev.name,
        }));
        setPerson2((prev) => ({
          ...prev,
          name: item.person2_name || bride.name || prev.name,
        }));

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

    // DPDP §9: adults-only service — block compatibility matching involving a minor.
    if (isUnder18(person1.dob) || isUnder18(person2.dob)) {
      error("Compatibility matching is for adults (18+) only.");
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

      setMatchResult(normalizeMatchResult(data));
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

  const getKootHumanLabel = (name: string) => KOOT_LABELS[name] || { label: name, icon: '✨' };

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
                  className="space-y-6"
                >
                  {/* Header + Toggle */}
                  <div className="space-y-4">
                    <div className="text-center space-y-2 max-w-2xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-widest">
                        <Heart size={14} className="fill-current" />
                        Ashtakoot Milan
                      </div>
                      <h1 className="text-4xl sm:text-5xl font-headline font-bold text-foreground tracking-tight">
                        Relationship Analysis
                      </h1>
                      <p className="text-foreground/60 leading-relaxed font-body">
                        Discover your compatibility through the 36-point Vedic matching system.
                        Enter both birth details to get a detailed relationship analysis.
                      </p>
                    </div>

                    <TabBar />
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
                            <h3 className="text-lg font-headline font-bold text-foreground leading-tight">First Person</h3>
                            <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest">Groom Details</p>
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
                          className="w-11 h-11 rounded-full bg-surface border border-secondary/25 shadow-[0_4px_16px_rgba(0,0,0,0.3),0_0_0_4px_rgba(201,151,46,0.05)] flex items-center justify-center hover:border-secondary/60 hover:bg-secondary/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_0_18px_rgba(201,151,46,0.28)] transition-all group active:scale-95"
                        >
                          <ArrowLeftRight className="text-foreground/70 group-hover:text-secondary transition-colors" size={22} />
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
                            <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest">Bride Details</p>
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
                        </div>
                      </Card>
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:block">
                      <button
                        type="button"
                        onClick={handleSwap}
                        title="Swap people"
                        className="w-11 h-11 rounded-full bg-surface border border-secondary/25 shadow-[0_4px_16px_rgba(0,0,0,0.3),0_0_0_4px_rgba(201,151,46,0.05)] flex items-center justify-center hover:border-secondary/60 hover:bg-secondary/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_0_18px_rgba(201,151,46,0.28)] transition-all group active:scale-95"
                      >
                        <ArrowLeftRight className="text-foreground/70 group-hover:text-secondary transition-colors" size={22} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleMatch}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-12 py-4 rounded-2xl bg-gradient-to-br from-[#C9972E] via-[#D8AD43] to-[#C9972E] text-[#170C2D] shadow-lg shadow-[rgba(201,151,46,0.16)] hover:shadow-[rgba(201,151,46,0.24)] hover:via-[#D8AD43] active:scale-95 transition-all text-[14px] uppercase tracking-[0.2em] font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      {isSubmitting && <RotateCcw className="w-4 h-4 animate-spin" />}
                      Calculate Compatibility <Sparkles className="w-4 h-4" />
                    </button>
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
                  className="space-y-8"
                >
                  {/* ── Hero Result Card ── */}
                  <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8 bg-surface/60 rounded-[32px] border border-outline-variant/10 p-5 sm:p-6 relative overflow-hidden">
                    <MatchScoreRing
                      score={matchResult.ashtakoot?.total_score || 0}
                      maxScore={matchResult.ashtakoot?.max_score || 36}
                      percentage={matchResult.ashtakoot?.percentage}
                      tier={matchResult.tier}
                    />
                    <div className="flex-1 w-full space-y-3 text-center md:text-left">
                      <h2 className="text-2xl sm:text-3xl font-headline font-bold text-foreground leading-snug">
                        This is a{/^[aeiou]/i.test(matchResult.tier?.label || '') ? 'n' : ''}{' '}
                        {(matchResult.tier?.label || 'match').toLowerCase()} match with{' '}
                        {matchResult.ashtakoot?.total_score || 0}/36 points.
                      </h2>
                      <p className="text-foreground/60 leading-relaxed font-body text-sm sm:text-base">
                        {buildHumanSummary(matchResult.ashtakoot?.koots || []) || matchResult.summary}
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-2 sm:gap-3 pt-1">
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/15">
                          <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider shrink-0">
                            {person1.gender === 'female' ? 'Bride' : 'Groom'}:
                          </span>
                          <span className="text-sm font-headline font-bold text-foreground truncate max-w-[160px]">
                            {person1.name || '—'}
                          </span>
                          {matchResult.mangal_dosha?.person1?.rashi && (
                            <span className="text-[11px] text-secondary/80 font-bold shrink-0">· {matchResult.mangal_dosha.person1.rashi}</span>
                          )}
                        </div>
                        <Heart size={14} className="text-pink-500/50 shrink-0 hidden sm:block self-center" />
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/15">
                          <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider shrink-0">
                            {person2.gender === 'female' ? 'Bride' : 'Groom'}:
                          </span>
                          <span className="text-sm font-headline font-bold text-foreground truncate max-w-[160px]">
                            {person2.name || '—'}
                          </span>
                          {matchResult.mangal_dosha?.person2?.rashi && (
                            <span className="text-[11px] text-secondary/80 font-bold shrink-0">· {matchResult.mangal_dosha.person2.rashi}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center md:justify-start pt-2">
                        <Button href="/chat" variant="secondary" size="md" className="rounded-2xl" leftIcon={<MessageCircle className="w-4 h-4" />}>
                          Ask AI About This Match
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* ── Quick Summary: Strengths vs Needs Attention ── */}
                  {(() => {
                    const { strengths, concerns } = getStrengthsAndConcerns(matchResult.ashtakoot?.koots || []);
                    if (!strengths.length && !concerns.length) return null;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-green-500/15 bg-surface/55 p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest">Strengths</h3>
                          </div>
                          {strengths.length > 0 ? (
                            <ul className="space-y-2">
                              {strengths.map((s) => (
                                <li key={s.sanskrit} className="flex items-center justify-between">
                                  <span className="text-sm text-foreground/75 font-medium">{s.label}</span>
                                  <span className="text-xs font-bold text-green-500/80">{s.obtained}/{s.max}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-foreground/40 italic">No standout strong areas.</p>
                          )}
                        </div>
                        <div className="rounded-2xl border border-amber-500/15 bg-surface/55 p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Needs Attention</h3>
                          </div>
                          {concerns.length > 0 ? (
                            <ul className="space-y-2">
                              {concerns.map((s) => (
                                <li key={s.sanskrit} className="flex items-center justify-between">
                                  <span className="text-sm text-foreground/75 font-medium">{s.label}</span>
                                  <span className="text-xs font-bold text-amber-500/80">{s.obtained}/{s.max}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-foreground/40 italic">No major concern areas.</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Compatibility Breakdown ── */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-headline font-bold text-foreground/70 uppercase tracking-[0.18em] text-left">
                        Compatibility Breakdown
                      </h3>
                      <p className="text-[11px] text-foreground/35 font-medium mt-1 text-left">
                        Detailed score across 8 matching factors
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matchResult.ashtakoot?.koots?.map((koot: KootResult, idx: number) => {
                        const humanLabel = getKootHumanLabel(koot.name);
                        return (
                          <KootCard 
                            key={idx}
                            name={humanLabel.label}
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
                  </div>

                  {/* Dosha Analysis Section */}
                  <div className="space-y-6">
                     <div>
                       <h3 className="text-sm font-headline font-bold text-foreground/70 uppercase tracking-[0.18em] text-left">
                         Dosha Analysis
                       </h3>
                       <p className="text-[11px] text-foreground/35 font-medium mt-1 text-left">
                         Mangal Dosha and supplemental Vedic risk checks
                       </p>
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

                  {/* Final Note */}
                  {(() => {
                    const concerns: string[] = [];
                    if (matchResult.mangal_dosha && !matchResult.mangal_dosha.is_compatible) concerns.push('Mangal Dosha');
                    (matchResult.additional_doshas || []).forEach((d) => { if (d.is_present) concerns.push(d.name); });

                    const tierLabel = (matchResult.tier?.label || 'match').toLowerCase();
                    const noteText = concerns.length
                      ? `The 36-point score is ${tierLabel}, but ${concerns.join(' and ')} ${concerns.length > 1 ? 'should be' : 'should be'} reviewed carefully before making a final marriage decision.`
                      : `The 36-point score is ${tierLabel}, and no major dosha concerns were found. The match is well-supported across the Ashtakoot system.`;

                    return (
                      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
                        concerns.length ? 'border-amber-500/20 bg-amber-500/[0.04]' : 'border-green-500/20 bg-green-500/[0.04]'
                      }`}>
                        <Info size={16} className={`shrink-0 mt-0.5 ${concerns.length ? 'text-amber-500' : 'text-green-500'}`} />
                        <div>
                          <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${concerns.length ? 'text-amber-500' : 'text-green-500'}`}>
                            Final Note
                          </h4>
                          <p className="text-[13px] text-foreground/75 leading-relaxed font-body">
                            {noteText}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* End-of-flow CTAs */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                    <Button href="/chat" variant="primary" size="lg" className="rounded-2xl px-8" leftIcon={<MessageCircle className="w-4 h-4" />}>
                      Ask AI About This Match
                    </Button>
                    <Button onClick={resetMatch} variant="secondary" size="lg" className="rounded-2xl px-8" leftIcon={<RotateCcw className="w-4 h-4" />}>
                      Match Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="history-tab" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <TabBar />
            <div className="text-center space-y-2 mb-6">
               <h2 className="text-3xl font-headline font-bold text-foreground">Match History</h2>
               <p className="text-foreground/40 text-sm">Your previously computed matches are saved for your review.</p>
            </div>

            {isLoadingHistory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-surface/30 rounded-[22px] animate-pulse border border-outline-variant/10" />
                ))}
              </div>
            ) : history.length > 0 ? (
              <>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search by name..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-surface/60 border border-outline-variant/15 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-secondary/40 transition-colors"
                    />
                  </div>
                  <div className="inline-flex p-1 bg-surface/60 border border-outline-variant/15 rounded-2xl self-start sm:self-auto">
                    {([['recent', 'Recent'], ['highest', 'Highest Score']] as const).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setHistorySort(key)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          historySort === key ? 'bg-secondary/15 text-secondary' : 'text-foreground/40 hover:text-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {visibleHistory.length === 0 ? (
                  <div className="text-center py-16 bg-surface/10 rounded-[32px] border border-dashed border-outline-variant/20">
                    <p className="text-foreground/40 font-medium">No matches found for &quot;{historySearch}&quot;.</p>
                    <Button variant="ghost" onClick={() => setHistorySearch('')} className="mt-4 text-secondary">Clear search</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleHistory.map((item) => {
                      const verdict = getMatchVerdict(item.score);
                      const tone = VERDICT_TONES[verdict.tone];
                      const label1 = item.person1_details?.gender === 'female' ? 'Bride' : 'Groom';
                      const label2 = item.person2_details?.gender === 'male' ? 'Groom' : 'Bride';
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => viewHistoryItem(item)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viewHistoryItem(item); } }}
                          className="group relative rounded-[22px] bg-surface/40 border border-outline-variant/10 hover:border-secondary/30 hover:bg-surface/60 hover:-translate-y-[2px] transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                        >
                          <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${tone.bar}`} aria-hidden="true" />
                          <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`inline-flex items-baseline gap-0.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${tone.pill}`}>
                                  <span className="text-sm font-headline tabular-nums">{item.score}</span>
                                  <span className="opacity-60">/36</span>
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${tone.pill}`}>
                                  {verdict.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[11px] text-foreground/40 font-medium tabular-nums">{formatHistoryDate(item.created_at)}</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                                  title="Remove from history"
                                  className="text-foreground/25 hover:text-red-400 hover:bg-red-500/10 transition-colors p-1.5 rounded-lg"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mb-0.5">{label1}</p>
                                <p className="font-headline font-bold text-foreground text-base sm:text-lg leading-tight truncate">{titleCaseName(item.person1_name) || '—'}</p>
                              </div>
                              <Heart size={16} className="text-pink-500/45 shrink-0 fill-pink-500/10" />
                              <div className="flex-1 min-w-0 text-right">
                                <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mb-0.5">{label2}</p>
                                <p className="font-headline font-bold text-foreground text-base sm:text-lg leading-tight truncate">{titleCaseName(item.person2_name) || '—'}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end mt-3 pt-3 border-t border-outline-variant/10">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary/80 group-hover:text-secondary transition-colors">
                                View Analysis
                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
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
