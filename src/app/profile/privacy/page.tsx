'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
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
  Lock,
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
  const { user: _user } = useAuth();
  const {
    preferences,
    hasConsented,
    consentedAt,
    consentedVersion,
    openPreferences,
    resetConsent,
    isCategoryEnabled: _isCategoryEnabled,
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

  const enabledCount = localPrefs.filter((p) => p.enabled).length;

  return (
    <main className="min-h-[calc(100dvh-var(--navbar-height,64px))] pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center relative overflow-x-hidden bg-[var(--bg)] scale-content">
      {/* Ambient glow */}
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-secondary/5 blur-[60px] sm:blur-[100px] rounded-full z-0 pointer-events-none" />

      <div className="w-full max-w-4xl 2xl:max-w-5xl 3xl:max-w-[1600px] relative z-10 pt-8 sm:pt-12">
        {/* Back */}
        <Link
          href="/profile/security"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant hover:text-secondary font-bold transition-colors mb-6 sm:mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Security Settings
        </Link>

        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-surface-variant/50 border border-secondary/20 mb-4 sm:mb-6 cosmic-glow">
            <Lock className="text-secondary w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-3">
            Privacy &amp; Data
          </h1>
          <p className="text-sm font-body text-on-surface-variant max-w-md mx-auto">
            Manage your consent, download your data, and exercise your rights under the DPDP Act, 2023.
          </p>
          {needsReconsent && (
            <div className="inline-flex items-center gap-2 mt-5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Privacy policy updated — please review your preferences
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* 1. Consent Preferences */}
          <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Cookie className="w-5 h-5 text-secondary shrink-0" />
                <h2 className="text-lg sm:text-xl font-headline font-bold text-primary">
                  Cookie &amp; Tracking
                </h2>
              </div>
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70 bg-surface-variant/40 border border-outline-variant/20 rounded-full px-3 py-1">
                {enabledCount}/{localPrefs.length} on
              </span>
            </div>

            <p className="text-xs text-on-surface-variant mb-5">
              {hasConsented
                ? `Consent recorded ${consentedAt ? new Date(consentedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} · v${consentedVersion || '1.0.0'}`
                : 'Consent not yet provided.'}
            </p>

            <div className="divide-y divide-outline-variant/10 rounded-2xl bg-surface-variant/25 border border-outline-variant/15 overflow-hidden mb-6">
              {localPrefs.map((pref) => (
                <div
                  key={pref.category}
                  className="flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-primary">{pref.name}</span>
                    <span className="text-[11px] text-on-surface-variant/60 ml-2">
                      {pref.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    pref.enabled ? 'text-green-400' : 'text-on-surface-variant/40'
                  }`}>
                    {pref.enabled ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> On</>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5" /> Off</>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={openPreferences}
                className="gold-gradient"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Manage Preferences
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleWithdrawConsent}
                disabled={withdrawing || withdrawSuccess}
                className="border-outline-variant/40 hover:border-error/40 hover:text-error"
                leftIcon={
                  withdrawSuccess
                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                    : <RefreshCw className={`w-4 h-4 ${withdrawing ? 'animate-spin' : ''}`} />
                }
              >
                {withdrawSuccess ? 'Consent Withdrawn' : 'Withdraw Consent'}
              </Button>
            </div>
          </Card>

          {/* 2. Data Portability */}
          <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
            <h2 className="text-lg sm:text-xl font-headline font-bold text-primary mb-1.5 flex items-center gap-2.5">
              <Download className="w-5 h-5 text-secondary shrink-0" />
              Download Your Data
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-secondary/70 mb-4">
              Right to Data Portability · DPDP Act 2023, §11
            </p>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
              Download a complete copy of everything we hold about you — profile details,
              birth chart data, consent records, and activity history — as machine-readable JSON.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleExport}
                loading={exporting}
                className="gold-gradient"
                leftIcon={!exporting ? <FileJson className="w-4 h-4" /> : undefined}
              >
                {exporting ? 'Exporting…' : 'Export My Data (JSON)'}
              </Button>

              {exportSuccess && (
                <span className="text-[11px] font-bold text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Downloaded successfully
                </span>
              )}

              {exportError && (
                <span className="text-[11px] font-bold text-error flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {exportError}
                </span>
              )}
            </div>
          </Card>

          {/* 3. Account Deletion — danger zone */}
          <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-error/20 bg-error/5" hoverable={false}>
            <h2 className="text-lg sm:text-xl font-headline font-bold text-error mb-1.5 flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 shrink-0" />
              Delete Account &amp; Data
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-error/60 mb-4">
              Right to Erasure · DPDP Act 2023, §12
            </p>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
              Permanently erase your profile, birth charts, chat history, and all associated
              data. This action cannot be undone.
            </p>

            <Link
              href="/profile/security"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-error/30 text-error hover:bg-error/10 hover:border-error/50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Go to Account Deletion
            </Link>
          </Card>

          {/* 4. Legal Links — subtle footer */}
          <div className="pt-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/50 flex items-center gap-2 mb-4 px-1">
              <FileText className="w-3.5 h-3.5" />
              Legal Documents
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
                { href: '/terms', label: 'Terms & Conditions', icon: FileText },
                { href: '/privacy/subprocessors', label: 'Subprocessors', icon: ExternalLink },
                { href: '/privacy/grievance', label: 'Submit Grievance', icon: Bell },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-outline-variant/15 bg-surface-variant/20 text-sm font-bold text-on-surface-variant hover:text-primary hover:border-secondary/30 hover:bg-surface-variant/40 transition-all"
                >
                  <Icon className="w-4 h-4 text-secondary/70 group-hover:text-secondary transition-colors shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
