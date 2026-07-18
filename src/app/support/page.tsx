'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import {
    LifeBuoy,
    ChevronDown,
    Send,
    CheckCircle,
    AlertCircle,
    Mail,
    Shield,
    CreditCard,
    Users,
    Sparkles,
    UserCircle,
} from 'lucide-react';

/**
 * Support / Help Center
 *
 * The everyday help hub for AstraMitra users — distinct from the DPDP
 * grievance mechanism at /privacy/grievance (which handles legal data
 * complaints). This page provides:
 *   1. Quick contact details
 *   2. A categorized FAQ accordion
 *   3. A general support ticket form (proxied to the backend)
 *   4. Helpful links (privacy, grievance, plans)
 */

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const SUPPORT_EMAIL = 'contact@veriscribeanalytics.com';

const CATEGORIES = [
    'Account & Login',
    'Credits & Billing',
    'Kundli & Matching',
    'Family & Bonds',
    'Privacy & Data',
    'Something Else',
] as const;

interface FaqItem {
    q: string;
    a: React.ReactNode;
}

interface FaqGroup {
    id: string;
    label: string;
    icon: React.ElementType;
    items: FaqItem[];
}

const FAQ_GROUPS: FaqGroup[] = [
    {
        id: 'account',
        label: 'Account & Login',
        icon: UserCircle,
        items: [
            {
                q: 'How do I sign in?',
                a: 'You can sign in with Google, or with your email and password. We also support one-time password (OTP) login via email for quick, passwordless access.',
            },
            {
                q: "I can't log in — what should I do?",
                a: 'First, make sure you are using the same method you signed up with (Google vs. email). If you forgot your password, use the "Forgot password" link on the login screen. If you are still stuck, contact us using the form below and we will help restore access.',
            },
            {
                q: 'How do I update my birth details?',
                a: 'Your date, time, and place of birth power every chart and reading, so keep them accurate. You can edit them from your Profile. Note that changing birth details will regenerate your Kundli and related insights.',
            },
            {
                q: 'How do I delete my account?',
                a: (
                    <>
                        You can request account and data deletion at any time. Visit your{' '}
                        <Link href="/profile/privacy" className="text-secondary hover:underline font-semibold">
                            Privacy settings
                        </Link>{' '}
                        or submit a request through the form below. Deletion is handled in line with the DPDP Act, 2023.
                    </>
                ),
            },
        ],
    },
    {
        id: 'billing',
        label: 'Credits & Billing',
        icon: CreditCard,
        items: [
            {
                q: 'What are credits and how do they work?',
                a: 'Credits are used to unlock premium features such as detailed reports, AI astrologer conversations, and compatibility readings. Each action shows its credit cost before you confirm.',
            },
            {
                q: 'How do I buy credits or a plan?',
                a: (
                    <>
                        Head to the{' '}
                        <Link href="/plans" className="text-secondary hover:underline font-semibold">
                            Plans
                        </Link>{' '}
                        page to view available credit packs and subscription options. Payments are processed securely.
                    </>
                ),
            },
            {
                q: 'Can I get a refund?',
                a: 'Refund eligibility depends on whether the credits have been consumed. If you believe you were charged in error or have an unused purchase, contact us with your order details and we will review it.',
            },
            {
                q: 'Where can I see my credit history?',
                a: 'Your credit purchases and usage are listed in your account under billing / credit history, so you can track exactly where your credits went.',
            },
        ],
    },
    {
        id: 'kundli',
        label: 'Kundli & Matching',
        icon: Sparkles,
        items: [
            {
                q: 'Why do accurate birth details matter so much?',
                a: 'Vedic calculations rely on precise astronomical positions at your moment of birth. Even a small error in birth time or place can shift house placements and change your readings, so double-check them in your Profile.',
            },
            {
                q: 'How does horoscope matching (Kundli matching) work?',
                a: 'Matching compares two birth charts across traditional compatibility factors (such as Guna Milan) to produce a compatibility score and detailed breakdown. You can match with saved family members or enter details manually.',
            },
            {
                q: 'A prediction seems off — is that normal?',
                a: 'Astrological insights are guidance, not guarantees. If a reading looks clearly wrong, it is usually caused by incorrect birth details. Verify your data first; if it still looks incorrect, let us know so we can investigate.',
            },
        ],
    },
    {
        id: 'family',
        label: 'Family & Bonds',
        icon: Users,
        items: [
            {
                q: 'How do I add a family member?',
                a: 'From the Family section you can add members with their birth details, or invite existing users to connect. Once added, you can run compatibility and bond insights with them.',
            },
            {
                q: 'What is a connection vs. a member?',
                a: 'A member is a profile you create and manage (for example, a child or relative). A connection is another AstraMitra user you link with by invitation — you each keep control of your own account.',
            },
            {
                q: 'An invite or connection is not working.',
                a: 'Make sure the invited person accepted the request and that their birth details are complete. If a connection appears stuck, contact us with both usernames and we will look into it.',
            },
        ],
    },
    {
        id: 'privacy',
        label: 'Privacy & Data',
        icon: Shield,
        items: [
            {
                q: 'How is my personal and birth data protected?',
                a: (
                    <>
                        We handle your data in compliance with the DPDP Act, 2023. Read the full{' '}
                        <Link href="/privacy" className="text-secondary hover:underline font-semibold">
                            Privacy Policy
                        </Link>{' '}
                        for details on what we collect and why.
                    </>
                ),
            },
            {
                q: 'I have a formal privacy or data complaint.',
                a: (
                    <>
                        For formal data-protection grievances, please use our dedicated{' '}
                        <Link href="/privacy/grievance" className="text-secondary hover:underline font-semibold">
                            Grievance Redressal
                        </Link>{' '}
                        page, which routes directly to our Grievance Officer with a tracked response timeline.
                    </>
                ),
            },
            {
                q: 'How do I manage my consent or data preferences?',
                a: (
                    <>
                        You can review and update your consent choices anytime from your{' '}
                        <Link href="/profile/privacy" className="text-secondary hover:underline font-semibold">
                            Privacy settings
                        </Link>
                        .
                    </>
                ),
            },
        ],
    },
];

