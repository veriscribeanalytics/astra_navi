import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LandingPage from '@/components/home/LandingPage';
import DashboardHome from '@/components/dashboard/DashboardHome';
import HomeToaster from '@/components/home/HomeToaster';

export default async function Home() {
  const session = await auth();

  // Server-side onboarding gate.
  //
  // OAuth sign-ups (Google) cannot collect birth details during the handshake,
  // so the backend flags the freshly-created account profileComplete:false.
  // Such a user has no astrology data, and the dashboard depends on it — render
  // it and we get a flash followed by a thrown render (the global error page,
  // "Something shifted in the cosmos"). Redirect them straight to onboarding
  // BEFORE rendering, so they never see (or crash on) a half-built dashboard.
  //
  // This flag is ONLY present for OAuth sessions; credentials/OTP sessions
  // leave it undefined, so they fall through untouched. After onboarding,
  // ProfileClient calls session.update({profileComplete:true}) which refreshes
  // the JWT, so a completed user is no longer redirected here (no loop).
  if (session?.user && !session.user.error && session.user.profileComplete === false) {
    redirect('/profile?onboarding=true&return=/');
  }

  return (
    <main className="flex-grow">
      <HomeToaster />
      {session?.user && !session?.user?.error ? <DashboardHome /> : <LandingPage />}
    </main>
  );
}
