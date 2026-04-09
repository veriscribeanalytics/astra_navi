import React from 'react';
import Link from 'next/link';
import Input from '../ui/Input';

const Footer = () => {
    return (
        <footer className="w-full pt-10 sm:pt-20 pb-8 sm:pb-10 px-4 sm:px-8 lg:px-12 bg-background border-t border-secondary/10 relative z-20">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12 w-full max-w-7xl mx-auto">
                <div className="col-span-2 sm:col-span-2 md:col-span-1 space-y-4 sm:space-y-6">
                    <div className="font-headline text-xl sm:text-2xl text-primary font-bold">Astra Navi</div>
                    <p className="text-xs sm:text-sm text-primary/60 font-medium leading-relaxed">
                        Preserving the mathematical precision of Jyotish Shastra for the modern seeker.
                    </p>
                    <div className="flex space-x-3 sm:space-x-5">
                        <a className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/10 hover:border-secondary/40 transition-all shadow-sm" href="#" title="Globe Link">
                            <span className="material-symbols-outlined text-lg sm:text-xl">language</span>
                        </a>
                        <a className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/10 hover:border-secondary/40 transition-all shadow-sm" href="#" title="Share Link">
                            <span className="material-symbols-outlined text-lg sm:text-xl">share</span>
                        </a>
                    </div>
                </div>
                
                <div>
                    <h5 className="font-bold text-primary mb-3 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-xs">Services</h5>
                    <ul className="space-y-2.5 sm:space-y-4 font-body text-xs sm:text-sm text-primary/60 font-medium">
                        <li><Link className="hover:text-secondary transition-colors" href="/chat">Consult Navi</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/horoscope">Rashi Predictions</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/kundli">Birth Chart Analysis</Link></li>
                        <li><span className="text-primary/40 cursor-not-allowed" title="Coming Soon">Sacred Items</span></li>
                    </ul>
                </div>
                
                <div>
                    <h5 className="font-bold text-primary mb-3 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-xs">Company Info</h5>
                    <ul className="space-y-2.5 sm:space-y-4 font-body text-xs sm:text-sm text-primary/60 font-medium">
                        <li><Link className="hover:text-secondary transition-colors" href="/about">About Us</Link></li>
                        <li><span className="text-primary/40 cursor-not-allowed" title="Coming Soon">Our Astrologers</span></li>
                        <li><span className="text-primary/40 cursor-not-allowed" title="Coming Soon">Careers</span></li>
                        <li><span className="text-primary/40 cursor-not-allowed" title="Coming Soon">Contact Support</span></li>
                    </ul>
                </div>
                
                <div className="col-span-2 sm:col-span-2 md:col-span-1">
                    <h5 className="font-bold text-primary mb-3 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-xs">Stay Connected</h5>
                    <p className="text-xs sm:text-sm text-primary/60 font-medium mb-3 sm:mb-4">Receive planetary insights in your inbox.</p>
                    <div className="mt-3 sm:mt-6 relative flex items-center group opacity-50 cursor-not-allowed" title="Coming Soon">
                        <Input 
                            placeholder="Email address" 
                            type="email"
                            disabled
                            className="!py-3 sm:!py-4 !rounded-xl !pr-14 sm:!pr-16 border-secondary/20 !bg-surface/30 cursor-not-allowed" 
                        />
                        <button disabled className="gold-gradient flex items-center justify-center text-white h-9 w-9 sm:h-11 sm:w-11 rounded-xl shrink-0 absolute right-1.5 shadow-lg shadow-secondary/20 cursor-not-allowed">
                            <span className="material-symbols-outlined text-base sm:text-lg font-bold">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-10 sm:mt-20 pt-6 sm:pt-8 border-t border-secondary/5 text-center">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-body font-bold text-primary/40">
                    © {new Date().getFullYear()} Astra Navi. Jyotish for the Modern Age.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
