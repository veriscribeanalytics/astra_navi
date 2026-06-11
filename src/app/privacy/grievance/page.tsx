'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Grievance Redressal Page
 *
 * DPDP Act 2023, Section 13 — Data Principals must have access to
 * a grievance redressal mechanism. This page provides:
 * 1. Grievance Officer contact details (published)
 * 2. In-app grievance submission form
 * 3. Expected response timeline
 */

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function GrievancePage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      // Submit grievance via backend proxy
      const res = await fetch('/api/support/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed. Please try again.');
      }

      setStatus('success');
      setSubject('');
      setDescription('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

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
          Grievance Redressal
        </span>
        <h1 className="text-3xl sm:text-5xl font-headline font-bold text-primary leading-tight">
          Submit a Grievance
        </h1>
        <p className="text-xs sm:text-sm text-primary/50">
          We respond to all grievances within 30 days
        </p>
      </section>

      {/* Grievance Officer Card */}
      <Card variant="bordered" padding="lg" className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary mb-4">
          Grievance Officer
        </h2>
        <p className="text-sm text-primary/70 leading-relaxed mb-4">
          In accordance with the DPDP Act, 2023 and the Information Technology Act, 2000,
          the following officer is designated to address any concerns regarding your personal data:
        </p>
        <div className="bg-background/40 p-4 sm:p-5 border border-outline-variant/20 rounded-2xl space-y-2 text-sm text-primary/80">
          <p><strong>Name:</strong> Data Protection Officer</p>
          <p><strong>Entity:</strong> Veriscribe Analytics & AI Pvt. Ltd.</p>
          <p><strong>Address:</strong> Gurugram, Haryana, India</p>
          <p>
            <strong>Email:</strong>{' '}
            <a
              href="mailto:contact@veriscribeanalytics.com"
              className="text-secondary hover:underline font-bold"
            >
              contact@veriscribeanalytics.com
            </a>
          </p>
          <p className="text-xs text-primary/50 mt-2">
            You can also use the form below to submit your grievance directly through the platform.
          </p>
        </div>
      </Card>

      {/* Grievance Form */}
      <Card variant="bordered" padding="lg" className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary mb-4">
          Submit Your Grievance
        </h2>

        {status === 'success' ? (
          <div className="flex flex-col items-center text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-headline font-bold text-primary">Grievance Submitted</h3>
            <p className="text-sm text-primary/60 max-w-md leading-relaxed">
              Your grievance has been received and assigned a tracking ID. Our Grievance Officer
              will review it and respond within <strong>30 days</strong>, as mandated by the DPDP Act, 2023.
              You will receive updates via email.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="auth-btn-gold px-5 py-2.5 !rounded-[18px] !text-xs cursor-pointer"
            >
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject */}
            <div>
              <label
                htmlFor="grievance-subject"
                className="block text-xs sm:text-sm font-bold text-primary mb-2 uppercase tracking-wider"
              >
                Subject
              </label>
              <input
                id="grievance-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="e.g., Request to access my personal data"
                className="w-full px-4 py-3 rounded-[18px] bg-background/60 border border-outline-variant/30 text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:border-secondary/50 focus:ring-2 focus:ring-secondary/10 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="grievance-desc"
                className="block text-xs sm:text-sm font-bold text-primary mb-2 uppercase tracking-wider"
              >
                Description
              </label>
              <textarea
                id="grievance-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                placeholder="Please describe your concern in detail. Include relevant dates, data types, and specific requests."
                className="w-full px-4 py-3 rounded-[18px] bg-background/60 border border-outline-variant/30 text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:border-secondary/50 focus:ring-2 focus:ring-secondary/10 transition-all resize-y min-h-[120px]"
              />
            </div>

            {/* Timeline note */}
            <p className="text-xs text-primary/50 leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-secondary" />
              You can expect an acknowledgement within 48 hours and a resolution within{' '}
              <strong className="text-primary/70">30 days</strong>, as per DPDP Act, 2023
              guidelines. For urgent privacy concerns, email us directly at{' '}
              <a
                href="mailto:contact@veriscribeanalytics.com"
                className="text-secondary hover:underline"
              >
                contact@veriscribeanalytics.com
              </a>
              .
            </p>

            {/* Error */}
            {status === 'error' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'submitting' || !subject.trim() || !description.trim()}
              className="auth-btn-gold px-6 py-3 !rounded-[18px] !text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Grievance
                </>
              )}
            </button>
          </form>
        )}
      </Card>

      {/* Legal Note */}
      <p className="text-center text-[10px] sm:text-xs text-primary/30 leading-relaxed">
        This grievance mechanism is established under Section 13 of the Digital Personal Data
        Protection Act, 2023, read with Rule 14 of the DPDP Rules, 2025.
      </p>
    </div>
  );
}
