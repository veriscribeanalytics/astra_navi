'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RazorpayCheckoutHandler } from '@/components/billing/RazorpayCheckoutHandler';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Clock, Shield, Star, FlaskConical, Compass, Wallet, Calendar, X, Check, CheckCircle, Info, Lock } from 'lucide-react';
import MockCheckoutModal from '@/components/billing/MockCheckoutModal';
import { CatalogProduct, BalanceResponse, CatalogResponse, CatalogSubscription, CatalogCreditPack, CatalogOneTimeReport, normalizeCatalogResponse, normalizeHistoryResponse, CreditHistoryResponse, getTierLabel } from '@/types/billing';
import { useAuth } from '@/context/AuthContext';
import { usePaywallContext } from '@/context/PaywallContext';
import { useTranslation } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';

// Static detailed features for details popup modal
const detailedFeaturesMap: Record<string, string[]> = {
  free: [
    '3 AI messages per day with Navi',
    'Basic Lagna chart (Kundli) calculation',
    'Short general daily horoscope forecast',
    'Standard response times',
    'Access to public forums & astrology articles'
  ],
  pro: [
    '300 Navi Credits credited monthly',
    'Extended daily chat messages with Navi AI',
    'Full daily horoscope with personalized transits',
    'Panchang timing (choghadiya & hora)',
    'Full chart access (lagna, navamsha, moon chart)',
    'Basic Kundli premium access (planetary strength)',
    'Guided consult sessions (5 sessions value)',
    'Faster response times'
  ],
  premium: [
    '900 Navi Credits credited monthly',
    'Priority daily AI consultations',
    'Full personalized daily horoscope with remedies',
    'Full Kundli premium sections (gemstones, dashas, remedies)',
    'Dasha period analysis (mahadasha & antardasha)',
    'Priority consult sessions with direct booking',
    'Priority support & instant response times'
  ]
};

// Fallback catalog in case API catalog is loading or empty
const defaultCreditPacks: CatalogCreditPack[] = [
  { productId: 'chat_pack_50', productType: 'one_time_pack', nameEn: '50 Credits', priceInr: 49, credits: 50, validityDays: null, isActive: true },
  { productId: 'chat_pack_150', productType: 'one_time_pack', nameEn: '150 Credits', priceInr: 99, credits: 150, validityDays: null, isActive: true },
  { productId: 'chat_pack_300', productType: 'one_time_pack', nameEn: '300 Credits', priceInr: 199, credits: 300, validityDays: null, isActive: true },
  { productId: 'chat_pack_500', productType: 'one_time_pack', nameEn: '500 Credits', priceInr: 299, credits: 500, validityDays: null, isActive: true },
  { productId: 'chat_pack_1000', productType: 'one_time_pack', nameEn: '1000 Credits', priceInr: 499, credits: 1000, validityDays: null, isActive: true },
];

const defaultReports: CatalogOneTimeReport[] = [
  { productId: 'kundli_report', productType: 'one_time_report', nameEn: 'Kundli Deep Report', priceInr: 79, credits: 10, isActive: true, descriptionEn: 'Full Kundli analysis with Dasha timeline, strengths, and remedies' },
  { productId: 'match_report', productType: 'one_time_report', nameEn: 'Match Compatibility Report', priceInr: 79, credits: 10, isActive: true, descriptionEn: 'Detailed 36-Guna match with AI narrative and Mangal Dosha analysis' },
  { productId: 'monthly_report', productType: 'one_time_report', nameEn: 'Monthly Navi Report', priceInr: 149, credits: 20, isActive: true, descriptionEn: 'AI-generated monthly forecast narrative with transit analysis' },
];

