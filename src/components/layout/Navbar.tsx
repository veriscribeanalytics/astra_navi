'use client';

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Button from "../ui/Button";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { User, LogOut, Menu, X } from "lucide-react";

interface INavbarProps{}

const navItems = [
  { id: "home", label: "Home", href: "/" },
  { id: "about", label: "About", href: "/about" },
  { id: "chat", label: "Chat", href: "/chat" },
  { id: "plans", label: "Plans", href: "/plans" },
];

const Navbar: React.FunctionComponent<INavbarProps> = (props) => {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn, logout, showLoading, user } = useAuth();
    const { setIsMobileMenuOpen } = useChat();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const desktopDropdownRef = useRef<HTMLDivElement>(null);
    const mobileDropdownRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);

    const isChatPage = pathname?.startsWith('/chat');

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const setHeight = () => {
            document.documentElement.style.setProperty('--navbar-height', `${nav.offsetHeight}px`);
        };
        setHeight();
        const observer = new ResizeObserver(setHeight);
        observer.observe(nav);
        return () => observer.disconnect();
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isOutsideDesktop = !desktopDropdownRef.current || !desktopDropdownRef.current.contains(target);
            const isOutsideMobile = !mobileDropdownRef.current || !mobileDropdownRef.current.contains(target);
            
            if (isOutsideDesktop && isOutsideMobile) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        setIsDropdownOpen(false);
        setIsMenuOpen(false);
        showLoading("Returning to the stars...", 1500);
        setTimeout(() => {
            logout();
            router.push('/login');
        }, 1500);
    };
    
    const isActive = (path:string) => pathname == path;

    return(
        <nav ref={navRef} className="fixed top-0 w-full z-[210] bg-[#faf7f2]/85 dark:bg-[#0b071a]/90 backdrop-blur-xl shadow-sm border-b border-secondary/10 transition-colors duration-500">
            {/* ===== DESKTOP NAVBAR (md+) ===== */}
            <div className="hidden md:grid grid-cols-3 items-center px-4 sm:px-8 lg:px-12 py-3.5 w-full mx-auto max-w-[1600px]">
                {/* Left: Logo */}
                <div className="flex justify-start">
                    <Link href="/" className="flex shrink-0 items-center justify-center text-xl lg:text-2xl font-bold tracking-tighter text-primary font-headline">
                        <Image src="/icons/logo.jpeg" alt="Astra Navi Logo" height={32} width={32} className="object-contain mr-2.5 rounded-lg shadow-sm shadow-secondary/10" priority />
                        Astra Navi
                    </Link>
                </div>

                {/* Center: Navigation Links */}
                <div className="flex items-center justify-center space-x-6 lg:space-x-10 font-body font-medium tracking-wide text-[13px] lg:text-sm">
                    {navItems.filter(item => item.id !== 'chat' || isLoggedIn).map((eachItem) => {
                        const isLinkActive = isActive(eachItem.href);
                        return (
                            <Link key={eachItem.id} href={eachItem.href} className={`relative px-2 py-1 transition-all duration-300 ${isLinkActive ? "text-primary font-semibold" : "text-primary/60 hover:text-primary"}`}>
                                {eachItem.label}
                                {isLinkActive && (
                                    <>
                                        <span className="absolute bottom-[-6px] left-0 right-0 h-[2.5px] bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.7)] rounded-full" />
                                        <span className="absolute inset-0 bg-secondary/8 blur-md -z-10 rounded-full" />
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end space-x-4 lg:space-x-5">
                    <ThemeToggle />
                    {!isLoggedIn ? (
                        <Button href="/login" variant="primary" size="md" className="!px-6 shadow-md shadow-secondary/10">Login</Button>
                    ) : (
                        <div className="relative z-50" ref={desktopDropdownRef}>
                            <div className="profile-ring-glow cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <div className="profile-comet-dot"></div>
                                <div className="profile-avatar-content !text-sm">{(user?.name?.[0] || user?.email?.[0] || 'S').toUpperCase()}</div>
                            </div>
                            {isDropdownOpen && (
                                <div className="absolute top-[56px] right-0 w-60 bg-background/98 backdrop-blur-2xl border border-secondary/20 rounded-2xl shadow-xl p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3.5 mb-2 border-b border-primary/5">
                                        <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em] font-bold">Seeker Identity</p>
                                        <p className="text-sm font-bold text-primary truncate mt-0.5">{user?.name || user?.email || "Seeker"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
                                            <User className="w-4 h-4 mr-3.5 opacity-60" /> Celestial Profile
                                        </Link>
                                        <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium">
                                            <LogOut className="w-4 h-4 mr-3.5 opacity-60" /> Logout Journey
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== MOBILE NAVBAR (<md) ===== */}
            <div className="flex md:hidden items-center px-4 py-3 w-full relative h-[64px]">
                {/* Left Section (33%) */}
                <div className="flex-[1] flex justify-start">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        className="p-2.5 -ml-2 text-primary/80 hover:text-primary transition-all rounded-xl hover:bg-primary/5 active:scale-90"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Center Section (Absolute Centering for perfect alignment) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex justify-center pointer-events-auto">
                    <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tighter text-primary font-headline">
                        <Image src="/icons/logo.jpeg" alt="Astra Navi Logo" height={28} width={28} className="object-contain rounded-md" priority />
                        <span className="whitespace-nowrap">Astra Navi</span>
                    </Link>
                </div>

                {/* Right Section (33%) */}
                <div className="flex-[1] flex justify-end items-center gap-2.5 sm:gap-3">
                    <ThemeToggle />
                    {!isLoggedIn ? (
                        <Link href="/login" className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                            <User className="w-4.5 h-4.5" />
                        </Link>
                    ) : (
                        <div className="relative z-50" ref={mobileDropdownRef}>
                            <div className="profile-ring-glow !w-9 !h-9 cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <div className="profile-comet-dot"></div>
                                <div className="profile-avatar-content !text-xs font-bold">{(user?.name?.[0] || user?.email?.[0] || 'S').toUpperCase()}</div>
                            </div>
                            {isDropdownOpen && (
                                <div className="absolute top-[56px] right-0 w-60 bg-background/98 backdrop-blur-2xl border border-secondary/20 rounded-2xl shadow-xl p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3.5 mb-2 border-b border-primary/5">
                                        <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em] font-bold">Seeker Identity</p>
                                        <p className="text-sm font-bold text-primary truncate mt-0.5">{user?.name || user?.email || "Seeker"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
                                            <User className="w-4 h-4 mr-3.5 opacity-60" /> Celestial Profile
                                        </Link>
                                        <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium">
                                            <LogOut className="w-4 h-4 mr-3.5 opacity-60" /> Logout Journey
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== SITE MENU OVERLAY ===== */}
            <div className={`md:hidden fixed inset-0 top-[var(--navbar-height,64px)] bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
            
            <div className={`md:hidden fixed top-[var(--navbar-height,64px)] left-0 right-0 bg-background/98 backdrop-blur-2xl border-b border-secondary/15 shadow-2xl z-[105] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="p-6 space-y-2">
                    {navItems.filter(item => item.id !== 'chat' || isLoggedIn).map((item) => (
                        <Link key={item.id} href={item.href} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all ${isActive(item.href) ? 'text-secondary bg-secondary/10' : 'text-primary/70 hover:bg-primary/5'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive(item.href) ? 'bg-secondary' : 'bg-transparent'}`} />
                            {item.label}
                        </Link>
                    ))}

                    {!isLoggedIn && (
                        <div className="pt-4">
                            <Button href="/login" onClick={() => setIsMenuOpen(false)} fullWidth size="lg">Enter the Ascendant</Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}    

export default Navbar;
