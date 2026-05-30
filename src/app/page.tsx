import { auth } from "@/lib/auth";
import LandingPage from '@/components/home/LandingPage';
import GptDashboardHome from '@/components/dashboard/GptDashboardHome';
import HomeToaster from '@/components/home/HomeToaster';

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex-grow">
      <HomeToaster />
      {session?.user && !session?.user?.error ? <GptDashboardHome /> : <LandingPage />}
    </main>
  );
}
