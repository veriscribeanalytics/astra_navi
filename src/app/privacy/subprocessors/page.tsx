'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Database, Shield, Brain, CreditCard, Server } from 'lucide-react';

/**
 * Subprocessors & Third-Party Data Processors
 *
 * DPDP Act 2023 compliance — public disclosure of all third-party
 * vendors that process personal data on behalf of Astra Navi.
 *
 * Required by: DPDP Rules 2025, Rule 3 (notice) & Rule 6 (safeguards)
 */

interface Subprocessor {
  name: string;
  purpose: string;
  dataCategories: string[];
  location: string;
  url?: string;
  icon: React.ReactNode;
}

const SUBPROCESSORS: Subprocessor[] = [
  {
    name: 'MongoDB Atlas',
    purpose: 'Primary database hosting for user profiles, birth charts, chat history, and astrological data.',
    dataCategories: [
      'Identity details (name, email)',
      'Birth data (DOB, TOB, POB, coordinates)',
      'Astrological charts and readings',
      'Chat conversation history',
      'Account preferences',
    ],
    location: 'India (Mumbai) region',
    url: 'https://www.mongodb.com/cloud/atlas',
    icon: <Database className="w-5 h-5" />,
  },
  {
    name: 'Upstash (Redis)',
    purpose: 'Rate limiting, session caching, and temporary OTP storage for authentication flows.',
    dataCategories: [
      'Session tokens (hashed)',
      'Rate limit counters',
      'Temporary OTP codes (TTL < 10 min)',
    ],
    location: 'Global edge (nearest PoP)',
    url: 'https://upstash.com',
    icon: <Server className="w-5 h-5" />,
  },
  {
    name: 'OpenAI / Anthropic (LLM Providers)',
    purpose: 'Powering AI astrologer chat responses. Birth chart data is used as context for generating personalized Vedic readings.',
    dataCategories: [
      'Anonymized chart positions (no PII)',
      'Chat messages and prompts',
      'Planetary placements & house data',
    ],
    location: 'United States',
    url: 'https://openai.com',
    icon: <Brain className="w-5 h-5" />,
  },
  {
    name: 'Razorpay',
    purpose: 'Payment processing for subscriptions, credit packs, and premium features.',
    dataCategories: [
      'Name and email',
      'Phone number',
      'Transaction metadata (product, amount)',
      'Payment status',
    ],
    location: 'India',
    url: 'https://razorpay.com',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    name: 'Google OAuth',
    purpose: 'Social sign-in authentication. Used when users choose to sign in with their Google account.',
    dataCategories: [
      'Name',
      'Email address',
      'Google account ID',
    ],
    location: 'United States / Global',
    url: 'https://cloud.google.com',
    icon: <Shield className="w-5 h-5" />,
  },
];

export default function SubprocessorsPage() {
  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-20 flex flex-col relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto space-y-8 scale-content">
      {/* Back link */}
      <Link
        href="/privacy"
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-secondary hover:text-secondary/80 font-bold transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Privacy Policy
      </Link>

      {/* Title Header */}
      <section className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-secondary uppercase bg-secondary/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full inline-block">
          Data Processors
        </span>
        <h1 className="text-3xl sm:text-5xl font-headline font-bold text-primary leading-tight">
          Subprocessors
        </h1>
        <p className="text-xs sm:text-sm text-primary/50">
          Last updated: June 3, 2026
        </p>
      </section>

      {/* Intro */}
      <Card variant="bordered" padding="lg" className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm">
        <div className="space-y-3">
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            In compliance with India&apos;s <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>{' '}
            and DPDP Rules, 2025, Astra Navi is committed to transparency about how and where your
            personal data is processed. This page lists all third-party vendors (subprocessors) that
            process personal data on behalf of <strong>Veriscribe Analytics & AI Pvt. Ltd.</strong>.
          </p>
          <p className="text-sm text-primary/60 leading-relaxed">
            Every subprocessor listed below is bound by a Data Processing Agreement (DPA) that
            mandates DPDP-compliant security safeguards, data minimization, purpose limitation, and
            breach notification obligations. We perform due diligence before engaging any subprocessor
            and review these relationships regularly.
          </p>
        </div>
      </Card>

      {/* Subprocessor Cards */}
      <div className="space-y-4">
        {SUBPROCESSORS.map((sp) => (
          <Card
            key={sp.name}
            variant="bordered"
            padding="lg"
            className="border-outline-variant/20 bg-surface/30 backdrop-blur-sm hover:border-secondary/20 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Icon */}
              <div className="shrink-0 w-11 h-11 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                {sp.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-headline font-bold text-primary">
                    {sp.name}
                  </h3>
                  {sp.url && (
                    <a
                      href={sp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-secondary/80 transition-colors inline-flex items-center gap-1"
                      aria-label={`Visit ${sp.name} website`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-primary/70 leading-relaxed">
                  <strong className="text-primary/80">Purpose:</strong> {sp.purpose}
                </p>

                <div>
                  <p className="text-xs font-bold text-primary/60 uppercase tracking-wider mb-1.5">
                    Data Categories Processed
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {sp.dataCategories.map((cat) => (
                      <li key={cat} className="text-xs text-primary/60">
                        {cat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 bg-primary/[0.04] px-2 py-1 rounded-full">
                    📍 {sp.location}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Note */}
      <Card variant="bordered" padding="md" className="border-outline-variant/30 bg-surface/30 backdrop-blur-sm text-center">
        <p className="text-xs text-primary/50 leading-relaxed">
          <strong>Veriscribe Analytics & AI Pvt. Ltd.</strong> reserves the right to update this list
          as our infrastructure evolves. Material changes to subprocessor arrangements will be
          communicated to users at least 15 days in advance, as required by the DPDP Rules, 2025.
        </p>
      </Card>
    </div>
  );
}
