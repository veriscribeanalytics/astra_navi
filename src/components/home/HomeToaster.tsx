"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks';

function ToasterInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, ToastContainer } = useToast();
  
  useEffect(() => {
    const loginStatus = searchParams.get('login');
    const logoutStatus = searchParams.get('logout');
    
    if (loginStatus === 'success') {
      success("Welcome back.");
      router.replace('/');
      router.refresh();
    } else if (logoutStatus === 'success') {
      success("Your path remains, even in departure.");
      router.replace('/');
      router.refresh();
    }
  }, [searchParams, success, router]);

  return <>{ToastContainer}</>;
}

export default function HomeToaster() {
  return (
    <Suspense fallback={null}>
      <ToasterInner />
    </Suspense>
  );
}
