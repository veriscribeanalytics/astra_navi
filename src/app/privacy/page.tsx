'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useTranslation } from '@/hooks';
import Link from 'next/link';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-20 flex flex-col relative z-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 scale-content">
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
            Welcome to Astra Navi. Your privacy is of paramount importance to us. This Privacy Policy explains how <strong>Veriscribe Analytics & AI Pvt. Ltd.</strong> ("we", "us", or "our") collects, uses, discloses, and safeguards your personal data when you use our services, in strict compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India and other global standards.
          </p>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Please read this policy carefully. By registering for or using Astra Navi, you provide your explicit, unambiguous, and revocable consent to the collection and processing of your personal data as described herein.
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
            Under India's DPDP Act 2023, the sole legal basis for processing your personal data is your <strong>freely given, specific, informed, unconditional, and unambiguous consent</strong>. You confirm this consent by checking our consent box during signup.
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

        {/* 5. Right to Erasure & Other Rights */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">5. Your Legal Rights (Data Principal Rights)</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Under data protection regulations, you hold the following rights:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li><strong>Right to Access & Summary:</strong> Access details of the personal data we hold about you.</li>
            <li><strong>Right to Correction & Update:</strong> Modify your personal profile or astrological configurations.</li>
            <li><strong>Right to Erasure (Right to be Forgotten):</strong> You have the right to have all your personal data deleted from our systems. You can trigger this instantly by navigating to your <Link href="/profile/security" className="text-secondary hover:underline font-bold">Profile Security (Danger Zone)</Link> and selecting "Delete Account".</li>
          </ul>
        </div>

        {/* 6. Children's Data */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">6. Children's Data (18+ Age Restriction)</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            In compliance with DPDP rules governing children's data, Astra Navi does not offer services to, or knowingly collect personal data from, individuals under the age of 18. An age validation gate is active during registration. If we learn we have collected data from a child under 18 without parental consent, we will delete it immediately.
          </p>
        </div>

        {/* 7. Data Retention */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">7. Data Retention Period</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            We retain your personal data only as long as necessary to fulfill the services you signed up for. Once you delete your account or withdraw consent, your personal data is completely erased or irreversibly anonymized from our database within <strong>30 days</strong>, subject to statutory backups or legal compliance.
          </p>
        </div>

        {/* 8. Grievance Redressal */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">8. Grievance Redressal & Contact</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            If you have any questions, concerns, or grievances regarding this Privacy Policy or your personal data processing, you may reach out to our designated Grievance Officer:
          </p>
          <div className="bg-background/40 p-4 border border-outline-variant/20 rounded-xl space-y-1.5 text-xs sm:text-sm text-primary/80">
            <p><strong>Grievance Officer:</strong> Munna Bhai MBBS</p>
            <p><strong>Address/Jurisdiction:</strong> Gurugram, Haryana, India</p>
            <p><strong>Email:</strong> <a href="mailto:contact@veriscribeanalytics.com" className="text-secondary hover:underline font-bold">contact@veriscribeanalytics.com</a></p>
          </div>
        </div>

      </Card>
    </div>
  );
}
