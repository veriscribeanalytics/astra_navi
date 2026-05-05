import type { Metadata } from "next";
import "./globals.css";
import { Playfair_Display, DM_Sans, Noto_Sans_Devanagari, Noto_Sans_Tamil, Noto_Sans_Telugu, Noto_Sans_Kannada, Noto_Sans_Bengali, Noto_Sans_Gujarati, Noto_Sans_Malayalam, Noto_Sans_Gurmukhi } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import OptimizedBackgrounds from "@/components/ui/OptimizedBackgrounds";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/hooks/useToast";

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

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["300", "400", "500", "700"],
});

const notoTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  weight: ["300", "400", "500", "700"],
});

const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  weight: ["300", "400", "500", "700"],
});

const notoKannada = Noto_Sans_Kannada({
  variable: "--font-noto-kannada",
  subsets: ["kannada"],
  weight: ["300", "400", "500", "700"],
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "700"],
});

const notoGujarati = Noto_Sans_Gujarati({
  variable: "--font-noto-gujarati",
  subsets: ["gujarati"],
  weight: ["300", "400", "500", "700"],
});

const notoMalayalam = Noto_Sans_Malayalam({
  variable: "--font-noto-malayalam",
  subsets: ["malayalam"],
  weight: ["300", "400", "500", "700"],
});

const notoGurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-noto-gurmukhi",
  subsets: ["gurmukhi"],
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
      className={`${playfair.variable} ${dmSans.variable} ${notoDevanagari.variable} ${notoTamil.variable} ${notoTelugu.variable} ${notoKannada.variable} ${notoBengali.variable} ${notoGujarati.variable} ${notoMalayalam.variable} ${notoGurmukhi.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Read and validate theme from localStorage
                  const storageTheme = localStorage.getItem('theme');
                  let theme = 'light'; // Default
                  
                  if (storageTheme === 'dark' || storageTheme === 'light') {
                    theme = storageTheme;
                  } else if (storageTheme) {
                    // Clear invalid value
                    localStorage.removeItem('theme');
                  }
                  
                  // Apply theme class immediately (synchronous, before body renders)
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  // Fallback if localStorage unavailable (private browsing, etc.)
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
          <SessionProvider>
            <LanguageProvider>
              <AuthProvider>
                <ChatProvider>
                  <ThemeProvider>
                    <a href="#main-content" className="skip-to-content">
                      Skip to main content
                    </a>
                    
                    {/* Optimized backgrounds with adaptive quality */}
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
