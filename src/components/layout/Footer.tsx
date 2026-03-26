import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="w-full pt-12 sm:pt-20 pb-10 px-4 sm:px-8 lg:px-12 bg-background border-t border-secondary/10 relative z-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 w-full max-w-7xl mx-auto">
                <div className="col-span-1 space-y-6">
                    <div className="font-headline text-2xl text-primary font-bold">Astra Navi</div>
                    <p className="text-sm text-primary/60 font-medium leading-relaxed">
                        Bridging ancient Vedic wisdom with modern precision to illuminate your life's path.
                    </p>
                    <div className="flex space-x-4">
                        <a className="w-10 h-10 rounded-full border border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors" href="#">
                            <span className="material-symbols-outlined text-lg">language</span>
                        </a>
                        <a className="w-10 h-10 rounded-full border border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors" href="#">
                            <span className="material-symbols-outlined text-lg">share</span>
                        </a>
                    </div>
                </div>
                
                <div>
                    <h5 className="font-bold text-primary mb-6 uppercase tracking-widest text-xs">Services</h5>
                    <ul className="space-y-4 font-body text-sm text-primary/60 font-medium">
                        <li><Link className="hover:text-secondary transition-colors" href="/chat">Chat with Astrologer</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/horoscope">Daily Horoscope</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/kundli">Kundli Matching</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/shop">E-Commerce Shop</Link></li>
                    </ul>
                </div>
                
                <div>
                    <h5 className="font-bold text-primary mb-6 uppercase tracking-widest text-xs">Company Info</h5>
                    <ul className="space-y-4 font-body text-sm text-primary/60 font-medium">
                        <li><Link className="hover:text-secondary transition-colors" href="/about">About Us</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/astrologers">Our Astrologers</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/careers">Careers</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/support">Contact Support</Link></li>
                    </ul>
                </div>
                
                <div>
                    <h5 className="font-bold text-primary mb-6 uppercase tracking-widest text-xs">Stay Connected</h5>
                    <p className="text-sm text-primary/60 font-medium mb-4">Get cosmic updates in your inbox.</p>
                    <div className="flex bg-white rounded-xl p-1 border border-secondary/10 shadow-sm">
                        <input className="bg-transparent border-none text-xs flex-1 focus:ring-0 text-primary font-medium" placeholder="Email address" type="email"/>
                        <button className="bg-primary flex items-center justify-center text-white h-8 w-8 rounded-lg hover:bg-secondary transition-colors">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-20 pt-8 border-t border-secondary/5 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] font-body font-bold text-primary/40">
                    © {new Date().getFullYear()} Astra Navi. The Celestial Cartographer.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
