'use client';

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Button from "../ui/Button";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useToast } from "@/hooks/useToast";
import { 
    User, LogOut, Menu, X, ChevronDown, Sparkles, 
    BookOpen, MessageSquare, Heart, Compass, LayoutDashboard, 
    History, Gem, ShieldQuestion, Users
} from "lucide-react";

interface INavbarProps{}

// Navigation structure based on auth state
const getNavSections = (isLoggedIn: boolean) => {
    if (isLoggedIn) {
        return [
            {
                id: "destiny",
                label: "My Journey",
                items: [
                    { 
                        label: "Dashboard", 
                        href: "/", 
                        icon: <LayoutDashboard className="w-4 h-4" />,
                        desc: "Your cosmic overview and active insights."
                    },
                    { 
                        label: "My Daily Predictions", 
                        href: "/horoscope", 
                        icon: <Sparkles className="w-4 h-4" />,
                        desc: "Personalized scores for career and love."
                    },
                    {
                        label: "My Birth Chart",
                        href: "/kundli",
                        icon: <BookOpen className="w-4 h-4" />,
                        desc: "Detailed insights into your celestial DNA."
                    },
                ]
            },
            {
                id: "consult",
                label: "Consult Navi",
                items: [
                    {
                        label: "Active AI Chat",
                        href: "/chat",
                        icon: <MessageSquare className="w-4 h-4" />,
                        desc: "Continue your conversation with the stars."
                    },
                ]
            },
            {
                id: "community",
                label: "Community",
                items: [
                    { 
                        label: "Live Astrologers", 
                        href: "/astrologers", 
                        icon: <Users className="w-4 h-4" />,
                        desc: "Connect with verified human experts."
                    },
                    // { label: "Gemstone Shop", href: "/shop", icon: <Gem className="w-4 h-4" />, desc: "Remedial gems for planetary balance." },
                    { 
                        label: "Support", 
                        href: "/support", 
                        icon: <ShieldQuestion className="w-4 h-4" />,
                        desc: "How can we help your journey?"
                    },
                ]
            },
            {
                id: "knowledge",
                label: "Knowledge",
                items: [
                    { 
                        label: "All Topics", 
                        href: "/blogs", 
                        icon: <BookOpen className="w-4 h-4" />,
                        desc: "Browse all astrology knowledge topics."
                    },
                    { 
                        label: "The 12 Rashis", 
                        href: "/rashis", 
                        icon: <Sparkles className="w-4 h-4" />,
                        desc: "Explore all 12 Vedic zodiac signs."
                    },
                    { 
                        label: "Navagraha - Nine Planets", 
                        href: "/blogs/planets", 
                        icon: <Compass className="w-4 h-4" />,
                        desc: "Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu."
                    },
                    { 
                        label: "The 12 Houses (Bhavas)", 
                        href: "/blogs/houses", 
                        icon: <Gem className="w-4 h-4" />,
                        desc: "Learn about houses in your birth chart."
                    },
                    { 
                        label: "The 27 Nakshatras", 
                        href: "/blogs/nakshatras", 
                        icon: <Sparkles className="w-4 h-4" />,
                        desc: "Discover the lunar mansions."
                    },
                    { 
                        label: "Planetary Yogas", 
                        href: "/blogs/yogas", 
                        icon: <BookOpen className="w-4 h-4" />,
                        desc: "Powerful planetary combinations."
                    },
                ]
            }
        ];
    }

    // Public / Logged Out View
    return [
        {
            id: "explore",
            label: "AstraNavi",
            items: [
                { 
                    label: "Home", 
                    href: "/", 
                    icon: <Compass className="w-4 h-4" />,
                    desc: "The entrance to your cosmic journey."
                },
                { 
                    label: "About Us", 
                    href: "/about", 
                    icon: <User className="w-4 h-4" />,
                    desc: "Our mission to blend AI with Jyotish."
                },
                { 
                    label: "Live Astrologers", 
                    href: "/astrologers", 
                    icon: <Users className="w-4 h-4" />,
                    desc: "Connect with verified human experts."
                },
            ]
        },
        {
            id: "horoscope",
            label: "Horoscope",
            items: [
                { 
                    label: "The 12 Rashis", 
                    href: "/rashis", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: "Explore Vedic zodiac signs and traits."
                },
                { 
                    label: "Daily Predictions", 
                    href: "/horoscope", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: "Check your luck, health, and finance."
                },
                { 
                    label: "Birth Kundli", 
                    href: "/kundli", 
                    icon: <BookOpen className="w-4 h-4" />,
                    desc: "Generate your free Vedic birth chart."
                },
            ]
        },
        {
            id: "knowledge",
            label: "Knowledge",
            items: [
                { 
                    label: "All Topics", 
                    href: "/blogs", 
                    icon: <BookOpen className="w-4 h-4" />,
                    desc: "Browse all astrology knowledge topics."
                },
                { 
                    label: "The 12 Rashis", 
                    href: "/rashis", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: "Explore all 12 Vedic zodiac signs."
                },
                { 
                    label: "Navagraha - Nine Planets", 
                    href: "/blogs/planets", 
                    icon: <Compass className="w-4 h-4" />,
                    desc: "Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu."
                },
                { 
                    label: "The 12 Houses (Bhavas)", 
                    href: "/blogs/houses", 
                    icon: <Gem className="w-4 h-4" />,
                    desc: "Learn about houses in your birth chart."
                },
                { 
                    label: "The 27 Nakshatras", 
                    href: "/blogs/nakshatras", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: "Discover the lunar mansions."
                },
                { 
                    label: "Planetary Yogas", 
                    href: "/blogs/yogas", 
                    icon: <BookOpen className="w-4 h-4" />,
                    desc: "Powerful planetary combinations."
                },
            ]
        },
        {
            id: "services",
            label: "Services",
            items: [
                {
                    label: "AI Consultation",
                    href: "/login",
                    icon: <MessageSquare className="w-4 h-4" />,
                    desc: "Start your private session with AI Navi."
                },
                {
                    label: "Gemstone Shop",
                    href: "/shop", 
                    icon: <Gem className="w-4 h-4" />,
                    desc: "Curated remedies for planetary balance."
                },
                { 
                    label: "Premium Plans", 
                    href: "/plans", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: "Unlock advanced planetary insights."
                },
            ]
        }
    ];
};

