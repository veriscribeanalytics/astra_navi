import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { ALL_FONT_VARIABLES } from "@/lib/fonts";
import Navbar from "@/components/layout/Navbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import AskNaviFab from "@/components/layout/AskNaviFab";
import OptimizedBackgrounds from "@/components/ui/OptimizedBackgrounds";
import SkipLink from "@/components/layout/SkipLink";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import OnboardingGate from "@/components/auth/OnboardingGate";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { PaywallProvider } from "@/context/PaywallContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/hooks/useToast";
import AsyncStylesheet from "@/components/ui/AsyncStylesheet";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import CookieConsentBanner from "@/components/privacy/CookieConsentBanner";

export const metadata: Metadata = {
  title: "AstraNavi | Vedic AI Astrology",
  description: "Bridging ancient Vedic wisdom with modern AI precision.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const theme = themeCookie === "dark" ? "dark" : "light";
  // Read language cookie so server renders in the user's preferred language,
  // eliminating hydration mismatches between SSR and client.
  const languageCookie = cookieStore.get("NEXT_LOCALE")?.value || "en";
  // Resolve the session on the server so SessionProvider hydrates with the
  // authenticated state already known — no client-side round-trip, no
  // logged-out flash on refresh.
  const session = await auth();

  return (
    <html
      lang={languageCookie}
      className={`${ALL_FONT_VARIABLES} h-full antialiased ${theme}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <AsyncStylesheet href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body
        className="bg-background selection:bg-secondary selection:text-white overflow-x-hidden celestial-silk min-h-screen flex flex-col relative"
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <SessionProvider session={session} refetchInterval={5 * 60}>
            <LanguageProvider initialLanguage={languageCookie}>
              <AuthProvider>
                <NotificationProvider>
                <ChatProvider>
                  <PaywallProvider>
                  <ThemeProvider>
                    <CookieConsentProvider>
                      <SkipLink />

                      <Suspense fallback={null}>
                        <OnboardingGate />
                      </Suspense>

                      <OptimizedBackgrounds />
                      <Toaster />

                      <Navbar />
                      <main id="main-content" className="flex-grow relative z-10 dark:bg-transparent pt-[var(--navbar-height,64px)]">
                        {children}
                      </main>
                      <ConditionalFooter />
                      <AskNaviFab />
                      <CookieConsentBanner />
                    </CookieConsentProvider>
                  </ThemeProvider>
                  </PaywallProvider>
                </ChatProvider>
                </NotificationProvider>
              </AuthProvider>
            </LanguageProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
