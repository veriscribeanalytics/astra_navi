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
                        Bridging ancient Vedic wisdom with modern precision to illuminate your life's path.
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
                        <li><Link className="hover:text-secondary transition-colors" href="/chat">Chat with Astrologer</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/horoscope">Daily Horoscope</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/kundli">Kundli Matching</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/shop">E-Commerce Shop</Link></li>
                    </ul>
                </div>
                
                <div>
                    <h5 className="font-bold text-primary mb-3 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-xs">Company Info</h5>
                    <ul className="space-y-2.5 sm:space-y-4 font-body text-xs sm:text-sm text-primary/60 font-medium">
                        <li><Link className="hover:text-secondary transition-colors" href="/about">About Us</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/astrologers">Our Astrologers</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/careers">Careers</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/support">Contact Support</Link></li>
                    </ul>
                </div>
                
                <div className="col-span-2 sm:col-span-2 md:col-span-1">
                    <h5 className="font-bold text-primary mb-3 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-xs">Stay Connected</h5>
                    <p className="text-xs sm:text-sm text-primary/60 font-medium mb-3 sm:mb-4">Get cosmic updates in your inbox.</p>
                    <div className="mt-3 sm:mt-6 relative flex items-center">
                        <Input 
                            placeholder="Email address" 
                            type="email"
                            className="!py-3 sm:!py-4 !rounded-xl !pr-14 sm:!pr-16 border-secondary/20" 
                        />
                        <button className="bg-primary flex items-center justify-center text-white h-8 w-8 sm:h-10 sm:w-10 rounded-lg hover:bg-secondary transition-all hover:scale-105 shrink-0 absolute right-1.5 shadow-md">
                            <span className="material-symbols-outlined text-sm sm:text-md font-bold">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-10 sm:mt-20 pt-6 sm:pt-8 border-t border-secondary/5 text-center">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-body font-bold text-primary/40">
                    © {new Date().getFullYear()} Astra Navi. The Celestial Cartographer.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
