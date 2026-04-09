'use client';

import { useRouter } from 'next/navigation';
import Button from './ui/Button';
import { Construction, ArrowLeft, Sparkles } from 'lucide-react';

interface WorkInProgressProps {
    title?: string;
    description?: string;
}

export default function WorkInProgress({ 
    title = "Work in Progress", 
    description = "This feature is currently under development. We're working hard to bring you an amazing experience!" 
}: WorkInProgressProps) {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-2xl w-full text-center">
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-secondary/20 blur-3xl rounded-full"></div>
                    <Construction className="w-24 h-24 text-secondary relative z-10 mx-auto animate-pulse" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-4 tracking-tight">
                    {title}
                </h1>

                <p className="text-lg text-foreground/60 mb-8 max-w-xl mx-auto leading-relaxed">
                    {description}
                </p>

                <div className="flex items-center justify-center gap-3 text-sm text-secondary/70 mb-12">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">Coming Soon</span>
                    <Sparkles className="w-4 h-4" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => router.back()}
                        variant="secondary"
                        size="lg"
                        className="inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </Button>
                    <Button
                        href="/"
                        size="lg"
                        className="gold-gradient"
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
