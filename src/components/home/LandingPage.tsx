import { motion } from 'motion/react';
import Hero from "./Hero";
import Services from "./Services";
import LiveAstrologers from "./LiveAstrologers";
import Pricing from "./Pricing";
import ZodiacStrip from "./ZodiacStrip";
import HowItWorks from "./HowItWorks";
import FAQSection from "./FAQSection";
import TrustSection from "./TrustSection";
import HoroscopeTeaser from "./HoroscopeTeaser";

const LandingPage = () => {
    const sectionVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" as const }
        }
    };

    return (
        <div className="flex flex-col w-full bg-transparent">
            {/* HERO SECTION */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="relative"
            >
                <Hero />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-secondary/15 to-transparent" />
            </motion.div>
            
            {/* ZODIAC STRIP */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="relative z-20 -mt-8"
            >
                <ZodiacStrip />
            </motion.div>
            
            {/* HOW IT WORKS */}
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={sectionVariants}
                className="bg-transparent"
            >
                <HowItWorks />
            </motion.div>
            
            {/* DAILY HOROSCOPE FEATURE */}
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={sectionVariants}
                className="py-4 sm:py-6 md:py-8"
            >
                <HoroscopeTeaser />
            </motion.div>
            
            {/* SERVICES */}
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={sectionVariants}
                className="bg-transparent relative"
            >
                <div className="absolute inset-0 bg-celestial-silk opacity-10 pointer-events-none" />
                <Services />
            </motion.div>
            
            {/* LIVE ASTROLOGERS */}
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={sectionVariants}
                className="bg-transparent"
            >
                <LiveAstrologers />
            </motion.div>
            
            {/* PRICING */}
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={sectionVariants}
                className="bg-transparent"
            >
                <Pricing />
            </motion.div>
            
            {/* TRUST & FAQ */}
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={sectionVariants}
                className="bg-transparent relative z-10"
            >
                <TrustSection />
                <FAQSection />
            </motion.div>
            
        </div>
    );
}

export default LandingPage;
