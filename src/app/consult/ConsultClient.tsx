'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';
import { PaywallData } from '@/types/paywall';
import PaywallCard from '@/components/paywall/PaywallCard';
import { 
  calculateAge, 
  getAgeGroup, 
  Category, 
  SubCategory, 
  AgeGroup, 
  ResponseTone, 
  TONE_OPTIONS 
} from '@/data/consultationTree';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationSearch, { type LocationResult } from '@/components/ui/LocationSearch';
import { tzOffsetHoursAt } from '@/lib/tzOffset';
import GlassPanel from '@/components/ui/GlassPanel';
import Particles from '@/components/ui/Particles';
import { ChevronRight, ChevronLeft, Sparkles, Send, RefreshCw, Calendar, MapPin, Clock, MessageSquare, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { Skeleton, SkeletonCircle } from '@/components/ui/Skeleton';
import ReadingContent from './ReadingContent';

type Step = 'birth' | 'categories' | 'subcategories' | 'questions' | 'reading';

const stepsOrder: Step[] = ['birth', 'categories', 'subcategories', 'questions', 'reading'];
const stepLabels: Record<Step, string> = {
  birth: 'Birth',
  categories: 'Domain',
  subcategories: 'Focus',
  questions: 'Query',
  reading: 'Insight'
};

const ConsultClient: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();
  const { language } = useTranslation();
  const router = useRouter();

  // Wizard State
  const [step, setStep] = useState<Step>('birth');
  const [age, setAge] = useState<number | null>(null);
  const [ageGroupInfo, setAgeGroupInfo] = useState<{ key: string; label: string; lifeStage: string } | null>(null);
  const [tree, setTree] = useState<AgeGroup | null>(null);
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  // Form State
  const [birthDate, setBirthDate] = useState(user?.dob || '');
  const [birthTime, setBirthTime] = useState(user?.tob || '');
  const [birthPlace, setBirthPlace] = useState(user?.pob || '');
  const [birthLatitude, setBirthLatitude] = useState<number | undefined>(user?.birthLatitude ?? undefined);
  const [birthLongitude, setBirthLongitude] = useState<number | undefined>(user?.birthLongitude ?? undefined);
  const [birthTimezoneName, setBirthTimezoneName] = useState<string | undefined>(user?.birthTimezoneName ?? undefined);
  const [confirmedLocation, setConfirmedLocation] = useState<LocationResult | null>(() => {
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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [tone, setTone] = useState<ResponseTone>('warm');
  const [note, setNote] = useState('');
  const [showHiddenCategories, setShowHiddenCategories] = useState(false);

  // Reading State
  const [isReading, setIsReading] = useState(false);
  const [readingText, setReadingText] = useState('');
  const readingEndRef = useRef<HTMLDivElement>(null);

  // Paywall State
  const [paywall, setPaywall] = useState<PaywallData | null>(null);

  // Sync with user profile if available
  useEffect(() => {
    if (user?.dob) setBirthDate(user.dob);
    if (user?.tob) setBirthTime(user.tob);
    if (user?.pob) setBirthPlace(user.pob);
    if (typeof user?.birthLatitude === 'number') setBirthLatitude(user.birthLatitude);
    if (typeof user?.birthLongitude === 'number') setBirthLongitude(user.birthLongitude);
    if (user?.birthTimezoneName) setBirthTimezoneName(user.birthTimezoneName);
    if (
      typeof user?.birthLatitude === 'number' &&
      typeof user?.birthLongitude === 'number' &&
      user?.birthTimezoneName
    ) {
      setConfirmedLocation({
        name: user.birthPlaceName || user.pob || '',
        lat: user.birthLatitude,
        lon: user.birthLongitude,
        timezone: user.birthTimezoneName,
      });
    }
  }, [user]);

  // Fetch the consultation tree based on age and language
  const fetchTree = useCallback(async (forAge: number, forLang: typeof language) => {
    setIsLoadingTree(true);
    try {
      const res = await clientFetch(`/api/consult/tree?age=${forAge}&lang=${forLang}`);
      const data = await res.json();
      if (!data.tree) throw new Error('No tree');
      setTree(data.tree);
      // Drop any selections from a previous tree — question text is language-specific
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setSelectedQuestion('');
      return true;
    } catch {
      error('The analysis is currently unavailable. Please try again later.');
      return false;
    } finally {
      setIsLoadingTree(false);
    }
  }, [error]);

  // Refetch on language change, but only after the wizard has moved past birth
  // (otherwise the user has no age yet) and never while a reading is streaming
  useEffect(() => {
    if (!age) return;
    if (step === 'birth' || step === 'reading') return;
    // Step user back to 'categories' since old selections are now wrong
    fetchTree(age, language).then(ok => {
      if (ok) setStep('categories');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only react to language
  }, [language]);

  // Handle step 1: Birth Details -> Tree Fetch
  const handleBirthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate || !birthTime || !birthPlace) {
      error("Please provide all birth details for an accurate reading.");
      return;
    }
    if (
      typeof birthLatitude !== 'number' ||
      typeof birthLongitude !== 'number' ||
      !birthTimezoneName
    ) {
      error("Please select your exact birth location from the search results.");
      return;
    }

    const calculatedAge = calculateAge(birthDate);
    setAge(calculatedAge);
    const group = getAgeGroup(calculatedAge);
    setAgeGroupInfo(group);

    const ok = await fetchTree(calculatedAge, language);
    if (ok) setStep('categories');
  };

  // Handle Reading Generation (SSE)
  const generateReading = async () => {
    if (!selectedCategory || !selectedSubCategory || !selectedQuestion) return;

    if (
      typeof birthLatitude !== 'number' ||
      typeof birthLongitude !== 'number' ||
      !birthTimezoneName
    ) {
      error("Please select your exact birth location from the search results.");
      setStep('birth');
      return;
    }
    const offset = tzOffsetHoursAt(birthTimezoneName, birthDate, birthTime);
    if (offset === null) {
      error("Could not compute birth-time timezone offset. Please re-select the birth location.");
      setStep('birth');
      return;
    }

    setStep('reading');
    setIsReading(true);
    setReadingText('');

    try {
      const response = await clientFetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_date: birthDate,
          birth_time: birthTime,
          birth_place: birthPlace,
          name: user?.name || 'Friend',
          // language from context is always one of: 'en', 'hi', 'ta', 'te', 'kn', 'bn',
          //                                          'mr', 'gu', 'ml', 'pa', 'ko' — never a display name.
          // This invariant is enforced by LanguageContext (LanguageCode type).
          language,
          primary_category: selectedCategory.key,
          secondary_category: selectedSubCategory.key,
          final_question: selectedQuestion,
          response_tone: tone,
          optional_note: note || undefined,
          birthLatitude,
          birthLongitude,
          birthTimezoneName,
          birthTimezoneOffsetAtBirth: offset,
          birthTimeFold: null,
        }),
      });

      // ── 402 Paywall detection ──
      // If the backend returns 402, the consult feature is blocked.
      // Show PaywallCard instead of streaming.
      if (response.status === 402) {
        const data = await response.json();
        if (data.paywall) {
          setPaywall(data.paywall as PaywallData);
          setStep('questions'); // Stay on the question step so user can go back
        }
        setIsReading(false);
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'The process was interrupted.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      if (reader) {
        let streamDone = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              streamDone = true;
              break;
            }
            
            let data;
            try {
              data = JSON.parse(dataStr);
            } catch {
              continue;
            }
            
            if (data.token) {
              fullText += data.token;
              setReadingText(fullText);
            } else if (data.error) {
              throw new Error(data.error);
            }
          }
          
          if (streamDone) break;
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      error(errorMessage);
      setStep('questions');
    } finally {
      setIsReading(false);
    }
  };

  // Scroll to bottom of reading
  useEffect(() => {
    if (readingEndRef.current) {
      readingEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [readingText]);

  // Back button logic
  const goBack = () => {
    if (step === 'categories') setStep('birth');
    else if (step === 'subcategories') setStep('categories');
    else if (step === 'questions') setStep('subcategories');
    else if (step === 'reading') setStep('questions');
  };

  const currentStepIndex = stepsOrder.indexOf(step);

  return (
    <div className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto relative px-4 sm:px-6 lg:px-8 h-full overflow-hidden flex flex-col">

      {/* Paywall Modal — shown when consult is hard-blocked (402) */}
      {paywall && (
        <PaywallCard paywall={paywall} variant="modal" onClose={() => setPaywall(null)} />
      )}
      
      {/* Global Back Button (Top Left) */}
      {step !== 'birth' && step !== 'reading' && (
        <div className="absolute left-4 top-0 z-50 animate-in fade-in slide-in-from-left-4 duration-500">
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface/60 rounded-full transition-all text-foreground/60 hover:text-foreground border border-outline-variant/30 hover:border-secondary/40 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-ui-micro font-bold uppercase tracking-widest">Back</span>
          </button>
        </div>
      )}

      {/* 1. Constellation Path Progress Stepper */}
      <div className="mb-4 flex items-center justify-center animate-in fade-in slide-in-from-top-8 duration-700 shrink-0">
        <div
          className="w-full max-w-xl relative px-2"
          role="group"
          aria-label={`Step ${currentStepIndex + 1} of ${stepsOrder.length}: ${stepLabels[step]}`}
        >
          {/* Stepper Track */}
          <div className="absolute left-6 right-6 h-[1px] bg-outline-variant/20 top-4 -translate-y-1/2 z-0">
            {/* Active Progress Fill */}
            <div
              className="h-full bg-secondary transition-all duration-1000 ease-in-out shadow-[0_0_15px_var(--glow-color)]"
              style={{ width: `${(currentStepIndex / (stepsOrder.length - 1)) * 100}%` }}
            />
          </div>

          {/* Stepper Nodes */}
          <div className="flex justify-between w-full relative z-10">
            {stepsOrder.map((s, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={s}
                  className="flex flex-col items-center gap-1.5"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div
                    className={`w-8 h-8 3xl:w-10 3xl:h-10 rounded-full border transition-all duration-700 flex items-center justify-center ${
                      isCompleted
                        ? 'bg-secondary border-secondary shadow-[0_0_10px_var(--glow-color)]'
                        : isCurrent
                          ? 'bg-surface border-secondary shadow-[0_0_15px_var(--glow-color)] scale-110'
                          : 'bg-surface border-outline-variant/40'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 text-surface" strokeWidth={3} />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-outline-variant/40" />
                    )}
                  </div>
                  <span className={`text-ui-micro font-bold uppercase tracking-[0.2em] transition-all duration-500 ${
                    isCurrent ? 'text-secondary opacity-100' : 'text-foreground/40'
                  }`}>
                    {stepLabels[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-8 flex flex-col">
        {step !== 'birth' && step !== 'reading' && (
          <div className="flex items-center gap-4 mb-4 animate-in fade-in duration-500">
            <div>
              <h1 className="text-ui-title-sm font-headline text-heading">Guided Consultation</h1>
              <p className="text-ui-micro font-medium tracking-wide uppercase text-muted">
                Age {age} • {ageGroupInfo?.lifeStage}
              </p>
            </div>
          </div>
        )}

        {/* STEP 1: BIRTH DETAILS (The Altar Input) */}
        {step === 'birth' && (
          <div className="max-w-xl mx-auto my-auto relative animate-in fade-in zoom-in-95 duration-1000">
            <div className="absolute inset-[-20px] -z-10 opacity-30 pointer-events-none rounded-[40px] overflow-hidden blur-sm">
              <Particles particleCount={80} particleColors={['#c8880a', '#a78bd2']} speed={0.05} />
            </div>
            
            <div className="text-center mb-3 mt-0">
              <h1 className="text-ui-title md:text-ui-title font-headline text-heading mb-0.5 font-bold tracking-tight">Your birth details</h1>
              <p className="text-body text-ui-small">We use your exact date, time, and place of birth to calculate your chart.</p>
            </div>

            <GlassPanel className="p-5 md:p-8 border-secondary/20 shadow-[0_0_50px_rgba(200,136,10,0.08)] backdrop-blur-xl bg-surface/50">
              <form onSubmit={handleBirthSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-ui-micro font-bold uppercase tracking-widest flex items-center gap-2 text-muted">
                      <Calendar className="w-3.5 h-3.5 text-secondary" /> Birth Date
                    </label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                      className="h-10 text-sm bg-background/60 border-outline-variant/40 focus:border-secondary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-ui-micro font-bold uppercase tracking-widest flex items-center gap-2 text-muted">
                      <Clock className="w-3.5 h-3.5 text-secondary" /> Birth Time
                    </label>
                    <Input
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      required
                      className="h-10 text-sm bg-background/60 border-outline-variant/40 focus:border-secondary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-ui-micro font-bold uppercase tracking-widest flex items-center gap-2 text-muted">
                    <MapPin className="w-3.5 h-3.5 text-secondary" /> Birth Place
                  </label>
                  <LocationSearch
                    label=""
                    placeholder="Search city, e.g. Mumbai"
                    value={birthPlace}
                    confirmedLocation={confirmedLocation}
                    required
                    onSelect={(loc: LocationResult) => {
                      setBirthPlace(loc.name);
                      setBirthLatitude(loc.lat);
                      setBirthLongitude(loc.lon);
                      setBirthTimezoneName(loc.timezone);
                      setConfirmedLocation(loc);
                    }}
                    onChange={(text: string) => {
                      setBirthPlace(text);
                      const stillMatches = confirmedLocation?.name === text;
                      if (!stillMatches) {
                        setBirthLatitude(undefined);
                        setBirthLongitude(undefined);
                        setBirthTimezoneName(undefined);
                        setConfirmedLocation(null);
                      }
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg shadow-[0_10px_30px_var(--glow-color)] mt-4 rounded-2xl"
                  disabled={isLoadingTree}
                >
                  {isLoadingTree ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  {isLoadingTree ? "Calculating…" : "Continue"}
                </Button>
              </form>
            </GlassPanel>
          </div>
        )}

        {/* STEP 2: CATEGORY SELECTION (Tarot Cards) or SKELETON */}
        {(step === 'categories' || isLoadingTree) && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="text-center mb-4">
              <h2 className="text-ui-title-sm md:text-ui-title font-headline text-heading mb-1">
                {isLoadingTree ? "Analyzing your chart…" : "Which area would you like to explore?"}
              </h2>
              <p className="text-muted text-ui-caption">
                {isLoadingTree ? "Matching your birth chart to relevant life domains…" : "Choose a life domain to focus the reading."}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {isLoadingTree ? (
                /* Category Skeletons */
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <GlassPanel key={i} className="p-3 md:p-4 flex flex-col items-center justify-center gap-4 h-24 sm:h-32 bg-surface/30 border-outline-variant/10">
                    <SkeletonCircle size={40} className="md:w-12 md:h-12" />
                    <Skeleton height={12} width={80} />
                  </GlassPanel>
                ))
              ) : tree && (
                tree.primary.map((cat, idx) => (
                  <button
                    key={cat.key}
                    onClick={() => { setSelectedCategory(cat); setStep('subcategories'); }}
                    className="group relative animate-in fade-in slide-in-from-bottom-8 text-left"
                    style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                  >
                    <GlassPanel className="p-3 md:p-4 flex flex-col items-center justify-center text-center gap-2 
                      transition-all duration-500 ease-out border border-outline-variant/30
                      group-hover:celestial-silk group-hover:border-secondary/60 group-hover:shadow-[0_20px_50px_var(--glow-color)] group-hover:-translate-y-1
                      relative overflow-hidden bg-surface/50 backdrop-blur-md">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform duration-700 ease-out relative z-10 drop-shadow-md">{cat.icon}</span>
                      <span className="font-headline font-bold text-ui-small text-heading relative z-10 group-hover:text-secondary transition-colors duration-300">{cat.label}</span>
                    </GlassPanel>
                  </button>
                ))
              )}
            </div>

            {!isLoadingTree && tree && (
              <>
                <div className="mt-6 flex items-center justify-center gap-6">
                  <button
                    onClick={() => setShowHiddenCategories(!showHiddenCategories)}
                    className="text-secondary font-bold hover:text-secondary/80 flex items-center gap-2 tracking-widest uppercase text-ui-micro transition-colors"
                  >
                    {showHiddenCategories ? "Show fewer" : "Show more areas"}
                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showHiddenCategories ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {showHiddenCategories && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-6">
                    {tree.hidden.map((cat, idx) => (
                      <button
                        key={cat.key}
                        onClick={() => { setSelectedCategory(cat); setStep('subcategories'); }}
                        className="group relative animate-in fade-in slide-in-from-top-8 text-left"
                        style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                      >
                        <GlassPanel className="p-4 flex flex-col items-center justify-center text-center gap-3 
                          transition-all duration-500 ease-out border border-outline-variant/30
                          group-hover:celestial-silk group-hover:border-secondary/60 group-hover:shadow-[0_20px_50px_var(--glow-color)] group-hover:-translate-y-2
                          relative overflow-hidden bg-surface/50 backdrop-blur-md">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-700 ease-out relative z-10 drop-shadow-md">{cat.icon}</span>
                          <span className="font-headline font-bold text-ui-body text-heading relative z-10 group-hover:text-secondary transition-colors duration-300">{cat.label}</span>
                        </GlassPanel>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 3: SUB-CATEGORY SELECTION */}
        {step === 'subcategories' && selectedCategory && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-6xl 2xl:max-w-[1600px] 3xl:max-w-[2000px] mx-auto">
            <div className="text-center mb-4">
              <div className="inline-block p-2 cosmic-glow rounded-full mb-2 border border-secondary/30 bg-surface/60 backdrop-blur-md">
                <span className="text-2xl drop-shadow-xl">{selectedCategory.icon}</span>
              </div>
              <h2 className="text-ui-title-sm md:text-ui-title font-headline text-heading mb-0.5">{selectedCategory.label}</h2>
              <p className="text-muted text-ui-caption">Pick a specific focus.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {selectedCategory.subs.map((sub, idx) => (
                <button
                  key={sub.key}
                  onClick={() => { setSelectedSubCategory(sub); setStep('questions'); }}
                  className="group text-left animate-in fade-in slide-in-from-bottom-6"
                  style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
                >
                  <GlassPanel className="p-3 md:p-4 flex items-center justify-between transition-all duration-300
                    border-outline-variant/30 hover:border-secondary/50 hover:shadow-[0_10px_30px_var(--glow-color)]
                    hover:-translate-y-0.5 bg-surface/60 backdrop-blur-sm">
                    <span className="font-medium text-ui-small md:text-ui-body text-heading group-hover:text-secondary transition-colors">{sub.label}</span>
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <ChevronRight className="w-4 h-4 text-secondary" />
                    </div>
                  </GlassPanel>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: QUESTION SELECTION */}
        {step === 'questions' && selectedSubCategory && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-6xl 2xl:max-w-[1600px] 3xl:max-w-[2000px] mx-auto w-full flex flex-col h-fit">
            <div className="text-center mb-6">
              <h2 className="text-ui-title md:text-ui-title font-headline text-heading mb-2">{selectedSubCategory.label}</h2>
              <p className="text-muted text-ui-small">Select the question you&apos;d like answered.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: Questions */}
              <div
                role="radiogroup"
                aria-label="Questions"
                className="flex flex-col justify-center h-full space-y-3"
                onKeyDown={(e) => {
                  const questions = selectedSubCategory.questions;
                  const currentIdx = questions.indexOf(selectedQuestion);
                  let nextIdx = -1;
                  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % questions.length;
                  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') nextIdx = currentIdx <= 0 ? questions.length - 1 : currentIdx - 1;
                  else if (e.key === 'Home') nextIdx = 0;
                  else if (e.key === 'End') nextIdx = questions.length - 1;
                  if (nextIdx >= 0) {
                    e.preventDefault();
                    setSelectedQuestion(questions[nextIdx]);
                    const nodes = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
                    nodes[nextIdx]?.focus();
                  }
                }}
              >
                {selectedSubCategory.questions.map((q, idx) => {
                  const isSel = selectedQuestion === q;
                  const isFirst = idx === 0;
                  return (
                  <button
                    key={idx}
                    type="button"
                    role="radio"
                    aria-checked={isSel}
                    tabIndex={isSel || (!selectedQuestion && isFirst) ? 0 : -1}
                    onClick={() => setSelectedQuestion(q)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-500 animate-in fade-in slide-in-from-bottom-6 outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
                      isSel
                        ? 'border-secondary bg-surface shadow-[0_15px_40px_rgba(212,175,55,0.15)] scale-[1.02]'
                        : 'border-outline-variant/20 hover:border-secondary/40 hover:bg-surface/60 bg-surface/30'
                    }`}
                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        isSel ? 'border-secondary bg-secondary' : 'border-foreground/20'
                      }`}>
                        {isSel && <div className="w-2.5 h-2.5 bg-background rounded-full" />}
                      </div>
                      <span className={`text-ui-body md:text-ui-lead font-medium transition-colors duration-300 ${
                        isSel ? 'text-secondary font-bold' : 'text-heading'
                      }`}>{q}</span>
                    </div>
                  </button>
                  );
                })}
              </div>

              {/* Right Column: Settings & Action */}
              <div className="flex flex-col h-full">
                <GlassPanel className="p-6 md:p-8 space-y-8 border-secondary/20 bg-surface/60 backdrop-blur-2xl shadow-xl flex flex-col justify-between h-full">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-ui-caption font-bold uppercase tracking-widest flex items-center gap-2 text-muted">
                        <Sparkles className="w-4 h-4 text-secondary" /> Response style
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {TONE_OPTIONS.map((opt) => {
                          const isSel = tone === opt.key;
                          return (
                          <button
                            key={opt.key}
                            type="button"
                            aria-pressed={isSel}
                            title={opt.desc}
                            onClick={() => setTone(opt.key)}
                            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
                              isSel
                                ? 'border-secondary gold-gradient text-white shadow-lg transform scale-110'
                                : 'border-outline-variant/20 hover:border-secondary/40 text-body bg-background/50'
                            }`}
                          >
                            <span className="text-2xl">{opt.emoji}</span>
                            <span className="font-bold text-ui-micro tracking-tight uppercase">{opt.label}</span>
                          </button>
                          );
                        })}
                      </div>
                      <p className="text-ui-micro text-muted text-center transition-opacity duration-300">
                        {TONE_OPTIONS.find((o) => o.key === tone)?.desc}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-ui-caption font-bold uppercase tracking-widest flex items-center gap-2 text-muted">
                        <MessageSquare className="w-4 h-4 text-secondary" /> Personal Context
                      </label>
                      <textarea
                        placeholder="Share any specific details…"
                        className="w-full bg-background/60 border border-outline-variant/30 rounded-2xl p-5 h-32 focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all outline-none resize-none text-ui-body"
                        value={note}
                        onChange={(e) => setNote(e.target.value.slice(0, 150))}
                      />
                      <div className="text-right text-ui-micro text-faint font-bold tracking-widest">{note.length}/150</div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      className="w-full h-16 text-xl shadow-[0_15px_40px_rgba(212,175,55,0.3)] rounded-2xl transition-transform hover:scale-[1.02]"
                      disabled={!selectedQuestion}
                      onClick={generateReading}
                    >
                      Get reading
                      <Send className="w-6 h-6 ml-3" />
                    </Button>
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: THE READING (Illuminated Manuscript) */}
        {step === 'reading' && (
          <div className="animate-in fade-in zoom-in-[0.98] duration-1000 max-w-6xl 2xl:max-w-[1600px] 3xl:max-w-[2000px] mx-auto">
            <GlassPanel className="p-0 overflow-hidden mb-8 border-secondary/40 shadow-[0_30px_80px_rgba(200,136,10,0.2)] dark-glass celestial-silk relative">
              
              {/* Watermark Background */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] overflow-hidden mix-blend-overlay">
                <span className="text-[20rem] md:text-[40rem]">{selectedCategory?.icon}</span>
              </div>

              <div className="bg-surface/60 backdrop-blur-xl border-b border-secondary/30 p-4 md:p-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary cosmic-glow">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline text-ui-title-sm text-heading font-bold">Your reading</h3>
                    <p className="text-ui-micro font-bold text-muted tracking-widest uppercase mt-0.5">
                      {selectedCategory?.label} • {selectedSubCategory?.label}
                    </p>
                  </div>
                </div>
                <div className="text-ui-micro font-bold px-3 py-1 bg-secondary/15 text-secondary border border-secondary/30 rounded-full uppercase tracking-widest shadow-sm">
                  {tone}
                </div>
              </div>

              <div className="p-6 md:p-12 min-h-[300px] relative z-10">
                <div className="max-w-3xl mx-auto">
                  {isReading ? (
                    <div className="flex items-center gap-2 text-secondary/70 mb-6 italic font-serif text-ui-body">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Interpreting your chart…</span>
                    </div>
                  ) : readingText ? (
                    <div className="flex items-center gap-2 text-secondary/70 mb-6 font-serif text-ui-body">
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                      <span>Reading complete</span>
                    </div>
                  ) : null}

                  <h4 className="text-ui-title-sm md:text-ui-title font-headline text-heading mb-8 leading-snug font-bold border-l-4 border-secondary pl-4">
                    &quot;{selectedQuestion}&quot;
                  </h4>

                  <div className="text-ui-lead leading-relaxed text-body font-serif">
                    <ReadingContent text={readingText} isReading={isReading} />
                    {isReading && (
                      <span className="inline-block w-2 h-4 bg-secondary ml-2 animate-pulse rounded-sm align-middle shadow-[0_0_10px_var(--glow-color)]" />
                    )}
                  </div>
                  <div ref={readingEndRef} className="h-4" />
                </div>
              </div>

              {!isReading && readingText && (
                <div className="p-6 md:p-8 border-t border-secondary/30 bg-surface/80 backdrop-blur-xl flex flex-col sm:flex-row gap-4 items-center justify-between relative z-10">
                  <p className="text-ui-caption text-muted italic font-serif text-center sm:text-left">
                    Based on your birth chart.
                  </p>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="secondary" className="flex-1 sm:flex-none border-secondary/40 hover:bg-secondary/10 h-10 px-4 text-sm" onClick={() => { setStep('birth'); setReadingText(''); setNote(''); }}>
                      New reading
                    </Button>
                    <Button className="flex-1 sm:flex-none shadow-[0_8px_25px_var(--glow-color)] h-10 px-4 text-sm" onClick={() => router.push('/chat')}>
                      Ask Navi Directly
                    </Button>
                  </div>
                </div>
              )}
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultClient;
