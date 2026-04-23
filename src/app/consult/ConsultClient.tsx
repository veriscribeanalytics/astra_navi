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
import { ChevronRight, ChevronLeft, Sparkles, Send, RefreshCw, User, Calendar, MapPin, Clock, Languages, MessageSquare, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

type Step = 'birth' | 'categories' | 'subcategories' | 'questions' | 'reading';

const ConsultClient: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      {step !== 'birth' && step !== 'reading' && (
        <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <button 
            onClick={goBack}
            className="p-2 hover:bg-surface/50 rounded-full transition-colors text-foreground/60"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-headline text-foreground">Guided Consultation</h1>
            <p className="text-sm text-foreground/60">
              Age {age} • {ageGroupInfo?.lifeStage}
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: BIRTH DETAILS */}
      {step === 'birth' && (
        <div className="max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-headline text-foreground mb-3">Begin Your Journey</h1>
            <p className="text-foreground/60">Enter your birth details to unlock personalized celestial guidance.</p>
          </div>
          
          <GlassPanel className="p-8">
            <form onSubmit={handleBirthSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-secondary" /> Birth Date
                  </label>
                  <Input 
                    type="date" 
                    value={birthDate} 
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary" /> Birth Time
                  </label>
                  <Input 
                    type="time" 
                    value={birthTime} 
                    onChange={(e) => setBirthTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary" /> Birth Place
                </label>
                <Input 
                  placeholder="City, State, Country"
                  value={birthPlace} 
                  onChange={(e) => setBirthPlace(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Languages className="w-4 h-4 text-secondary" /> Language
                </label>
                <select 
                  className="w-full bg-background border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 text-lg" 
                disabled={isLoadingTree}
              >
                {isLoadingTree ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                {isLoadingTree ? "Aligning Stars..." : "Continue to Categories"}
              </Button>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* STEP 2: CATEGORY SELECTION */}
      {step === 'categories' && tree && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-headline text-foreground mb-2">What brings you to the stars today?</h2>
            <p className="text-foreground/60">Select a life area you'd like to explore.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tree.primary.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setSelectedCategory(cat); setStep('subcategories'); }}
                className="group relative"
              >
                <GlassPanel className="p-8 h-full flex flex-col items-center justify-center text-center gap-4 group-hover:border-secondary/50 group-hover:bg-secondary/5 transition-all duration-300">
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                  <span className="font-medium text-foreground">{cat.label}</span>
                </GlassPanel>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setShowHiddenCategories(!showHiddenCategories)}
              className="text-secondary font-medium hover:underline flex items-center gap-2 mx-auto"
            >
              {showHiddenCategories ? "Show less" : "More options"}
              <ChevronRight className={`w-4 h-4 transition-transform ${showHiddenCategories ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {showHiddenCategories && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {tree.hidden.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { setSelectedCategory(cat); setStep('subcategories'); }}
                  className="group relative"
                >
                  <GlassPanel className="p-8 h-full flex flex-col items-center justify-center text-center gap-4 group-hover:border-secondary/50 group-hover:bg-secondary/5 transition-all duration-300">
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                    <span className="font-medium text-foreground">{cat.label}</span>
                  </GlassPanel>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: SUB-CATEGORY SELECTION */}
      {step === 'subcategories' && selectedCategory && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-secondary/10 rounded-full mb-4">
              <span className="text-4xl">{selectedCategory.icon}</span>
            </div>
            <h2 className="text-2xl font-headline text-foreground mb-2">{selectedCategory.label}</h2>
            <p className="text-foreground/60">Narrow down your area of interest.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedCategory.subs.map((sub) => (
              <button
                key={sub.key}
                onClick={() => { setSelectedSubCategory(sub); setStep('questions'); }}
                className="group text-left"
              >
                <GlassPanel className="p-6 flex items-center justify-between group-hover:border-secondary/50 group-hover:bg-secondary/5 transition-all duration-300">
                  <span className="font-medium text-foreground">{sub.label}</span>
                  <ChevronRight className="w-5 h-5 text-secondary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </GlassPanel>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: QUESTION SELECTION */}
      {step === 'questions' && selectedSubCategory && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-headline text-foreground mb-2">{selectedSubCategory.label}</h2>
            <p className="text-foreground/60">Choose the question that resonates with you most.</p>
          </div>

          <div className="space-y-4 mb-10">
            {selectedSubCategory.questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedQuestion(q)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 ${
                  selectedQuestion === q 
                    ? 'border-secondary bg-secondary/5 shadow-lg shadow-secondary/5' 
                    : 'border-outline-variant/30 hover:border-secondary/30 bg-surface'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedQuestion === q ? 'border-secondary bg-secondary' : 'border-foreground/20'}`}>
                    {selectedQuestion === q && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="text-lg text-foreground">{q}</span>
                </div>
              </button>
            ))}
          </div>

          <GlassPanel className="p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" /> Response Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTone(opt.key)}
                    className={`p-3 rounded-xl border text-sm flex flex-col items-center gap-1 transition-all ${
                      tone === opt.key 
                        ? 'border-secondary bg-secondary text-white' 
                        : 'border-outline-variant/30 hover:border-secondary/30 text-foreground/70'
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-secondary" /> Add a personal note (optional)
              </label>
              <textarea 
                placeholder="Share any specific details or context..."
                className="w-full bg-background/50 border border-outline-variant rounded-xl p-4 h-24 focus:ring-2 focus:ring-secondary/20 transition-all outline-none resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 120))}
              />
              <div className="text-right text-xs text-foreground/40">{note.length}/120 characters</div>
            </div>

            <Button 
              className="w-full py-6 text-xl shadow-xl shadow-secondary/10"
              disabled={!selectedQuestion}
              onClick={generateReading}
            >
              Generate Reading
              <Send className="w-5 h-5 ml-2" />
            </Button>
          </GlassPanel>
        </div>
      )}

      {/* STEP 5: THE READING */}
      {step === 'reading' && (
        <div className="animate-in fade-in duration-1000">
          <GlassPanel className="p-0 overflow-hidden mb-8 border-secondary/20 shadow-2xl shadow-secondary/5">
            <div className="bg-secondary/5 border-b border-outline-variant/30 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline text-foreground">Celestial Insights</h3>
                  <p className="text-xs text-foreground/60">{selectedCategory?.label} • {selectedSubCategory?.label}</p>
                </div>
              </div>
              <div className="text-xs font-medium px-3 py-1 bg-secondary/10 text-secondary rounded-full uppercase tracking-wider">
                {tone}
              </div>
            </div>

            <div className="p-8 md:p-12 min-h-[400px]">
              <div className="prose prose-stone dark:prose-invert max-w-none">
                <div className="flex items-center gap-3 text-secondary/60 mb-6 italic">
                  <Info className="w-4 h-4" />
                  <span>Navi is consulting the stars for you...</span>
                </div>
                
                <h4 className="text-xl font-headline text-foreground mb-8">"{selectedQuestion}"</h4>
                
                <div className="space-y-6 text-lg leading-relaxed text-foreground/90 font-serif">
                  {readingText.split('\n\n').map((para, i) => (
                    <p key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-700">{para}</p>
                  ))}
                  {isReading && (
                    <span className="inline-block w-2 h-5 bg-secondary ml-1 animate-pulse" />
                  )}
                </div>
                <div ref={readingEndRef} />
              </div>
            </div>

            {!isReading && readingText && (
              <div className="p-8 border-t border-outline-variant/30 bg-surface/10 flex flex-wrap gap-4 items-center justify-between">
                <p className="text-sm text-foreground/60">
                  This reading is based on your unique birth chart.
                </p>
                <div className="flex gap-3">
                  <Button variant="primary" onClick={() => { setStep('birth'); setReadingText(''); setNote(''); }}>
                    Ask Another
                  </Button>
                  <Button onClick={() => router.push('/chat')}>
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
