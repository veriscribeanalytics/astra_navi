'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useTranslation } from '@/hooks';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-20 flex flex-col relative z-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 scale-content">
      {/* Title Header */}
      <section className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-secondary uppercase bg-secondary/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full inline-block">
          {t('terms.title') || 'Terms & Conditions'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-headline font-bold text-primary leading-tight">
          {t('terms.title') || 'Terms & Conditions'}
        </h1>
        <p className="text-xs sm:text-sm text-primary/50">
          {t('terms.lastUpdated') || 'Last updated'}: June 1, 2026
        </p>
      </section>

      {/* Main Legal Content */}
      <Card variant="bordered" padding="lg" className="border-outline-variant/30 text-left space-y-8 bg-surface/50 backdrop-blur-sm">
        
        {/* Intro */}
        <div className="space-y-3">
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Welcome to Astra Navi, operated by <strong>[LEGAL_ENTITY_NAME]</strong> ("we", "us", or "our"). These Terms & Conditions govern your access to and use of our website, mobile application, AI chat services, and premium astrological offerings (collectively, the "Service").
          </p>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            By registering for an account or using any part of the Service, you represent that you are at least 18 years of age and agree to be bound by these Terms. If you do not agree to these terms, please do not use the Service.
          </p>
        </div>

        <hr className="border-outline-variant/20" />

        {/* 1. Astrological Disclaimer */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">1. Astrological Guidance Disclaimer (Important)</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            Astra Navi provides astrological computations, AI-driven cosmic consulting, daily horoscopes, and divisional readings based on historical Vedic principles. By using this service, you acknowledge and agree that:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li>Astrological readings, guidance, and AI chat consultation are intended solely for <strong>entertainment, guidance, and self-reflection purposes</strong>.</li>
            <li>No astrological insight or response from our AI guides constitutes, or should be relied upon as, formal medical, mental health, legal, tax, financial, or investment advice.</li>
            <li>You are solely responsible for any decisions or actions you choose to take based on the readings or guidance provided by our guides or computed charts.</li>
          </ul>
        </div>

        {/* 2. Account Registration & Age Limit */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">2. Account Responsibilities & Age Limit</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            To unlock the full features of Astra Navi, you must create a secure user account. You agree to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li>Be at least <strong>18 years of age</strong>. We enforce an age validation filter during signup in compliance with privacy regulations.</li>
            <li>Provide accurate, current, and complete details, including birth date, time, and coordinates.</li>
            <li>Maintain the confidentiality of your account password and restrict unauthorized access.</li>
          </ul>
        </div>

        {/* 3. Subscriptions & Payments */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">3. Subscription, Payments, and Refund Policy</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            We offer free features (such as introductory chat limits and daily horoscopes) as well as premium tier packages (unlimited charts, deep calculations, extended AI consulting):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li><strong>Billing:</strong> Premium features are billed in advance on a recurring subscription basis or one-time payment structure.</li>
            <li><strong>Pricing:</strong> We reserve the right to modify pricing tiers and features with advance notification.</li>
            <li><strong>Refunds:</strong> Payments are non-refundable except where required by local consumer regulations or as defined specifically in our pricing package agreements.</li>
          </ul>
        </div>

        {/* 4. Prohibited Uses */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">4. Prohibited Conduct</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            You agree not to misuse the platform. Misuse includes, but is not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-primary/70">
            <li>Using automated scripts, bots, or scraping tools to harvest database details or charts.</li>
            <li>Using the AI astrologer chat to generate hateful, abusive, illegal, or harassing messages.</li>
            <li>Interfering with or disrupting the integrity, performance, or security of our services.</li>
          </ul>
        </div>

        {/* 5. Limitation of Liability */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">5. Limitation of Liability</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed text-primary/80">
            To the maximum extent permitted by applicable law, <strong>[LEGAL_ENTITY_NAME]</strong> and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, arising out of your access to or use of, or inability to access or use, the Service. Our total cumulative liability shall not exceed the amount paid by you to us in the preceding six months.
          </p>
        </div>

        {/* 6. Governing Law & Jurisdiction */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">6. Governing Law & Dispute Resolution</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            These Terms & Conditions and any disputes arising out of them shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any legal action or proceeding arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in <strong>[JURISDICTION]</strong>.
          </p>
        </div>

        {/* 7. Changes to Terms */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">7. Modifications to Terms</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </div>

        {/* 8. Contact Information */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary">8. Contact Us</h2>
          <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
            If you have any questions or require clarification regarding these Terms & Conditions, please contact us at:
          </p>
          <div className="bg-background/40 p-4 border border-outline-variant/20 rounded-xl space-y-1.5 text-xs sm:text-sm text-primary/80">
            <p><strong>Entity:</strong> [LEGAL_ENTITY_NAME]</p>
            <p><strong>Email:</strong> <a href="mailto:[CONTACT_EMAIL]" className="text-secondary hover:underline font-bold">[CONTACT_EMAIL]</a></p>
          </div>
        </div>

      </Card>
    </div>
  );
}