function getProductColorTheme(color: string | null | undefined) {
  const hex = (color || '').toUpperCase();
  if (hex === '#10B981') {
    return {
      text: 'text-emerald-400',
      borderHover: 'hover:border-emerald-500/30',
      buttonHover: 'hover:bg-emerald-500/15 hover:border-emerald-500 hover:text-emerald-400',
    };
  }
  if (hex === '#3B82F6') {
    return {
      text: 'text-blue-400',
      borderHover: 'hover:border-blue-500/30',
      buttonHover: 'hover:bg-blue-500/15 hover:border-blue-500 hover:text-blue-400',
    };
  }
  if (hex === '#EC4899') {
    return {
      text: 'text-pink-400',
      borderHover: 'hover:border-pink-500/30',
      buttonHover: 'hover:bg-pink-500/15 hover:border-pink-500 hover:text-pink-400',
    };
  }
  if (hex === '#F59E0B' || hex === '#D97706') {
    return {
      text: 'text-amber-400',
      borderHover: 'hover:border-amber-500/30',
      buttonHover: 'hover:bg-amber-500/15 hover:border-amber-500 hover:text-amber-400',
    };
  }
  if (hex === '#EF4444') {
    return {
      text: 'text-rose-400',
      borderHover: 'hover:border-rose-500/30',
      buttonHover: 'hover:bg-rose-500/15 hover:border-rose-500 hover:text-rose-400',
    };
  }
  if (hex === '#8B5CF6' || hex === '#7C3AED') {
    return {
      text: 'text-purple-400',
      borderHover: 'hover:border-purple-500/30',
      buttonHover: 'hover:bg-purple-500/15 hover:border-purple-500 hover:text-purple-400',
    };
  }
  return {
    text: 'text-secondary',
    borderHover: 'hover:border-secondary/30',
    buttonHover: 'hover:bg-secondary/15 hover:border-secondary hover:text-secondary',
  };
}

