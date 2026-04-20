"use client";

import LandingPage from "@/components/home/LandingPage";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
      </div>
    );
  }

  return (
    <main className="flex-grow">
       {isLoggedIn ? <DashboardHome /> : <LandingPage />}
    </main>
  );
}

