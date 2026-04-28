'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
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
import GlassPanel from '@/components/ui/GlassPanel';
import Particles from '@/components/ui/Particles';
import { ChevronRight, ChevronLeft, Sparkles, Send, RefreshCw, Calendar, MapPin, Clock, Languages, MessageSquare, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

type Step = 'birth' | 'categories' | 'subcategories' | 'questions' | 'reading';

const stepsOrder: Step[] = ['birth', 'categories', 'subcategories', 'questions', 'reading'];

const ConsultClient: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();
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
  const [language, setLanguage] = useState('english');
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

  // Sync with user profile if available
  useEffect(() => {
    if (user?.dob) setBirthDate(user.dob);
    if (user?.tob) setBirthTime(user.tob);
    if (user?.pob) setBirthPlace(user.pob);
  }, [user]);

  // Handle step 1: Birth Details -> Tree Fetch
  const handleBirthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate || !birthTime || !birthPlace) {
      error("Please provide all birth details for an accurate reading.");
      return;
    }

    const calculatedAge = calculateAge(birthDate);
    setAge(calculatedAge);
    const group = getAgeGroup(calculatedAge);
    setAgeGroupInfo(group);

    setIsLoadingTree(true);
    try {
      const res = await fetch(`/api/consult/tree?age=${calculatedAge}`);
      const data = await res.json();
      if (data.tree) {
        setTree(data.tree);
        setStep('categories');
      } else {
        throw new Error("Could not fetch the celestial tree.");
      }
    } catch (err) {
      error("The stars are currently obscured. Please try again later.");
    } finally {
      setIsLoadingTree(false);
    }
  };

  // Handle Reading Generation (SSE)
  const generateReading = async () => {
    if (!selectedCategory || !selectedSubCategory || !selectedQuestion) return;

    setStep('reading');
    setIsReading(true);
    setReadingText('');

    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_date: birthDate,
          birth_time: birthTime,
          birth_place: birthPlace,
          name: user?.name || 'Friend',
          language,
          primary_category: selectedCategory.key,
          secondary_category: selectedSubCategory.key,
          final_question: selectedQuestion,
          response_tone: tone,
          optional_note: note || undefined
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'The ritual was interrupted.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') break;
              try {
                const data = JSON.parse(dataStr);
                if (data.token) {
                  fullText += data.token;
                  setReadingText(fullText);
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) { /* partial json */ }
            }
          }
        }
      }
    } catch (err: any) {
      error(err.message || "Something went wrong.");
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
    <div className="max-w-5xl mx-auto relative min-h-[80vh] px-4 sm:px-6">
      
      {/* 1. Constellation Path Progress Stepper */}
      <div className="mb-14 flex items-center justify-center animate-in fade-in slide-in-from-top-8 duration-700">
        <div className="flex items-center w-full max-w-2xl relative px-4">
          <div className="absolute left-4 right-4 h-[2px] bg-outline-variant/30 top-1/2 -translate-y-1/2 z-0" />
          <div 
            className="absolute left-4 h-[2px] bg-secondary top-1/2 -translate-y-1/2 z-0 transition-all duration-1000 ease-in-out" 
            style={{ width: `calc(${(currentStepIndex / (stepsOrder.length - 1)) * 100}% - 32px)` }}
          />
          {stepsOrder.map((s, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={s} className="flex-1 flex justify-center z-10">
                <div 
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-700 flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-secondary border-secondary shadow-[0_0_15px_var(--glow-color)]' 
                      : isCurrent 
                        ? 'bg-surface border-secondary cosmic-glow scale-125' 
                        : 'bg-surface border-outline-variant/50'
                  }`}
                >
                  {(isCompleted || isCurrent) && <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-surface' : 'bg-secondary'}`} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {step !== 'birth' && step !== 'reading' && (
        <div className="flex items-center gap-4 mb-10 animate-in fade-in duration-500">
          <button 
            onClick={goBack}
            className="p-3 hover:bg-surface/60 rounded-full transition-colors text-foreground/60 hover:text-foreground"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-headline text-foreground">Guided Consultation</h1>
            <p className="text-sm font-medium tracking-wide uppercase text-foreground/60 mt-1">
              Age {age} • {ageGroupInfo?.lifeStage}
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: BIRTH DETAILS (The Altar Input) */}
      {step === 'birth' && (
        <div className="max-w-2xl mx-auto relative animate-in fade-in zoom-in-95 duration-1000">
          <div className="absolute inset-[-40px] -z-10 opacity-30 pointer-events-none rounded-[40px] overflow-hidden blur-sm">
            <Particles particleCount={150} particleColors={['#c8880a', '#a78bd2']} speed={0.05} />
          </div>
          
          <div className="text-center mb-10 mt-4">
            <h1 className="text-4xl md:text-5xl font-headline text-foreground mb-4 font-bold tracking-tight">Begin Your Journey</h1>
            <p className="text-foreground/70 text-lg">Enter your birth details to unlock personalized celestial guidance.</p>
          </div>
          
          <GlassPanel className="p-8 md:p-12 border-secondary/20 shadow-[0_0_50px_rgba(200,136,10,0.08)] backdrop-blur-xl bg-surface/50">
            <form onSubmit={handleBirthSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                    <Calendar className="w-4 h-4 text-secondary" /> Birth Date
                  </label>
                  <Input 
                    type="date" 
                    value={birthDate} 
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    className="h-14 text-lg bg-background/60 border-outline-variant/40 focus:border-secondary focus:shadow-[0_0_20px_var(--glow-color)] transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                    <Clock className="w-4 h-4 text-secondary" /> Birth Time
                  </label>
                  <Input 
                    type="time" 
                    value={birthTime} 
                    onChange={(e) => setBirthTime(e.target.value)}
                    required
                    className="h-14 text-lg bg-background/60 border-outline-variant/40 focus:border-secondary focus:shadow-[0_0_20px_var(--glow-color)] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                  <MapPin className="w-4 h-4 text-secondary" /> Birth Place
                </label>
                <Input 
                  placeholder="City, State, Country"
                  value={birthPlace} 
                  onChange={(e) => setBirthPlace(e.target.value)}
                  required
                  className="h-14 text-lg bg-background/60 border-outline-variant/40 focus:border-secondary focus:shadow-[0_0_20px_var(--glow-color)] transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                  <Languages className="w-4 h-4 text-secondary" /> Language
                </label>
                <select 
                  className="w-full h-14 bg-background/60 border border-outline-variant/40 rounded-xl p-3 focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:shadow-[0_0_20px_var(--glow-color)] transition-all outline-none text-lg"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 text-xl shadow-[0_10px_40px_var(--glow-color)] mt-6 rounded-[20px] transition-transform hover:scale-[1.02]" 
                disabled={isLoadingTree}
              >
                {isLoadingTree ? <RefreshCw className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
                {isLoadingTree ? "Aligning Stars..." : "Commence Reading"}
              </Button>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* STEP 2: CATEGORY SELECTION (Tarot Cards) */}
      {step === 'categories' && tree && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-headline text-foreground mb-4">What brings you to the stars today?</h2>
            <p className="text-foreground/60 text-lg">Select a cosmic domain you wish to explore.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {tree.primary.map((cat, idx) => (
              <button
                key={cat.key}
                onClick={() => { setSelectedCategory(cat); setStep('subcategories'); }}
                className="group relative animate-in fade-in slide-in-from-bottom-8 text-left"
                style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
              >
                <GlassPanel className="p-8 aspect-[2/2.5] flex flex-col items-center justify-center text-center gap-6 
                  transition-all duration-500 ease-out border border-outline-variant/30
                  group-hover:celestial-silk group-hover:border-secondary/60 group-hover:shadow-[0_20px_50px_var(--glow-color)] group-hover:-translate-y-3
                  relative overflow-hidden bg-surface/50 backdrop-blur-md">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="text-6xl md:text-7xl group-hover:scale-110 transition-transform duration-700 ease-out relative z-10 drop-shadow-md">{cat.icon}</span>
                  <span className="font-headline font-bold text-xl md:text-2xl text-foreground relative z-10 group-hover:text-secondary transition-colors duration-300">{cat.label}</span>
                </GlassPanel>
              </button>
            ))}
          </div>

          <div className="mt-14 text-center">
            <button 
              onClick={() => setShowHiddenCategories(!showHiddenCategories)}
              className="text-secondary font-bold hover:text-secondary/80 flex items-center gap-2 mx-auto tracking-widest uppercase text-sm transition-colors"
            >
              {showHiddenCategories ? "Hide deeper mysteries" : "Unveil more options"}
              <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${showHiddenCategories ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {showHiddenCategories && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mt-8">
              {tree.hidden.map((cat, idx) => (
                <button
                  key={cat.key}
                  onClick={() => { setSelectedCategory(cat); setStep('subcategories'); }}
                  className="group relative animate-in fade-in slide-in-from-top-8 text-left"
                  style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
                >
                  <GlassPanel className="p-8 aspect-[2/2.5] flex flex-col items-center justify-center text-center gap-6 
                    transition-all duration-500 ease-out border border-outline-variant/30
                    group-hover:celestial-silk group-hover:border-secondary/60 group-hover:shadow-[0_20px_50px_var(--glow-color)] group-hover:-translate-y-3
                    relative overflow-hidden bg-surface/50 backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-700 ease-out relative z-10 drop-shadow-md">{cat.icon}</span>
                    <span className="font-headline font-bold text-lg md:text-xl text-foreground relative z-10 group-hover:text-secondary transition-colors duration-300">{cat.label}</span>
                  </GlassPanel>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: SUB-CATEGORY SELECTION */}
      {step === 'subcategories' && selectedCategory && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block p-6 cosmic-glow rounded-full mb-6 border border-secondary/30 bg-surface/60 backdrop-blur-md">
              <span className="text-6xl drop-shadow-xl">{selectedCategory.icon}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-headline text-foreground mb-4">{selectedCategory.label}</h2>
            <p className="text-foreground/60 text-lg">Narrow down your area of inquiry.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {selectedCategory.subs.map((sub, idx) => (
              <button
                key={sub.key}
                onClick={() => { setSelectedSubCategory(sub); setStep('questions'); }}
                className="group text-left animate-in fade-in slide-in-from-bottom-6"
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
              >
                <GlassPanel className="p-6 md:p-8 flex items-center justify-between transition-all duration-300
                  border-outline-variant/30 hover:border-secondary/50 hover:shadow-[0_10px_40px_var(--glow-color)] 
                  hover:-translate-y-1 bg-surface/60 backdrop-blur-sm">
                  <span className="font-medium text-lg text-foreground group-hover:text-secondary transition-colors">{sub.label}</span>
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronRight className="w-5 h-5 text-secondary" />
                  </div>
                </GlassPanel>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: QUESTION SELECTION */}
      {step === 'questions' && selectedSubCategory && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline text-foreground mb-4">{selectedSubCategory.label}</h2>
            <p className="text-foreground/60 text-lg">Choose the query that resonates with your spirit.</p>
          </div>

          <div className="space-y-5 mb-12">
            {selectedSubCategory.questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedQuestion(q)}
                className={`w-full text-left p-6 md:p-8 rounded-[24px] border transition-all duration-500 animate-in fade-in slide-in-from-bottom-6 ${
                  selectedQuestion === q 
                    ? 'border-secondary cosmic-glow bg-surface/80 scale-[1.02] shadow-[0_15px_40px_var(--glow-color)]' 
                    : 'border-outline-variant/30 hover:border-secondary/40 hover:bg-surface/60 bg-surface/40'
                }`}
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-6">
                  <div className={`shrink-0 w-8 h-8 rounded-full border-[3px] flex items-center justify-center transition-all duration-500 ${
                    selectedQuestion === q ? 'border-secondary bg-secondary' : 'border-foreground/20'
                  }`}>
                    {selectedQuestion === q && <div className="w-3 h-3 bg-background rounded-full" />}
                  </div>
                  <span className={`text-lg md:text-xl font-medium transition-colors duration-300 ${
                    selectedQuestion === q ? 'text-secondary' : 'text-foreground'
                  }`}>{q}</span>
                </div>
              </button>
            ))}
          </div>

          <GlassPanel className="p-8 md:p-12 space-y-10 border-outline-variant/30 bg-surface/50 backdrop-blur-xl">
            <div className="space-y-6">
              <label className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                <Sparkles className="w-5 h-5 text-secondary" /> Voice of the Oracle (Tone)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTone(opt.key)}
                    className={`p-4 rounded-[20px] border flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                      tone === opt.key 
                        ? 'border-secondary gold-gradient text-white shadow-[0_10px_30px_var(--glow-color)] transform scale-[1.05]' 
                        : 'border-outline-variant/30 hover:border-secondary/40 text-foreground/70 bg-background/50 hover:bg-surface/80'
                    }`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="font-bold text-sm tracking-wide uppercase">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                <MessageSquare className="w-5 h-5 text-secondary" /> Personal Context (Optional)
              </label>
              <textarea 
                placeholder="Share any specific details, names, or current situations..."
                className="w-full bg-background/60 border border-outline-variant/40 rounded-[24px] p-6 h-36 focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all outline-none resize-none text-lg"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 150))}
              />
              <div className="text-right text-xs text-foreground/50 font-bold uppercase tracking-widest">{note.length}/150</div>
            </div>

            <Button 
              className="w-full h-16 md:h-20 text-xl md:text-2xl shadow-[0_15px_40px_var(--glow-color)] rounded-[24px] transition-transform hover:scale-[1.02]"
              disabled={!selectedQuestion}
              onClick={generateReading}
            >
              Unveil Reading
              <Send className="w-6 h-6 ml-3" />
            </Button>
          </GlassPanel>
        </div>
      )}

      {/* STEP 5: THE READING (Illuminated Manuscript) */}
      {step === 'reading' && (
        <div className="animate-in fade-in zoom-in-[0.98] duration-1000 max-w-4xl mx-auto">
          <GlassPanel className="p-0 overflow-hidden mb-12 border-secondary/40 shadow-[0_30px_80px_rgba(200,136,10,0.2)] dark-glass celestial-silk relative">
            
            {/* Watermark Background */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] overflow-hidden mix-blend-overlay">
              <span className="text-[40rem]">{selectedCategory?.icon}</span>
            </div>

            <div className="bg-surface/60 backdrop-blur-xl border-b border-secondary/30 p-6 md:p-8 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-2xl text-secondary cosmic-glow">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline text-2xl text-foreground font-bold">Celestial Insights</h3>
                  <p className="text-sm font-bold text-foreground/60 tracking-widest uppercase mt-1">
                    {selectedCategory?.label} • {selectedSubCategory?.label}
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold px-4 py-2 bg-secondary/15 text-secondary border border-secondary/30 rounded-full uppercase tracking-widest shadow-sm">
                {tone}
              </div>
            </div>

            <div className="p-8 md:p-16 min-h-[500px] relative z-10">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 text-secondary/70 mb-10 italic font-serif text-lg">
                  <Info className="w-5 h-5" />
                  <span>Navi is interpreting the cosmic alignments...</span>
                </div>
                
                <h4 className="text-3xl md:text-4xl font-headline text-foreground mb-12 leading-snug font-bold border-l-4 border-secondary pl-6">
                  "{selectedQuestion}"
                </h4>
                
                <div className="space-y-8 text-xl leading-relaxed text-foreground/90 font-serif">
                  {readingText.split('\n\n').map((para, i) => (
                    <p key={i} className={`animate-in fade-in slide-in-from-bottom-4 duration-1000 ${isReading && i === readingText.split('\n\n').length - 1 ? 'animate-shimmer' : ''}`}>
                      {para}
                    </p>
                  ))}
                  {isReading && (
                    <span className="inline-block w-3 h-6 bg-secondary ml-2 animate-pulse rounded-sm align-middle shadow-[0_0_10px_var(--glow-color)]" />
                  )}
                </div>
                <div ref={readingEndRef} className="h-10" />
              </div>
            </div>

            {!isReading && readingText && (
              <div className="p-8 md:p-10 border-t border-secondary/30 bg-surface/80 backdrop-blur-xl flex flex-col sm:flex-row gap-6 items-center justify-between relative z-10">
                <p className="text-sm text-foreground/60 italic font-serif">
                  Consultation concluded based on your natal alignments.
                </p>
                <div className="flex gap-4 w-full sm:w-auto">
                  <Button variant="secondary" className="flex-1 sm:flex-none border-secondary/40 hover:bg-secondary/10 h-12 px-6" onClick={() => { setStep('birth'); setReadingText(''); setNote(''); }}>
                    New Query
                  </Button>
                  <Button className="flex-1 sm:flex-none shadow-[0_8px_25px_var(--glow-color)] h-12 px-6" onClick={() => router.push('/chat')}>
                    Ask Navi Directly
                  </Button>
                </div>
              </div>
            )}
          </GlassPanel>
        </div>
      )}
    </div>
  );
};

export default ConsultClient;