export default function PlansClient() {
  const { isLoggedIn, user } = useAuth();
  const { tier, totalCredits, balance, isLoading: paywallLoading, refresh: refreshPaywall, refreshVersion, getTierColor } = usePaywallContext();
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();

  // Redesign local states
  const [activeTab, setActiveTab] = useState<'pricing' | 'history'>('pricing');
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<any | null>(null);

  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [history, setHistory] = useState<CreditHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'usage' | 'grant' | 'refund' | 'purchase'>('all');

  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device width
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch catalog on load
  const isTestMode = searchParams?.get('test') === '1'
    && process.env.NEXT_PUBLIC_ENABLE_TEST_PLANS === '1';

  useEffect(() => {
    setCatalogLoading(true);
    const params = new URLSearchParams();
    if (language) params.set('lang', language);
    if (isTestMode) params.set('include_inactive', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';

    clientFetch(`/api/entitlements/catalog${query}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setCatalog(normalizeCatalogResponse(data, { showInactive: isTestMode }));
        }
      })
      .catch(err => console.warn('[PlansClient] Failed to fetch catalog:', err))
      .finally(() => setCatalogLoading(false));
  }, [language, isTestMode]);

  // Fetch history on load
  const fetchHistory = useCallback(async () => {
    if (!isLoggedIn) return;
    setHistoryLoading(true);
    try {
      const res = await clientFetch('/api/entitlements/history?limit=50');
      if (res.ok) {
        const data = await res.json();
        setHistory(normalizeHistoryResponse(data));
      }
    } catch (err) {
      console.warn('[PlansClient] Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchHistory();
    }
  }, [isLoggedIn, fetchHistory, refreshVersion]);

  // Razorpay integration setup
  const razorpayHandler = useMemo(() => {
    if (!isLoggedIn) return null;
    return new RazorpayCheckoutHandler(
      {
        name: user?.name,
        email: user?.email,
        phoneNumber: (user as any)?.phoneNumber || '',
      },
      language || 'en',
      async () => { await refreshPaywall(); }
    );
  }, [isLoggedIn, user, language, refreshPaywall]);

  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleSelectProduct = useCallback((product: CatalogProduct) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  }, []);

  // Helper mapping tier to plan name
  const getPlanName = (tStr: string) => {
    const tLower = (tStr || '').toLowerCase();
    if (tLower === 'premium') return 'Premium Monthly';
    if (tLower === 'pro') return 'Pro Monthly';
    return 'Free Plan';
  };

  const effectiveBalance: BalanceResponse | null = balance || (isLoggedIn ? {
    credits: totalCredits ?? 0,
    tier: tier || user?.tier || 'free',
  } : null);

  const balanceLoading = isLoggedIn && paywallLoading && !balance;

  const currentPlanTier = (effectiveBalance?.tier || 'free').toLowerCase();
  const currentPlanColor = getTierColor(currentPlanTier);

  // Dynamic products parsing
  const creditPacks = useMemo(() => {
    return defaultCreditPacks.map(defaultPack => {
      if (!catalogLoading && catalog?.creditPacks) {
        const apiPack = catalog.creditPacks.find(p => p.productId === defaultPack.productId);
        if (apiPack) {
          return {
            ...defaultPack,
            ...apiPack,
          };
        }
      }
      return defaultPack;
    });
  }, [catalog, catalogLoading]);

  const reports = useMemo(() => {
    return defaultReports.map(defaultRep => {
      if (!catalogLoading && catalog?.reports) {
        const apiRep = catalog.reports.find(r => r.productId === defaultRep.productId);
        if (apiRep) {
          return {
            ...defaultRep,
            ...apiRep,
          };
        }
      }
      return defaultRep;
    });
  }, [catalog, catalogLoading]);

  // Subscriptions setup with custom bullets
  const subscriptionPlans = useMemo(() => {
    const plans = [
      {
        productId: 'free',
        tier: 'free',
        nameEn: 'Free Plan',
        priceInr: 0,
        credits: 30,
        isRecommended: false,
        bullets: [
          '3 AI messages per day',
          'Basic Kundli',
          'Short daily horoscope'
        ]
      },
      {
        productId: 'pro_monthly',
        tier: 'pro',
        nameEn: 'Pro Monthly',
        priceInr: 199,
        credits: 300,
        isRecommended: false,
        bullets: [
          'Full daily horoscope',
          'Panchang timing',
          'Full chart access',
          'Basic Kundli premium access',
          'Guided consult sessions'
        ]
      },
      {
        productId: 'premium_monthly',
        tier: 'premium',
        nameEn: 'Premium Monthly',
        priceInr: 499,
        credits: 900,
        isRecommended: true,
        bullets: [
          'Full personalized daily horoscope',
          'Full Kundli premium sections',
          'Dasha period analysis',
          'Priority AI consultations'
        ]
      }
    ];

    // Map dynamic prices & catalog items if they exist
    const mapped = plans.map(p => {
      // Find the subscription product in the catalog.
      // If we are in test mode, we might want to map to the test product if available.
      let catalogSub = catalog?.subscriptions.find(s => 
        s.tier?.toLowerCase() === p.tier && 
        (isTestMode ? s.productId.includes('test') : !s.productId.includes('test'))
      );
      if (!catalogSub) {
        catalogSub = catalog?.subscriptions.find(s => s.tier?.toLowerCase() === p.tier);
      }

      return {
        ...p,
        productId: catalogSub?.productId || p.productId,
        priceInr: catalogSub ? (catalogSub.salePriceInr ?? catalogSub.priceInr) : p.priceInr,
        credits: catalogSub?.credits || p.credits,
        catalogProduct: catalogSub || null
      };
    });

    // Mobile specific layout sorting: Current Plan first, Recommended Plan second, others below
    if (isMobile) {
      return [...mapped].sort((a, b) => {
        const aCurrent = a.tier === currentPlanTier;
        const bCurrent = b.tier === currentPlanTier;
        if (aCurrent && !bCurrent) return -1;
        if (!aCurrent && bCurrent) return 1;

        const aRec = a.isRecommended;
        const bRec = b.isRecommended;
        if (aRec && !bRec) return -1;
        if (!aRec && bRec) return 1;

        return 0;
      });
    }

    // Desktop: normal order (Free -> Pro -> Premium)
    return mapped;
  }, [catalog, catalogLoading, isMobile, currentPlanTier, isTestMode]);

  const handleSelectSubscription = (plan: any) => {
    if (plan.tier === 'free') {
      alert("Free plan is the default. To downgrade or manage subscription, please contact support or use the management portal.");
      return;
    }

    if (plan.catalogProduct) {
      handleSelectProduct(plan.catalogProduct);
    } else {
      const mockProd: CatalogProduct = {
        productId: plan.productId,
        productType: 'subscription',
        nameEn: plan.nameEn,
        tier: plan.tier,
        priceInr: plan.priceInr,
        credits: plan.credits,
        validityDays: 30,
        isActive: true,
      };
      handleSelectProduct(mockProd);
    }
  };

  const openDetails = (plan: any) => {
    setDetailsProduct({
      ...plan,
      detailedFeatures: detailedFeaturesMap[plan.tier] || []
    });
  };

  // Calculations for renewal date & plan name
  const renewalDateStr = useMemo(() => {
    if (!effectiveBalance?.nextRenewalAt) return 'N/A';
    return new Date(effectiveBalance.nextRenewalAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [effectiveBalance?.nextRenewalAt]);

  const planNameStr = useMemo(() => {
    return getPlanName(effectiveBalance?.tier || 'free');
  }, [effectiveBalance?.tier]);

  const filteredHistoryEntries = useMemo(() => {
    if (!history) return [];
    const entries = history.entries || [];
    if (historyFilter === 'all') return entries;
    return entries.filter(e => e.actionCategory === historyFilter);
  }, [history, historyFilter]);

  return (
    <div className="min-h-screen pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 flex flex-col relative z-10">
      <style jsx global>{`
        @keyframes shimmer-sweep {
          0% { transform: translateX(-150%) skewX(-25deg); }
          50% { transform: translateX(150%) skewX(-25deg); }
          100% { transform: translateX(150%) skewX(-25deg); }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════
          1. TOP HERO HEADER (Compact: 180px - 220px max)
          ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-4xl mx-auto mb-6 sm:mb-8 relative flex flex-col items-center justify-center min-h-[140px] sm:min-h-[180px] w-full"
      >
        {/* Subtle cosmic blur backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] sm:w-[350px] h-[150px] pointer-events-none opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, rgba(200,136,10,0.4) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-secondary/30" />
          <Compass className="w-4 h-4 text-secondary/70" />
          <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-secondary/30" />
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-headline font-black text-primary leading-tight tracking-tight mb-2">
          Unlock Your Cosmic Potential
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm lg:text-base text-primary/70 max-w-xl mx-auto leading-relaxed px-2">
          Choose the plan that matches your journey.
        </p>

        {/* Test mode banner */}
        {isTestMode && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/[0.08] border border-amber-500/20 mt-3 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
            <FlaskConical className="w-3 h-3" />
            Test Mode — ₹1 test plans visible
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          2. CREDIT SUMMARY BAR (Full width card under hero, logged-in)
          ═══════════════════════════════════════════════════════════ */}
      {isLoggedIn && effectiveBalance && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full mb-6"
        >
          {balanceLoading ? (
            <div className="h-24 w-full bg-surface/30 border border-outline-variant/10 rounded-2xl animate-pulse" />
          ) : (
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:items-center lg:justify-between gap-4 p-5 sm:p-6 bg-surface border border-[var(--current-plan-color)]/20 rounded-2xl relative overflow-hidden shadow-md"
              style={{ '--current-plan-color': currentPlanColor } as React.CSSProperties}
            >
              {/* Radial glow */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                  background: 'radial-gradient(circle at 10% 50%, var(--current-plan-color) 0%, transparent 60%)',
                }}
              />

              <div className="flex flex-col">
                <span className="text-[10px] text-primary/65 uppercase tracking-wider font-bold">Your Navi Credits</span>
                <span className="text-xl sm:text-2xl font-black text-secondary tabular-nums mt-0.5">{effectiveBalance.credits}</span>
              </div>
              
              <div className="h-8 w-[1px] bg-outline-variant/15 hidden lg:block" />

              <div className="flex flex-col">
                <span className="text-[10px] text-primary/65 uppercase tracking-wider font-bold">Subscription Credits</span>
                <span className="text-xl sm:text-2xl font-bold text-primary tabular-nums mt-0.5">{effectiveBalance.subscriptionCredits ?? 0}</span>
              </div>
              
              <div className="h-8 w-[1px] bg-outline-variant/15 hidden lg:block" />

              <div className="flex flex-col">
                <span className="text-[10px] text-primary/65 uppercase tracking-wider font-bold">Pack Credits</span>
                <span className="text-xl sm:text-2xl font-bold text-primary tabular-nums mt-0.5">{effectiveBalance.packCredits ?? 0}</span>
              </div>
              
              <div className="h-8 w-[1px] bg-outline-variant/15 hidden lg:block" />

              <div className="flex flex-col">
                <span className="text-[10px] text-primary/65 uppercase tracking-wider font-bold">Next Renewal</span>
                <span className="text-sm sm:text-base font-bold text-primary mt-1">{renewalDateStr}</span>
              </div>
              
              <div className="h-8 w-[1px] bg-outline-variant/15 hidden lg:block" />

              <div className="flex flex-col">
                <span className="text-[10px] text-primary/65 uppercase tracking-wider font-bold">Current Plan</span>
                <span className="text-sm sm:text-base font-black text-[var(--current-plan-color)] mt-1">{planNameStr}</span>
              </div>

              <a href="/profile" className="col-span-2 md:col-span-1 lg:col-span-auto flex items-center justify-center px-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 hover:border-secondary text-secondary rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap">
                Manage Plan
              </a>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          3. MAIN TAB SWITCH (Plans & Pricing | Credit History, logged-in)
          ═══════════════════════════════════════════════════════════ */}
      {isLoggedIn && (
        <div className="flex justify-center mb-8 w-full">
          <div className="inline-flex p-1 bg-surface-variant/20 border border-outline-variant/10 rounded-full">
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'pricing'
                  ? 'border border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(200,136,10,0.15)] text-secondary'
                  : 'text-primary/40 hover:text-primary/75'
              }`}
            >
              Plans & Pricing
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'history'
                  ? 'border border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(200,136,10,0.15)] text-secondary'
                  : 'text-primary/40 hover:text-primary/75'
              }`}
            >
              Credit History
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TABS CONTENT ROUTER
          ═══════════════════════════════════════════════════════════ */}
      <div className="w-full flex-grow">
        {activeTab === 'pricing' ? (
          <motion.div
            key="pricing-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            {/* ═══════════════════════════════════════════════════════════
                5. SUBSCRIPTION PLANS GRID (3 Cards Grid)
                ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full items-stretch">
              {subscriptionPlans.map((plan) => {
                const isCurrent = plan.tier === currentPlanTier;
                const planColor = plan.catalogProduct?.color || getTierColor(plan.tier);

                let cardClass = 'border-[var(--plan-color)]/30 bg-surface text-primary relative';
                let btnClass = 'border border-[var(--plan-color)]/40 text-[var(--plan-color)] hover:bg-[var(--plan-color)]/10 hover:border-[var(--plan-color)]';

                if (plan.tier === 'premium') {
                  cardClass += ' shadow-lg';
                  if (!isCurrent) {
                    btnClass = 'bg-[var(--plan-color)] text-white font-black hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]';
                  }
                } else if (plan.tier === 'pro') {
                  cardClass += ' shadow-md';
                } else {
                  cardClass += ' shadow-sm';
                }

                if (isCurrent) {
                  btnClass = 'bg-primary/[0.04] text-primary/40 border border-outline-variant/15 cursor-default';
                }

                return (
                  <motion.div
                    key={plan.productId}
                    className={`p-6 rounded-[24px] border flex flex-col justify-between hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 ${cardClass}`}
                    style={{ '--plan-color': planColor } as React.CSSProperties}
                  >
                    {/* Badge Recommendation */}
                    {plan.isRecommended && (
                      <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black uppercase tracking-widest py-1 px-3 rounded-full shadow-lg">
                        Recommended
                      </div>
                    )}

                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[var(--plan-color)]/10 text-[var(--plan-color)] border border-[var(--plan-color)]/20">
                          {plan.tier}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[var(--plan-color)]/10 text-[var(--plan-color)] border border-[var(--plan-color)]/20">
                            Current Plan
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-headline font-bold text-primary">{plan.nameEn}</h3>
                      
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-headline font-black text-secondary">
                          ₹{plan.priceInr}
                        </span>
                        <span className="text-xs text-primary/65">/mo</span>
                      </div>

                      <div className="mt-2 text-xs font-bold text-secondary">
                        {plan.credits} Navi Credits/month
                      </div>

                      {/* Bullet point features (Short & Compact) */}
                      <div className="space-y-2.5 my-5">
                        {plan.bullets.map((bullet, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs text-primary">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom buttons */}
                    <div className="mt-auto">
                      <button
                        onClick={() => openDetails(plan)}
                        className="text-[11px] text-primary/65 hover:text-[var(--plan-color)] font-bold underline mb-4 block mx-auto transition-colors"
                      >
                        View Plan Details
                      </button>
                      
                      <button
                        onClick={() => handleSelectSubscription(plan)}
                        disabled={isCurrent}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${btnClass}`}
                      >
                        {isCurrent ? 'Current Plan' : 'Select Plan'}
                        {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                6. COMPACT ONE-TIME CREDIT PACKS (Horizontal scroll / 5 col grid)
                ═══════════════════════════════════════════════════════════ */}
            <section className="mb-10 w-full">
              <div className="text-center md:text-left mb-5">
                <h3 className="text-base sm:text-lg font-headline font-bold text-primary">Buy Navi Credits</h3>
                <p className="text-xs text-primary/65">One-time credit bundles — use anytime</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {creditPacks.map((pack) => {
                  const theme = getProductColorTheme(pack.color);
                  return (
                    <div
                      key={pack.productId}
                      className={`min-w-[210px] md:min-w-0 snap-start p-4 bg-surface border border-outline-variant/20 ${theme.borderHover} rounded-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.015] shadow-sm`}
                    >
                      <div>
                        <span className={`text-[9px] ${theme.text} font-black uppercase tracking-widest`}>Navi Pack</span>
                        <h4 className="text-base font-black text-primary mt-0.5">{pack.credits} Credits</h4>
                        <p className="text-[10px] text-primary/65 mt-1 font-medium">No expiry, use anytime</p>
                      </div>

                      <div className="mt-4">
                        <div className={`text-lg font-headline font-black ${theme.text} mb-2.5`}>₹{pack.priceInr}</div>
                        <button
                          onClick={() => handleSelectProduct(pack)}
                          className={`w-full py-2 bg-transparent ${theme.buttonHover} border border-outline-variant/30 text-primary font-bold rounded-xl text-xs uppercase tracking-wider transition-all`}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                7. ONE-TIME REPORTS (Collapsed Section)
                ═══════════════════════════════════════════════════════════ */}
            <div className="w-full mb-12">
              <div className="flex items-center justify-between border-t border-outline-variant/10 pt-6 pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-headline font-bold text-primary">One-Time Reports</h3>
                  <p className="text-xs text-primary/65">Detailed cosmic guides for specific life queries</p>
                </div>
                <button
                  onClick={() => setReportsExpanded(!reportsExpanded)}
                  className="px-4 py-2 border border-outline-variant/30 hover:border-secondary text-primary/65 hover:text-secondary rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  {reportsExpanded ? 'Collapse Add-ons' : 'View Report Add-ons'}
                  <span className="text-[10px]">{reportsExpanded ? '▲' : '▼'}</span>
                </button>
              </div>

              <AnimatePresence>
                {reportsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 overflow-hidden"
                  >
                    {reports.map((report) => {
                      const theme = getProductColorTheme(report.color);
                      return (
                        <div
                          key={report.productId}
                          className={`p-5 bg-surface border border-outline-variant/20 rounded-2xl flex flex-col justify-between ${theme.borderHover} transition-all duration-300 shadow-sm`}
                        >
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-primary">{report.nameEn}</h4>
                            <p className="text-xs text-primary/80 mt-2 leading-relaxed">
                              {report.descriptionEn || 'Custom birth chart calculation and Vedic analysis.'}
                            </p>
                          </div>
                          <div className="mt-5">
                            <div className={`text-base font-headline font-black ${theme.text} mb-3`}>₹{report.priceInr}</div>
                            <button
                              onClick={() => handleSelectProduct(report)}
                              className={`w-full py-2.5 bg-transparent ${theme.buttonHover} border border-outline-variant/30 text-primary font-bold rounded-xl text-xs uppercase tracking-wider transition-all`}
                            >
                              Get Report
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full mb-12"
          >
            {/* ═══════════════════════════════════════════════════════════
                8. CREDIT HISTORY LEDGER (Inside History Tab)
                ═══════════════════════════════════════════════════════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/10 pb-4 mb-6 gap-4">
              <div>
                <h3 className="text-lg font-headline font-bold text-primary">Credit Usage History</h3>
                <p className="text-xs text-primary/65">Track your subscription renewals, one-time pack purchases, and AI consultation usage</p>
              </div>
              
              {/* Filter tabs */}
              <div className="flex flex-wrap gap-1 bg-surface-variant/10 p-1 rounded-xl border border-outline-variant/10">
                {(['all', 'usage', 'grant', 'refund', 'purchase'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setHistoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      historyFilter === cat
                        ? 'bg-secondary/10 border border-secondary/20 text-secondary'
                        : 'text-primary/60 hover:text-primary/85'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat === 'usage' ? 'Usage' : cat === 'grant' ? 'Grants' : cat === 'refund' ? 'Refunds' : 'Purchases'}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-surface/30 animate-pulse border border-outline-variant/10" />
                ))}
              </div>
            ) : filteredHistoryEntries.length === 0 ? (
              <div className="p-10 text-center bg-surface/20 border border-outline-variant/10 rounded-2xl">
                <p className="text-sm text-primary/65">No activity matches this filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredHistoryEntries.map(entry => {
                  const isPositive = entry.creditsDelta ? entry.creditsDelta > 0 : entry.actionCategory === 'grant' || entry.actionCategory === 'refund' || entry.actionCategory === 'purchase';
                  const deltaVal = entry.creditsDelta ?? (isPositive ? entry.creditsSpent : -entry.creditsSpent);
                  
                  let colorClasses = {
                    text: 'text-secondary',
                    bg: 'bg-secondary/[0.04] border-secondary/15'
                  };
                  
                  if (isPositive) {
                    if (entry.actionCategory === 'refund') {
                      colorClasses = {
                        text: 'text-purple-400',
                        bg: 'bg-purple-500/[0.04] border-purple-400/15'
                      };
                    } else if (entry.actionCategory === 'purchase') {
                      colorClasses = {
                        text: 'text-cyan-400',
                        bg: 'bg-cyan-500/[0.04] border-cyan-400/15'
                      };
                    } else {
                      colorClasses = {
                        text: 'text-emerald-400',
                        bg: 'bg-emerald-500/[0.04] border-emerald-500/15'
                      };
                    }
                  } else {
                    // Usage is gold/orange
                    colorClasses = {
                      text: 'text-secondary',
                      bg: 'bg-secondary/[0.04] border-secondary/15'
                    };
                  }
                  
                  const dateStr = new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  const titleStr = entry.featureNameEn || entry.action;
                  const sourceStr = entry.sourceType 
                    ? (entry.sourceType.charAt(0).toUpperCase() + entry.sourceType.slice(1))
                    : (entry.actionCategory === 'purchase' ? 'Purchase' : entry.actionCategory === 'grant' ? 'Grant' : 'System');
                  
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-surface border border-outline-variant/20 rounded-2xl hover:border-outline-variant/30 transition-all animate-fadeIn shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider shrink-0 ${colorClasses.bg} ${colorClasses.text}`}>
                          {sourceStr}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-primary truncate">{titleStr}</h4>
                          {entry.description && <p className="text-[10px] text-primary/65 truncate mt-0.5">{entry.description}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        <div className="text-right">
                          <span className={`text-xs sm:text-sm font-black ${isPositive ? 'text-emerald-400' : 'text-secondary'}`}>
                            {deltaVal > 0 ? `+${deltaVal}` : deltaVal}
                          </span>
                          {entry.balanceAfter != null && (
                            <p className="text-[9px] text-primary/60 font-bold">{entry.balanceAfter} balance</p>
                          )}
                        </div>
                        <div className="text-[10px] text-primary/65 font-medium min-w-[45px] text-right">
                          {dateStr}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          9. PLAN DETAILS OVERLAY DIALOG (Modal Popup)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailsProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md p-6 sm:p-8 bg-surface border border-outline-variant/20 rounded-[24px] shadow-2xl text-left overflow-hidden"
            >
              {/* Radial backdrop */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  background: 'radial-gradient(circle at top right, rgba(200,136,10,0.8) 0%, transparent 60%)',
                }}
              />
              
              {/* Close */}
              <button
                onClick={() => setDetailsProduct(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-primary/5 text-primary/40 hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Info Header */}
              <div className="mb-5">
                <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Plan Inclusions</span>
                <h3 className="text-xl sm:text-2xl font-headline font-bold text-primary mt-0.5">{detailsProduct.nameEn}</h3>
                <p className="text-sm font-black text-secondary mt-1">
                  {detailsProduct.priceInr === 0 ? '₹0 / month' : `₹${detailsProduct.priceInr} / month`}
                </p>
              </div>
              
              {/* List */}
              <div className="space-y-4 mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-primary/40">Includes features:</h4>
                <div className="space-y-2.5">
                  {detailsProduct.detailedFeatures.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-primary/80">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Button */}
              <button
                onClick={() => {
                  const isCurrent = detailsProduct.tier === currentPlanTier;
                  if (!isCurrent) {
                    handleSelectSubscription(detailsProduct);
                  }
                  setDetailsProduct(null);
                }}
                disabled={detailsProduct.tier === currentPlanTier}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  detailsProduct.tier === currentPlanTier
                    ? 'bg-primary/[0.04] text-primary/25 border border-outline-variant/15 cursor-default'
                    : detailsProduct.isRecommended
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-300 text-black font-black hover:scale-[1.015]'
                      : 'border border-outline-variant/30 text-primary hover:border-secondary/40 hover:bg-secondary/[0.02]'
                }`}
              >
                {detailsProduct.tier === currentPlanTier ? 'Current Plan' : 'Select Plan'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          CHECKOUT MODAL
          ═══════════════════════════════════════════════════════════ */}
      <MockCheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        product={selectedProduct}
        checkoutHandler={razorpayHandler}
      />
    </div>
  );
}
