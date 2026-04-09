import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import Particles from "@/components/ui/Particles";
import SunFlares from "@/components/ui/SunFlares";
import RashiOrbitBackground from "@/components/ui/RashiOrbitBackground";
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
                // Default to light mode if no preference is set
                if (storageTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  // Default to light mode
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
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ErrorBoundary>
          <SessionProvider>
            <AuthProvider>
              <ChatProvider>
                <SunFlares />
                {/* Rashi Orbit Background - Subtle zodiac animation */}
                <RashiOrbitBackground />
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
                {/* Particle effect for Light Mode - Ivory style with soft warm tones */}
                <div className="fixed inset-0 z-[1] pointer-events-none block dark:hidden">
                  <Particles
                    particleColors={["#E6D8E0", "#d1b8c6", "#c8880a"]}
                    particleCount={120}
                    particleSpread={14}
                    speed={0.08}
                    particleBaseSize={100}
                    moveParticlesOnHover={true}
                    alphaParticles={true}
                    disableRotation={false}
                  />
                </div>
                <Navbar />
                <main id="main-content" className="flex-grow relative z-10 dark:bg-transparent">
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
