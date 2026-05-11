import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ALL_FONT_VARIABLES} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <AsyncStylesheet href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storageTheme = localStorage.getItem('theme');
                  let theme = 'light';
                  if (storageTheme === 'dark' || storageTheme === 'light') {
                    theme = storageTheme;
                  } else if (storageTheme) {
                    localStorage.removeItem('theme');
                  }
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  console.warn('Theme initialization failed:', e);
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        className="bg-background selection:bg-secondary selection:text-white overflow-x-hidden celestial-silk min-h-full flex flex-col relative h-full"
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <SessionProvider refetchInterval={5 * 60}>
            <LanguageProvider>
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
