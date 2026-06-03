'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  FileJson,
  Trash2,
  RefreshCw,
  Cookie,
  Bell,
  FileText,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { useAuth } from '@/context/AuthContext';
import { ConsentPreference, PRIVACY_POLICY_VERSION } from '@/types/consent';

/**
 * Privacy Settings & Consent Management Page
 *
 * DPDP Act 2023 compliance — provides users with:
 * - View and manage cookie / tracking consent preferences
 * - View active consent records
 * - Download personal data (Right to Data Portability)
 * - Withdraw consent
 * - Link to account deletion (Right to Erasure)
 */

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const {
    preferences,
    hasConsented,
    consentedAt,
    consentedVersion,
    openPreferences,
    resetConsent,
    isCategoryEnabled,
  } = useCookieConsent();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Local state to mirror cookie consent preferences for inline management
  const [localPrefs, setLocalPrefs] = useState<ConsentPreference[]>(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // Data export handler
  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError('');
    setExportSuccess(false);

    try {
      const res = await fetch('/api/user/export', {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Export failed.');
      }

      const data = await res.json();

      // Trigger file download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `astra_navi_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Export failed. Please try again.'
      );
    } finally {
      setExporting(false);
    }
  }, []);

  // Withdraw consent handler
  const handleWithdrawConsent = useCallback(() => {
    setWithdrawing(true);
    // Reset to banner state — user can re-consent
    resetConsent();
    setWithdrawSuccess(true);
    setWithdrawing(false);
    setTimeout(() => setWithdrawSuccess(false), 5000);
  }, [resetConsent]);

  const needsReconsent = consentedVersion !== PRIVACY_POLICY_VERSION;

  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-20 flex flex-col relative z-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 scale-content">
      {/* Back */}
      <Link
        href="/profile/security"
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-secondary hover:text-secondary/80 font-bold transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Security Settings
      </Link>

      {/* Title */}
      <section className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-secondary uppercase bg-secondary/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full inline-block">
          Data & Privacy
        </span>
        <h1 className="text-3xl sm:text-5xl font-headline font-bold text-primary leading-tight">
          Privacy Settings
        </h1>
        <p className="text-xs sm:text-sm text-primary/50">
          Manage your data, consent, and privacy preferences
        </p>
        {needsReconsent && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            Privacy policy updated — review your preferences
          </div>
        )}
      </section>

      {/* 1. Consent Preferences */}
      <Card variant="bordered" padding="lg" className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-headline font-bold text-primary">
              Cookie & Tracking Preferences
            </h2>
            <p className="text-[11px] text-primary/50">
              {hasConsented
                ? `Consent recorded ${consentedAt ? new Date(consentedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} (v${consentedVersion || '1.0.0'})`
                : 'Consent not yet provided'}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          {localPrefs.map((pref) => (
            <div
              key={pref.category}
              className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-outline-variant/15"
            >
              <div>
                <span className="text-sm font-bold text-primary">{pref.name}</span>
                <span className="text-xs text-primary/50 ml-2">{pref.required ? '(Required)' : '(Optional)'}</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                pref.enabled ? 'text-green-400' : 'text-primary/30'
              }`}>
                {pref.enabled ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Enabled</>
                ) : (
                  <><XCircle className="w-3.5 h-3.5" /> Disabled</>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={openPreferences}
            className="auth-btn-gold px-5 py-2.5 !rounded-[18px] !text-[11px] sm:!text-xs font-bold cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Manage Preferences
          </button>
          <button
            onClick={handleWithdrawConsent}
            disabled={withdrawing || withdrawSuccess}
            className="px-5 py-2.5 rounded-[18px] text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-red-400 hover:border-red-400/30 transition-all bg-transparent cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {withdrawSuccess ? (
              <><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Consent Withdrawn</>
            ) : (
              <><RefreshCw className={`w-3.5 h-3.5 ${withdrawing ? 'animate-spin' : ''}`} /> Withdraw Consent</>
            )}
          </button>
        </div>
      </Card>

      {/* 2. Data Portability */}
      <Card variant="bordered" padding="lg" className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <Download className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-headline font-bold text-primary">
              Download Your Data
            </h2>
            <p className="text-[11px] text-primary/50">
              Right to Data Portability — DPDP Act, 2023 Section 11
            </p>
          </div>
        </div>

        <p className="text-sm text-primary/70 leading-relaxed mb-4">
          You can download a complete copy of all personal data we hold about you,
          including profile details, birth chart data, consent records, and activity
          history. The export is provided in machine-readable JSON format.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="auth-btn-gold px-5 py-2.5 !rounded-[18px] !text-[11px] sm:!text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {exporting ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Exporting...</>
            ) : (
              <><FileJson className="w-3.5 h-3.5" /> Export My Data (JSON)</>
            )}
          </button>

          {exportSuccess && (
            <span className="text-[11px] font-bold text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Downloaded successfully
            </span>
          )}

          {exportError && (
            <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {exportError}
            </span>
          )}
        </div>
      </Card>

      {/* 3. Account Deletion */}
      <Card variant="bordered" padding="lg" className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-headline font-bold text-primary">
              Delete Account & Data
            </h2>
            <p className="text-[11px] text-primary/50">
              Right to Erasure — DPDP Act, 2023 Section 12
            </p>
          </div>
        </div>

        <p className="text-sm text-primary/70 leading-relaxed mb-4">
          You have the right to request deletion of all your personal data. This action
          permanently erases your profile, birth charts, chat history, and all associated
          data. This cannot be undone.
        </p>

        <Link
          href="/profile/security"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[18px] text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all bg-transparent cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Go to Account Deletion
        </Link>
      </Card>

      {/* 4. Legal Links */}
      <Card variant="bordered" padding="lg" className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-headline font-bold text-primary">
              Legal Documents
            </h2>
            <p className="text-[11px] text-primary/50">
              Our commitments to your privacy
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[18px] text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-primary hover:border-outline-variant/60 transition-all bg-transparent cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[18px] text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-primary hover:border-outline-variant/60 transition-all bg-transparent cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Terms & Conditions
          </Link>
          <Link
            href="/privacy/subprocessors"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[18px] text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-primary hover:border-outline-variant/60 transition-all bg-transparent cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Subprocessors
          </Link>
          <Link
            href="/privacy/grievance"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[18px] text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-primary hover:border-outline-variant/60 transition-all bg-transparent cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            Submit Grievance
          </Link>
        </div>
      </Card>
    </div>
  );
}
