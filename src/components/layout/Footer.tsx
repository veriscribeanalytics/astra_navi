import React from 'react';
import Link from 'next/link';
import { Globe, Share2, ArrowRight } from 'lucide-react';
import Input from '../ui/Input';

const Footer = () => {
    return (
        <footer className="w-full pt-8 sm:pt-14 pb-6 sm:pb-8 px-4 sm:px-8 lg:px-12 bg-background border-t border-secondary/10 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 w-full max-w-7xl mx-auto">
                <div className="col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
                    <div className="font-headline text-xl sm:text-2xl text-primary font-bold">Astra Navi</div>
                    <p className="text-xs text-primary/60 font-medium leading-relaxed max-w-[240px]">
                        Preserving the mathematical precision of Jyotish Shastra for the modern seeker.
                    </p>
                    <div className="flex space-x-3">
                        <a className="w-10 h-10 rounded-full border-2 border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/10 hover:border-secondary/40 transition-all" href="#" title="Globe Link">
                            <Globe className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </a>
                        <a className="w-10 h-10 rounded-full border-2 border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/10 hover:border-secondary/40 transition-all" href="#" title="Share Link">
                            <Share2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </a>
                    </div>
                </div>
                
                <div>
                    <h5 className="font-bold text-primary mb-3 sm:mb-5 uppercase tracking-widest text-[10px] sm:text-xs">Services</h5>
                    <ul className="space-y-2 sm:space-y-3 font-body text-xs sm:text-sm text-primary/60 font-medium">
                        <li><Link className="hover:text-secondary transition-colors" href="/chat">Consult Navi</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/rashis">Rashi Predictions</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/kundli">Birth Chart Analysis</Link></li>
                        <li className="relative group/tool cursor-not-allowed opacity-[0.35]">
                            <span>Sacred Items</span>
                            <span className="absolute left-0 -bottom-4 text-[10px] text-secondary whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity">Coming soon</span>
                        </li>
                    </ul>
                </div>
                
                <div>
                    <h5 className="font-bold text-primary mb-3 sm:mb-5 uppercase tracking-widest text-[10px] sm:text-xs">Company Info</h5>
                    <ul className="space-y-2 sm:space-y-3 font-body text-xs sm:text-sm text-primary/60 font-medium">
                        <li><Link className="hover:text-secondary transition-colors" href="/about">About Us</Link></li>
                        <li className="relative group/tool cursor-not-allowed opacity-[0.35]">
                            <span>Our Astrologers</span>
                            <span className="absolute left-0 -bottom-4 text-[10px] text-secondary whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity">Coming soon</span>
                        </li>
                        <li className="relative group/tool cursor-not-allowed opacity-[0.35]">
                            <span>Careers</span>
                            <span className="absolute left-0 -bottom-4 text-[10px] text-secondary whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity">Coming soon</span>
                        </li>
                        <li className="relative group/tool cursor-not-allowed opacity-[0.35]">
                            <span>Contact Support</span>
                            <span className="absolute left-0 -bottom-4 text-[10px] text-secondary whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity">Coming soon</span>
                        </li>
                    </ul>
                </div>
                
                <div className="col-span-2 md:col-span-1">
                    <h5 className="font-bold text-primary mb-3 sm:mb-5 uppercase tracking-widest text-[10px] sm:text-xs">Stay Connected</h5>
                    <p className="text-xs sm:text-sm text-primary/60 font-medium mb-3 sm:mb-4">Receive planetary insights in your inbox.</p>
                    <div className="mt-3 sm:mt-5 relative flex items-center group opacity-50 cursor-not-allowed" title="Coming Soon">
                        <Input 
                            placeholder="your@cosmos.com" 
                            type="email"
                            disabled
                            className="!py-3 !rounded-xl !pr-14 sm:!pr-16 border-secondary/20 !bg-surface cursor-not-allowed" 
                        />
                        <button disabled className="gold-gradient flex items-center justify-center text-white h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0 absolute right-1.5 cursor-not-allowed">
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 font-bold" />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 sm:mt-12 pt-6 border-t border-secondary/5 text-center">
                <p 
                    className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-body font-bold"
                    style={{ color: 'rgba(212, 160, 23, 0.5)' }}
                >
                    © {new Date().getFullYear()} Astra Navi. Jyotish for the Modern Age.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