function FaqRow({ item }: { item: FaqItem }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-outline-variant/20 last:border-b-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-4 py-4 text-left group cursor-pointer"
                aria-expanded={open}
            >
                <span className="text-sm sm:text-base font-semibold text-primary group-hover:text-secondary transition-colors">
                    {item.q}
                </span>
                <ChevronDown
                    className={`w-4 h-4 shrink-0 text-secondary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm text-primary/70 leading-relaxed">{item.a}</p>
                </div>
            </div>
        </div>
    );
}

export default function SupportPage() {
    const [category, setCategory] = useState<string>(CATEGORIES[0]);
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
            const res = await fetch('/api/support/ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    subject: subject.trim(),
                    description: description.trim(),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Submission failed. Please try again.');
            }

            setStatus('success');
            setSubject('');
            setDescription('');
            setCategory(CATEGORIES[0]);
        } catch (err) {
            setStatus('error');
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
        }
    };

    return (
        <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-20 flex flex-col relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto space-y-8 scale-content">
            {/* Title Header */}
            <section className="text-center space-y-4 max-w-2xl mx-auto">
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-secondary uppercase bg-secondary/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full inline-flex items-center gap-1.5">
                    <LifeBuoy className="w-3.5 h-3.5" />
                    Help Center
                </span>
                <h1 className="text-3xl sm:text-5xl font-headline font-bold text-primary leading-tight">
                    How can we help?
                </h1>
                <p className="text-xs sm:text-sm text-primary/50">
                    Browse common questions below, or reach out and we&apos;ll get back to you.
                </p>
            </section>

            {/* Quick contact banner */}
            <Card
                variant="bordered"
                padding="lg"
                hoverable={false}
                className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-headline font-bold text-primary">
                                Email us directly
                            </h2>
                            <p className="text-xs sm:text-sm text-primary/60 leading-relaxed">
                                We typically respond within 48 hours on business days.
                            </p>
                        </div>
                    </div>
                    <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="auth-btn-gold px-5 py-2.5 !rounded-[18px] !text-xs inline-flex items-center gap-2 justify-center cursor-pointer whitespace-nowrap"
                    >
                        <Mail className="w-3.5 h-3.5" />
                        {SUPPORT_EMAIL}
                    </a>
                </div>
            </Card>

            {/* FAQ */}
            <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary px-1">
                    Frequently Asked Questions
                </h2>
                <div className="grid gap-6 lg:grid-cols-2">
                    {FAQ_GROUPS.map((group) => {
                        const Icon = group.icon;
                        return (
                            <Card
                                key={group.id}
                                variant="bordered"
                                padding="lg"
                                hoverable={false}
                                className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-2.5 mb-2 pb-3 border-b border-outline-variant/20">
                                    <Icon className="w-4 h-4 text-secondary" />
                                    <h3 className="text-sm sm:text-base font-headline font-bold text-primary">
                                        {group.label}
                                    </h3>
                                </div>
                                <div>
                                    {group.items.map((item, i) => (
                                        <FaqRow key={i} item={item} />
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Contact form */}
            <Card
                variant="bordered"
                padding="lg"
                hoverable={false}
                className="border-outline-variant/30 bg-surface/50 backdrop-blur-sm"
            >
                <h2 className="text-lg sm:text-xl font-headline font-bold text-secondary mb-1">
                    Still need help? Send us a message
                </h2>
                <p className="text-xs sm:text-sm text-primary/50 mb-5">
                    Fill out the form and our team will follow up by email.
                </p>

                {status === 'success' ? (
                    <div className="flex flex-col items-center text-center py-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-headline font-bold text-primary">Message Sent</h3>
                        <p className="text-sm text-primary/60 max-w-md leading-relaxed">
                            Thanks for reaching out! We&apos;ve received your message and will respond by email,
                            usually within <strong>48 hours</strong>.
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="auth-btn-gold px-5 py-2.5 !rounded-[18px] !text-xs cursor-pointer"
                        >
                            Send Another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Category */}
                        <div>
                            <label
                                htmlFor="support-category"
                                className="block text-xs sm:text-sm font-bold text-primary mb-2 uppercase tracking-wider"
                            >
                                Topic
                            </label>
                            <select
                                id="support-category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-[18px] bg-background/60 border border-outline-variant/30 text-sm text-primary focus:outline-none focus:border-secondary/50 focus:ring-2 focus:ring-secondary/10 transition-all cursor-pointer"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subject */}
                        <div>
                            <label
                                htmlFor="support-subject"
                                className="block text-xs sm:text-sm font-bold text-primary mb-2 uppercase tracking-wider"
                            >
                                Subject
                            </label>
                            <input
                                id="support-subject"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                                placeholder="e.g., Credits not showing after purchase"
                                className="w-full px-4 py-3 rounded-[18px] bg-background/60 border border-outline-variant/30 text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:border-secondary/50 focus:ring-2 focus:ring-secondary/10 transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="support-desc"
                                className="block text-xs sm:text-sm font-bold text-primary mb-2 uppercase tracking-wider"
                            >
                                Message
                            </label>
                            <textarea
                                id="support-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={6}
                                placeholder="Describe your issue or question. Include any relevant details like dates, order IDs, or screenshots you can reference."
                                className="w-full px-4 py-3 rounded-[18px] bg-background/60 border border-outline-variant/30 text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:border-secondary/50 focus:ring-2 focus:ring-secondary/10 transition-all resize-y min-h-[120px]"
                            />
                        </div>

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
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>
                )}
            </Card>

            {/* Helpful links */}
            <section className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                <Link href="/privacy" className="text-primary/50 hover:text-secondary transition-colors">
                    Privacy Policy
                </Link>
                <span className="text-primary/20">•</span>
                <Link href="/privacy/grievance" className="text-primary/50 hover:text-secondary transition-colors">
                    Grievance Redressal
                </Link>
                <span className="text-primary/20">•</span>
                <Link href="/plans" className="text-primary/50 hover:text-secondary transition-colors">
                    Plans & Pricing
                </Link>
            </section>
        </div>
    );
}
