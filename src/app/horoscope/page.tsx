'use client';

import { useAuth } from '@/context/AuthContext';
import DailyHoroscopeCard from '@/components/dashboard/DailyHoroscopeCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Sparkles, ArrowLeft, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HoroscopePage() {
    const { user, isLoggedIn } = useAuth();
    const router = useRouter();

    // Not logged in
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-20">
                <Card padding="lg" className="!rounded-[32px] max-w-md w-full text-center border-outline-variant/30">
                    <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6 border border-secondary/20">
                        <Lock className="w-10 h-10 text-secondary" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-headline font-bold text-foreground mb-4">
                        Login Required
                    </h2>
                    <p className="text-sm sm:text-base text-foreground/60 mb-6 leading-relaxed">
                        Please login to access your personalized daily horoscope based on your birth chart.
                    </p>
                    <Button 
                        href="/login"
                        className="w-full px-8 py-4 rounded-xl gold-gradient text-white font-bold border-none hover:scale-105 transition-all"
                    >
                        Login to Continue ✦
                    </Button>
                </Card>
            </div>
        );
    }

    // Logged in but no moon sign
    if (!user?.moonSign) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-20">
                <Card padding="lg" className="!rounded-[32px] max-w-md w-full text-center border-outline-variant/30">
                    <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                        <Sparkles className="w-10 h-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-headline font-bold text-foreground mb-4">
                        Complete Your Profile
                    </h2>
                    <p className="text-sm sm:text-base text-foreground/60 mb-6 leading-relaxed">
                        To receive personalized horoscope predictions, please complete your birth details in your profile.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button 
                            href="/profile"
                            className="w-full px-8 py-4 rounded-xl gold-gradient text-white font-bold border-none hover:scale-105 transition-all"
                        >
                            Complete Profile ✦
                        </Button>
                        <Button 
                            onClick={() => router.back()}
                            variant="secondary"
                            className="w-full px-8 py-4 rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Logged in with moon sign - show horoscope
    return (
        <div className="min-h-screen bg-[var(--bg)] py-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 sm:mb-12">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-foreground/60 hover:text-secondary transition-colors mb-6 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
                            <Sparkles className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold text-foreground leading-tight">
                                Your Personalized Horoscope
                            </h1>
                            <p className="text-sm sm:text-base text-foreground/60 mt-1">
                                Based on your complete birth chart
                            </p>
                        </div>
                    </div>
                </div>

                {/* Horoscope Card */}
                <DailyHoroscopeCard email={user.email!} />

                {/* Info Footer */}
                <Card padding="md" className="!rounded-[24px] mt-8 border-outline-variant/30 bg-surface/50">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground mb-2">About Your Horoscope</h3>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Your personalized horoscope is calculated based on your moon sign ({user.moonSign}) and updated daily. 
                                For the most accurate predictions, ensure your birth details are complete in your profile.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
