import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import Particles from "@/components/ui/Particles";
import SunFlares from "@/components/ui/SunFlares";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "AstraNavi | Vedic AI Astrology",
  description: "Bridging ancient Vedic wisdom with modern AI precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const storageTheme = localStorage.getItem('theme');
                if (storageTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        className="bg-background selection:bg-secondary selection:text-white overflow-x-hidden celestial-silk min-h-full flex flex-col relative"
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <SessionProvider>
            <AuthProvider>
              <ChatProvider>
                <SunFlares />
                {/* Particle effect for Dark Mode - Reduced count for GPU balance */}
                <div className="fixed inset-0 z-[1] pointer-events-none hidden dark:block">
                  <Particles
                    particleColors={["#c8880a", "#f5a623", "#faf7f2"]}
                    particleCount={150}
                    particleSpread={12}
                    speed={0.15}
                    particleBaseSize={120}
                    moveParticlesOnHover={true}
                    alphaParticles={false}
                    disableRotation={false}
                  />
                </div>
                <Navbar />
                <main className="flex-grow relative z-10 dark:bg-transparent">
                  {children}
                </main>
                <ConditionalFooter />
              </ChatProvider>
            </AuthProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
