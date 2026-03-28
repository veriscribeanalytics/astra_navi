"use client";

import LandingPage from "@/components/home/LandingPage";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  
  if (isLoading) return null; // Prevent hydration flash

  return (
    <main className="pt-24 flex-grow">
       {isLoggedIn ? <DashboardHome /> : <LandingPage />}
    </main>
  );
}

