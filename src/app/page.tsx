"use client";

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from "@/context/AuthContext";
import { useToast } from '@/hooks';
import { motion } from 'motion/react';

const LandingPage = dynamic(() => import('@/components/home/LandingPage'));
const DashboardHome = dynamic(() => import('@/components/dashboard/DashboardHome'), {
  loading: () => (
    <div className="flex-grow flex items-center justify-center min-h-[60vh]">
      <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
    </div>
  ),
});

function HomeContent() {
  const { isLoggedIn, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, ToastContainer } = useToast();
  
  useEffect(() => {
    const loginStatus = searchParams.get('login');
    const logoutStatus = searchParams.get('logout');
    
    if (loginStatus === 'success') {
      success("Welcome back.");
      // Clear param without reload
      router.replace('/');
    } else if (logoutStatus === 'success') {
      success("Your path remains, even in departure.");
      router.replace('/');
    }
  }, [searchParams, success, router]);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
      </div>
    );
  }

  return (
    <main className="flex-grow">
       {ToastContainer}
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ duration: 0.5 }}
       >
         {isLoggedIn ? <DashboardHome /> : <LandingPage />}
       </motion.div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
