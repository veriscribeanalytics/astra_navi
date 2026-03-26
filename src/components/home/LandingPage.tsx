import Hero from "./Hero";
import LiveAstrologers from "./LiveAstrologers";
import Pricing from "./Pricing";
import ZodiacStrip from "./ZodiacStrip";

const LandingPage = () => {
    return (
        <div className="flex flex-col gap-16 md:gap-24 pb-20">
            <Hero />
            <ZodiacStrip />
            <LiveAstrologers />
            <Pricing/>
            {/* Future home sections (Features, Testimonials, etc.) can be added here */}
        </div>
    );
}
export default LandingPage;
