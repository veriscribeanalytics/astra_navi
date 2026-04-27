import type { Metadata } from "next";
import "./globals.css";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import OptimizedBackgrounds from "@/components/ui/OptimizedBackgrounds";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
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
                <ThemeProvider>
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
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
