'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useTranslation } from '@/hooks';
import Link from 'next/link';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-20 flex flex-col relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto space-y-8 scale-content">
      {/* Title Header */}
      <section className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-secondary uppercase bg-secondary/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full inline-block">
          {t('privacy.title') || 'Privacy Policy'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-headline font-bold text-primary leading-tight">
          {t('privacy.title') || 'Privacy Policy'}
        </h1>
        <p className="text-xs sm:text-sm text-primary/50">
          {t('privacy.lastUpdated') || 'Last updated'}: June 1, 2026
        </p>
      </section>

      {/* Main Legal Content */}
      <Card variant="bordered" padding="lg" className="border-outline-variant/30 text-left space-y-8 bg-surface/50 backdrop-blur-sm">
        
        {/* Intro */}
        <div className="space-y-3">
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Welcome to Astra Mitra. Your privacy is of paramount importance to us. This Privacy Policy explains how <strong>Veriscribe Analytics & AI Pvt. Ltd.</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, discloses, and safeguards your personal data when you use our services, in strict compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India and other global standards.
          </p>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Please read this policy carefully. By registering for or using Astra Mitra, you provide your explicit, unambiguous, and revocable consent to the collection and processing of your personal data as described herein.
          </p>
        </div>

        <hr className="border-outline-variant/20" />

        {/* 1. Data Collection */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">1. Personal Data We Collect</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            To provide highly personalized Vedic astrological insights, birth charts (Kundli), and horoscope matching, we collect the following personal data with your direct consent:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li><strong>Identity & Account Details:</strong> Name, email address, password, gender, marital status, and occupation.</li>
            <li><strong>Astrological Blueprints (Critical Data):</strong> Date of birth, time of birth, and place of birth. These are essential for calculating precise astronomical degrees and houses.</li>
            <li><strong>Communication Details:</strong> Phone number and metadata relating to customer support requests.</li>
          </ul>
        </div>

        {/* 2. Purpose of Collection */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">2. Purposes of Data Processing</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            We process your data strictly for specified, lawful purposes associated with our platform services:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li>Generating precise Vedic birth charts (Kundli) and compatibility readings.</li>
            <li>Powering our interactive AI Astrologer Chat (Navi, Arya, Meera, Anand, Rishi) to answer queries.</li>
            <li>Delivering daily horoscope notifications and planetary transit alerts.</li>
            <li>Processing payments and managing premium subscription services.</li>
          </ul>
        </div>

        {/* 3. Legal Basis & Consent */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">3. Legal Basis for Processing & Consent</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Under India&apos;s DPDP Act 2023, the sole legal basis for processing your personal data is your <strong>freely given, specific, informed, unconditional, and unambiguous consent</strong>. You confirm this consent by checking our consent box during signup.
          </p>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            <strong>Right to Withdraw Consent:</strong> You have the right to withdraw your consent at any time. Withdrawal of consent will not affect the lawfulness of processing based on consent before its withdrawal. To withdraw your consent, you may delete your account.
          </p>
        </div>

        {/* 4. Data Sharing & Third Parties */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">4. Data Storage, Sharing & Transfer</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Your personal data is encrypted in transit and at rest. We do not sell your personal data. We share only necessary, minimized data with trusted third-party subprocessors under strict data privacy agreements:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li><strong>AI / LLM Providers:</strong> To respond to your chats. We redact direct identifier details where feasible.</li>
            <li><strong>Payment Gateways:</strong> To securely process transactions. We do not store full credit card details.</li>
            <li><strong>Database Hosting:</strong> Secure cloud environments in compliant locations.</li>
          </ul>
        </div>

        {/* 4a. Cookie & Local Storage Disclosure */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">4a. Cookies & Local Storage</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Astra Mitra uses cookies and browser local storage for essential platform functionality. We do not use third-party tracking cookies or advertising networks. Here is exactly what is stored on your device:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li><strong>Session Cookie (auth.js.session-token):</strong> Maintains your secure login session. Expires after 30 days of inactivity. Essential.</li>
            <li><strong>Theme Cookie:</strong> Remembers your light/dark mode preference. Purely functional.</li>
            <li><strong>Language Cookie (NEXT_LOCALE):</strong> Remembers your preferred language. Purely functional.</li>
            <li><strong>Consent Cookie (astra_mitra_cookie_consent):</strong> Records your cookie and privacy preferences. Essential for DPDP compliance.</li>
            <li><strong>Local Storage:</strong> Stores UI state such as chat avatar selection, pending messages, and toast notifications. No personal data is persisted here beyond your session.</li>
          </ul>
          <p className="text-sm text-primary/60 leading-relaxed">
            You can manage non-essential cookie preferences at any time via the cookie consent banner or the{' '}
            <Link href="/profile/privacy" className="text-secondary hover:underline font-bold">Privacy Settings</Link> page.
          </p>
        </div>

        <hr className="border-outline-variant/20" />

        {/* 5. Right to Erasure & Other Rights */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">5. Your Legal Rights (Data Principal Rights)</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Under data protection regulations, you hold the following rights:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li><strong>Right to Access & Summary:</strong> Access details of the personal data we hold about you.</li>
            <li><strong>Right to Correction & Update:</strong> Modify your personal profile or astrological configurations.</li>
            <li><strong>Right to Erasure (Right to be Forgotten):</strong> You have the right to have all your personal data deleted from our systems. You can trigger this instantly by navigating to your <Link href="/profile/security" className="text-secondary hover:underline font-bold">Profile Security (Danger Zone)</Link> and selecting &quot;Delete Account&quot;.</li>
          </ul>
        </div>

        {/* 6. Children's Data */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">6. Children&apos;s Data (18+ Age Restriction)</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            In compliance with DPDP rules governing children&apos;s data, Astra Mitra does not offer services to, or knowingly collect personal data from, individuals under the age of 18. An age validation gate is active during registration. If we learn we have collected data from a child under 18 without parental consent, we will delete it immediately.
          </p>
        </div>

        {/* 7. Data Retention */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">7. Data Retention Schedule</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            We retain personal data only as long as necessary for the specific purpose it was collected. Below is our retention schedule per data category:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li><strong>Account & Profile Data:</strong> Retained for the lifetime of your account. Upon deletion, erased or irreversibly anonymized within <strong>30 days</strong>.</li>
            <li><strong>Birth Chart & Astrological Data:</strong> Retained while your account is active. Deleted alongside your account within 30 days of deletion request.</li>
            <li><strong>Chat & Consultation History:</strong> Retained while your account is active. Deleted within 30 days of account deletion.</li>
            <li><strong>Payment & Transaction Records:</strong> Retained for <strong>7 years</strong> as required by Indian tax and financial regulations (Income Tax Act, 1961; Companies Act, 2013), even after account deletion.</li>
            <li><strong>Consent Records (Audit Log):</strong> Retained for <strong>5 years</strong> after consent withdrawal or account deletion for legal compliance under the DPDP Act, 2023.</li>
            <li><strong>Authentication Logs & OTP Records:</strong> Retained for <strong>90 days</strong> for security and fraud prevention.</li>
          </ul>
          <p className="text-sm text-primary/60 leading-relaxed">
            In accordance with the DPDP Rules 2025, Rule 8, we provide <strong>48 hours prior notice</strong> before erasing data due to account inactivity. Data in encrypted backups may take up to an additional 60 days to be fully purged.
          </p>
        </div>

        <hr className="border-outline-variant/20" />

        {/* 7a. Data Breach Response */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">7a. Data Breach Response Commitment</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            In the event of a personal data breach, Astra Mitra is committed to the following response timeline, in compliance with the DPDP Rules, 2025 (Rule 7) and CERT-In guidelines:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li><strong>Immediate Intimation:</strong> The Data Protection Board of India (DPBI) will be notified immediately upon becoming aware of a breach.</li>
            <li><strong>Detailed Report (within 72 hours):</strong> A comprehensive incident report — including the nature of the breach, categories of affected data, number of affected Data Principals, containment measures taken, and remedial actions — will be submitted to the DPBI within 72 hours.</li>
            <li><strong>Affected User Notification (without delay):</strong> Affected Data Principals will be notified directly via email without undue delay, with clear guidance on protective measures they should take.</li>
            <li><strong>CERT-In Reporting (within 6 hours):</strong> For incidents qualifying under CERT-In guidelines, a separate notification will be filed within the mandated 6-hour window.</li>
          </ul>
          <p className="text-sm text-primary/60 leading-relaxed">
            We maintain a documented incident response plan, conduct regular security drills, and employ AES-256 encryption for data at rest and TLS 1.3 for data in transit. Security safeguards are reviewed quarterly.
          </p>
        </div>

        {/* 8. Grievance Redressal */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">8. Grievance Redressal & Contact</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            If you have any questions, concerns, or grievances regarding this Privacy Policy or your personal data processing, you may reach out to our designated Grievance Officer:
          </p>
          <div className="bg-background/40 p-4 border border-outline-variant/20 rounded-xl space-y-1.5 text-xs sm:text-sm text-primary/80">
            <p><strong>Grievance Officer:</strong> {process.env.NEXT_PUBLIC_DPDP_GRIEVANCE_OFFICER_NAME || 'Data Protection Officer'}</p>
            <p><strong>Address/Jurisdiction:</strong> Gurugram, Haryana, India</p>
            <p><strong>Email:</strong> <a href="mailto:contact@veriscribeanalytics.com" className="text-secondary hover:underline font-bold">contact@veriscribeanalytics.com</a></p>
          </div>
        </div>

        <hr className="border-outline-variant/20" />

        {/* 9. Related Resources */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">9. Related Resources</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/privacy/subprocessors" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[18px] text-[11px] font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-secondary hover:border-secondary/30 transition-all bg-transparent">
              Subprocessors List
            </Link>
            <Link href="/privacy/grievance" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[18px] text-[11px] font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-secondary hover:border-secondary/30 transition-all bg-transparent">
              Submit a Grievance
            </Link>
            <Link href="/profile/privacy" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[18px] text-[11px] font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-secondary hover:border-secondary/30 transition-all bg-transparent">
              Privacy Settings
            </Link>
            <Link href="/terms" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[18px] text-[11px] font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-secondary hover:border-secondary/30 transition-all bg-transparent">
              Terms & Conditions
            </Link>
          </div>
        </div>

      </Card>
    </div>
  );
}
