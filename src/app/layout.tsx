import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ALL_FONT_VARIABLES } from "@/lib/fonts";
import Navbar from "@/components/layout/Navbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import OptimizedBackgrounds from "@/components/ui/OptimizedBackgrounds";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/hooks/useToast";
import AsyncStylesheet from "@/components/ui/AsyncStylesheet";

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
        className="bg-background selection:bg-secondary selection:text-white overflow-x-hidden celestial-silk min-h-full flex flex-col relative h-full"
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <SessionProvider refetchInterval={5 * 60}>
            <LanguageProvider initialLanguage={languageCookie}>
              <AuthProvider>
                <ChatProvider>
                  <ThemeProvider>
                    <a href="#main-content" className="skip-to-content">
                      Skip to main content
                    </a>
                    
                    <OptimizedBackgrounds />
                    <Toaster />

                    <Navbar />
                    <main id="main-content" className="flex-grow relative z-10 dark:bg-transparent pt-[var(--navbar-height,64px)]">
                      {children}
                    </main>
                    <ConditionalFooter />
                  </ThemeProvider>
                </ChatProvider>
              </AuthProvider>
            </LanguageProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
