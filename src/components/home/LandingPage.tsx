import Hero from "./Hero";
import Services from "./Services";
import LiveAstrologers from "./LiveAstrologers";
import Pricing from "./Pricing";
import ZodiacStrip from "./ZodiacStrip";
import HowItWorks from "./HowItWorks";
import FAQSection from "./FAQSection";
import CTABanner from "./CTABanner";
import TrustSection from "./TrustSection";
import HoroscopeTeaser from "./HoroscopeTeaser";

const LandingPage = () => {
    return (
        <div className="flex flex-col w-full overflow-x-hidden bg-transparent">
            {/* HERO SECTION */}
            <div className="relative">
                <Hero />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-secondary/15 to-transparent" />
            </div>
            
            {/* ZODIAC STRIP */}
            <div className="relative z-20 -mt-8">
                <ZodiacStrip />
            </div>
            
            {/* HOW IT WORKS */}
            <div className="bg-transparent">
                <HowItWorks />
            </div>
            
            {/* DAILY HOROSCOPE FEATURE */}
            <div className="py-6 sm:py-10 md:py-12">
                <HoroscopeTeaser />
            </div>
            
            {/* SERVICES */}
            <div className="bg-transparent relative">
                <div className="absolute inset-0 bg-celestial-silk opacity-10 pointer-events-none" />
                <Services />
            </div>
            
            {/* LIVE ASTROLOGERS */}
            <div className="bg-transparent">
                <LiveAstrologers />
            </div>
            
            {/* PRICING */}
            <div className="bg-transparent">
                <Pricing />
            </div>
            
            {/* TRUST & FAQ */}
            <div className="bg-transparent relative z-10">
                <TrustSection />
                <FAQSection />
            </div>
            
            {/* CTA BANNER */}
            <div className="bg-transparent">
                <CTABanner />
            </div>
        </div>
    );
}
export default LandingPage;
