"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqs } from "@/data/faqs";

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-6 sm:py-8 md:py-10 lg:py-12 relative" id="faq">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-5 sm:mb-7 md:mb-9 lg:mb-10">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-headline mb-2 sm:mb-2.5 md:mb-3 text-foreground/90">
                        Questions About Jyotish
                    </h2>
                    <p className="text-sm sm:text-base text-foreground/60 font-sans">
                        Understanding the science behind your stars.
                    </p>
                </div>

                <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                    {faqs.map((faq, idx) => (
                        <div 
                            key={idx} 
                            className="border border-[var(--border)] rounded-xl sm:rounded-xl md:rounded-2xl bg-background/40 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/30"
                        >
                            <button
                                onClick={() => toggleFAQ(idx)}
                                className="w-full flex justify-between items-center p-3.5 sm:p-4 md:p-5 lg:p-6 text-left focus:outline-none gap-2.5 sm:gap-3"
                            >
                                <span className="font-headline font-semibold text-sm sm:text-base md:text-lg text-foreground/80">
                                    {faq.question}
                                </span>
                                <ChevronDown 
                                    className={`w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex-shrink-0 ${openIndex === idx ? 'rotate-180' : ''}`}
                                />
                            </button>
                            
                            <div 
                                className={`transition-all duration-500 overflow-hidden ${openIndex === idx ? 'max-h-[500px] opacity-100 mb-2.5 sm:mb-3 md:mb-4' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="px-3.5 sm:px-4 md:px-5 lg:px-6 pb-3.5 sm:pb-4 md:pb-5 lg:pb-6 text-foreground/75 font-sans leading-relaxed text-xs sm:text-sm md:text-base pt-3 sm:pt-4 md:pt-5 lg:pt-6 mt-1 sm:mt-1.5 md:mt-2 mx-3.5 sm:mx-4 md:mx-5 lg:mx-6">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
