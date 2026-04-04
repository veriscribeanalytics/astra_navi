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
        <section className="py-8 sm:py-12 relative" id="faq">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-6 sm:mb-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline mb-2 sm:mb-3 text-foreground/90">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-sm sm:text-base text-foreground/60 font-sans">
                        Unlocking the secrets of the cosmos and the Navi AI.
                    </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {faqs.map((faq, idx) => (
                        <div 
                            key={idx} 
                            className="border border-[var(--border)] rounded-xl sm:rounded-2xl bg-background/40 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/30"
                        >
                            <button
                                onClick={() => toggleFAQ(idx)}
                                className="w-full flex justify-between items-center p-4 sm:p-6 text-left focus:outline-none gap-3"
                            >
                                <span className="font-headline font-semibold text-base sm:text-lg text-foreground/80">
                                    {faq.question}
                                </span>
                                <ChevronDown 
                                    className={`w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex-shrink-0 ${openIndex === idx ? 'rotate-180' : ''}`}
                                />
                            </button>
                            
                            <div 
                                className={`transition-all duration-500 overflow-hidden ${openIndex === idx ? 'max-h-[500px] opacity-100 mb-3 sm:mb-4' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-foreground/75 font-sans leading-relaxed text-sm sm:text-base border-t border-[var(--border)]/30 pt-4 sm:pt-6 mt-1 sm:mt-2 mx-4 sm:mx-6">
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