const Navbar: React.FunctionComponent<INavbarProps> = (props) => {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn, logout, showLoading, user } = useAuth();
    const { setIsMobileMenuOpen } = useChat();
    const { success, ToastContainer } = useToast();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);
    const desktopUserDropdownRef = useRef<HTMLDivElement>(null);
    const mobileUserDropdownRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);

    const isChatPage = pathname?.startsWith('/chat');
    const navSections = getNavSections(isLoggedIn);

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
            const isOutsideDesktop = !desktopUserDropdownRef.current || !desktopUserDropdownRef.current.contains(target);
            const isOutsideMobile = !mobileUserDropdownRef.current || !mobileUserDropdownRef.current.contains(target);
            
            if (isOutsideDesktop && isOutsideMobile) {
                setIsUserDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
        setIsUserDropdownOpen(false);
        setHoveredSection(null);
    }, [pathname]);

    const handleLogout = () => {
        setIsUserDropdownOpen(false);
        setIsMenuOpen(false);
        
        // Logout and redirect immediately to prevent layout redirect
        logout();
        router.replace('/');
        
        // Show toast after a brief delay to ensure we're on home page
        setTimeout(() => {
            success('Successfully logged out');
        }, 100);
    };
    
    const isActive = (path:string) => pathname == path;

    return(
        <>
            <ToastContainer />
            <nav ref={navRef} className={`fixed top-0 w-full z-[210] bg-[#faf7f2]/90 dark:bg-[#0b071a]/90 backdrop-blur-xl shadow-sm border-b border-secondary/10 transition-all duration-500 ${isChatPage ? 'hidden md:block' : ''}`}>
            {/* ===== DESKTOP NAVBAR (md+) ===== */}
            <div className="hidden md:grid grid-cols-3 items-center px-4 sm:px-8 lg:px-12 py-3.5 w-full mx-auto max-w-[1600px]">
                {/* Left: Logo */}
                <div className="flex justify-start">
                    <Link href="/" className="flex shrink-0 items-center justify-center text-xl lg:text-2xl font-bold tracking-tighter text-primary font-headline">
                        <Image src="/icons/logo.jpeg" alt="Astra Navi Logo" height={32} width={32} className="object-contain mr-2.5 rounded-lg shadow-sm shadow-secondary/10" priority />
                        Astra Navi
                    </Link>
                </div>

                {/* Center: Navigation Dropdowns */}
                <div className="flex items-center justify-center space-x-1 lg:space-x-3">
                    {navSections.map((section) => (
                        <div 
                            key={section.id}
                            className="relative"
                            onMouseEnter={() => setHoveredSection(section.id)}
                            onMouseLeave={() => setHoveredSection(null)}
                        >
                            <button className={`flex items-center gap-1 px-3 lg:px-4 py-2 rounded-full transition-all duration-300 font-body font-bold text-[13px] lg:text-sm tracking-wide ${hoveredSection === section.id ? 'text-secondary bg-secondary/5' : 'text-primary/70 hover:text-primary'}`}>
                                {section.label}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${hoveredSection === section.id ? 'rotate-180 text-secondary' : 'opacity-40'}`} />
                            </button>

                            {/* Mega Dropdown Bridge */}
                            <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-300 transform ${hoveredSection === section.id ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}`}>
                                <div className="w-72 lg:w-80 p-2 bg-background/95 backdrop-blur-2xl rounded-2xl border border-secondary/20 shadow-2xl">
                                    <div className="space-y-1">
                                        {section.items.map((item, idx) => {
                                            return (
                                                <Link 
                                                    key={idx} 
                                                    href={item.href}
                                                    className={`group flex items-start gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 ${isActive(item.href) ? 'bg-secondary/10' : 'hover:bg-secondary/5 hover:translate-x-1'}`}
                                                >
                                                    <div className={`mt-0.5 w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors ${isActive(item.href) ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white'}`}>
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-bold ${isActive(item.href) ? 'text-secondary' : 'text-primary'}`}>
                                                            {item.label}
                                                        </span>
                                                        <span className="text-[11px] text-on-surface-variant/60 leading-snug mt-0.5">
                                                            {item.desc}
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end space-x-4 lg:space-x-5">
                    <ThemeToggle />
                    {!isLoggedIn ? (
                        <Button href={`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`} variant="primary" size="md" className="!px-6 shadow-md shadow-secondary/10">Login</Button>
                    ) : (
                        <div className="relative z-50" ref={desktopUserDropdownRef}>
                            <div className="profile-ring-glow cursor-pointer" onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}>
                                <div className="profile-comet-dot"></div>
                                <div className="profile-avatar-content !text-sm">{(user?.name?.[0] || user?.email?.[0] || 'S').toUpperCase()}</div>
                            </div>
                            {isUserDropdownOpen && (
                                <div className="absolute top-[56px] right-0 w-60 bg-background/98 backdrop-blur-2xl border border-secondary/20 rounded-2xl shadow-xl p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3.5 mb-2 border-b border-primary/5">
                                        <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em] font-bold">Seeker Identity</p>
                                        <p className="text-sm font-bold text-primary truncate mt-0.5">{user?.name || user?.email || "Seeker"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
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

                {/* Center Section */}
                <div className="absolute left-1/2 -translate-x-1/2 flex justify-center pointer-events-auto">
                    <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tighter text-primary font-headline">
                        <Image src="/icons/logo.jpeg" alt="Astra Navi Logo" height={28} width={28} className="object-contain rounded-md" priority />
                        <span className="whitespace-nowrap">Astra Navi</span>
                    </Link>
                </div>

                {/* Right Section */}
                <div className="flex-[1] flex justify-end items-center gap-2.5 sm:gap-3">
                    <ThemeToggle />
                    {!isLoggedIn ? (
                        <Link href="/login" className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                            <User className="w-4.5 h-4.5" />
                        </Link>
                    ) : (
                        <div className="relative z-50" ref={mobileUserDropdownRef}>
                            <div className="profile-ring-glow !w-9 !h-9 cursor-pointer" onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}>
                                <div className="profile-comet-dot"></div>
                                <div className="profile-avatar-content !text-xs font-bold">{(user?.name?.[0] || user?.email?.[0] || 'S').toUpperCase()}</div>
                            </div>
                            {isUserDropdownOpen && (
                                <div className="absolute top-[56px] right-0 w-60 bg-background/98 backdrop-blur-2xl border border-secondary/20 rounded-2xl shadow-xl p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3.5 mb-2 border-b border-primary/5">
                                        <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em] font-bold">Seeker Identity</p>
                                        <p className="text-sm font-bold text-primary truncate mt-0.5">{user?.name || user?.email || "Seeker"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
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

            {/* ===== SITE MENU OVERLAY (Mobile) ===== */}
            <div className={`md:hidden fixed inset-0 top-[var(--navbar-height,64px)] bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
            
            <div className={`md:hidden fixed top-[var(--navbar-height,64px)] left-0 right-0 h-[calc(100vh-64px)] bg-background/98 backdrop-blur-2xl border-b border-secondary/15 shadow-2xl z-[105] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="p-6 space-y-8">
                    {navSections.map((section) => (
                        <div key={section.id} className="space-y-4">
                            <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] px-2">{section.label}</h3>
                            <div className="space-y-1">
                                {section.items.map((item, idx) => {
                                    return (
                                        <Link key={idx} href={item.href} onClick={() => setIsMenuOpen(false)} className={`flex items-start gap-4 px-4 py-3.5 rounded-2xl transition-all ${isActive(item.href) ? 'bg-secondary/10' : ''}`}>
                                            <div className="w-9 h-9 shrink-0 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                {item.icon}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-bold ${isActive(item.href) ? 'text-secondary' : 'text-primary'}`}>
                                                    {item.label}
                                                </span>
                                                <span className="text-[11px] text-on-surface-variant/60 leading-snug mt-0.5">
                                                    {item.desc}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {!isLoggedIn && (
                        <div className="pt-4 pb-10">
                            <Button href="/login" onClick={() => setIsMenuOpen(false)} fullWidth size="lg">Enter the Ascendant</Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
        </>
    )
}    

export default Navbar;    
