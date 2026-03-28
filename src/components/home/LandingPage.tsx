import Hero from "./Hero";
import Services from "./Services";
import LiveAstrologers from "./LiveAstrologers";
import Pricing from "./Pricing";
import ZodiacStrip from "./ZodiacStrip";
import HowItWorks from "./HowItWorks";
import FAQSection from "./FAQSection";
import CTABanner from "./CTABanner";

const LandingPage = () => {
    return (
        <div className="flex flex-col gap-16 md:gap-24 pb-20">
            <Hero />
            <ZodiacStrip />
            <HowItWorks />
            <Services />
            <LiveAstrologers />
            <Pricing/>
            <FAQSection />
            <CTABanner />
        </div>
    );
}
export default LandingPage;
