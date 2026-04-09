import Hero from "./Hero";
import Services from "./Services";
import LiveAstrologers from "./LiveAstrologers";
import Pricing from "./Pricing";
import ZodiacStrip from "./ZodiacStrip";
import HowItWorks from "./HowItWorks";
import FAQSection from "./FAQSection";
import CTABanner from "./CTABanner";
import TrustSection from "./TrustSection";

const LandingPage = () => {
    return (
        <div className="flex flex-col w-full overflow-hidden">
            <div className="py-3 sm:py-4 md:py-5 lg:py-6 bg-transparent">
                <Hero />
            </div>
            
            <div className="py-1 sm:py-1.5 md:py-2">
                <ZodiacStrip />
            </div>
            
            <div className="py-6 sm:py-10 md:py-14 lg:py-16 bg-transparent dark:bg-transparent">
                <HowItWorks />
            </div>
            
            <div className="py-6 sm:py-10 md:py-14 lg:py-16">
                <Services />
            </div>
            
            <div className="py-6 sm:py-10 md:py-14 lg:py-16 bg-transparent dark:bg-transparent">
                <LiveAstrologers />
            </div>
            
            <div className="py-6 sm:py-10 md:py-14 lg:py-16">
                <Pricing />
            </div>
            
            <TrustSection />
            
            <div className="py-5 sm:py-6 md:py-7 lg:py-8 bg-transparent dark:bg-transparent">
                <FAQSection />
            </div>
            
            <div className="py-6 sm:py-10 md:py-14 lg:py-16">
                <CTABanner />
            </div>
        </div>
    );
}
export default LandingPage;
