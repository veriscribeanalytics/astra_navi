'use client';

import * as React from 'react';
import { Suspense } from 'react';
import RashisClient from './RashisClient';

export default function RashisPage() {
    return (
        <Suspense fallback={
            <div className="flex-grow flex items-center justify-center min-h-[60vh]">
                <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
            </div>
        }>
            <RashisClient />
        </Suspense>
    );
}
