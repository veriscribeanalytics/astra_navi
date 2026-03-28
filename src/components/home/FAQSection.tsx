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
        <section className="py-24 relative" id="faq">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-foreground/90">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-foreground/60 font-sans">
                        Unlocking the secrets of the cosmos and the Navi AI.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div 
                            key={idx} 
                            className="border border-[var(--border)] rounded-2xl bg-background/40 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/30"
                        >
                            <button
                                onClick={() => toggleFAQ(idx)}
                                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                            >
                                <span className="font-headline font-semibold text-lg text-foreground/80">
                                    {faq.question}
                                </span>
                                <ChevronDown 
                                    className={`w-5 h-5 text-[#D4AF37] transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`}
                                />
                            </button>
                            
                            <div 
                                className={`transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-6 pt-0 text-foreground/60 font-sans leading-relaxed text-sm lg:text-base border-t border-[var(--border)]/50 mt-2">
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
