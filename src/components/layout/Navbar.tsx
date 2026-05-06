'use client';

import Link from "next/link";
import React, { useState, useRef, useEffect, cloneElement } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Button from "../ui/Button";
import ThemeToggle from "./ThemeToggle";
import LanguagePicker from "../ui/LanguagePicker";
import { useAuth } from "@/context/AuthContext";
import { useToast, useTranslation } from "@/hooks";
import { 
    User, LogOut, Menu, X, ChevronDown, Sparkles, 
    BookOpen, MessageSquare, Heart, Compass, LayoutDashboard, 
    Gem, ShieldQuestion, Brain, Globe
} from "lucide-react";

// Navigation structure based on auth state
const getNavSections = (isLoggedIn: boolean, t: (key: string) => string) => {
    if (isLoggedIn) {
        return [
            {
                id: "destiny",
                label: t('nav.myJourney'),
                items: [
                    { 
                        label: t('nav.cosmicDashboard'), 
                        href: "/", 
                        icon: <LayoutDashboard className="w-4 h-4" />,
                        desc: t('nav.cosmicDashboardDesc')
                    },
                    {
                        label: t('nav.myKundli'),
                        href: "/kundli",
                        icon: <Globe className="w-4 h-4" />,
                        desc: t('nav.myKundliDesc')
                    },
                    {
                        label: t('nav.chartMatching'),
                        href: "/kundli/match",
                        icon: <Heart className="w-4 h-4" />,
                        desc: t('nav.chartMatchingDesc')
                    },
                ]
            },
            {
                id: "consult",
                label: t('nav.consultNavi'),
                items: [
                    {
                        label: t('nav.guidedSessions'),
                        href: "/consult",
                        icon: <Sparkles className="w-4 h-4" />,
                        desc: t('nav.guidedSessionsDesc')
                    },
                    {
                        label: t('nav.chatWithNavi'),
                        href: "/chat",
                        icon: <MessageSquare className="w-4 h-4" />,
                        desc: t('nav.chatWithNaviDesc')
                    },
                ]
            },
            {
                id: "knowledge",
                label: t('nav.knowledge'),
                items: [
                    { 
                        label: t('nav.encyclopedia'), 
                        href: "/blogs", 
                        icon: <BookOpen className="w-4 h-4" />,
                        desc: t('nav.encyclopediaDesc')
                    },
                    { 
                        label: t('nav.the12Rashis'), 
                        href: "/rashis", 
                        icon: <Sparkles className="w-4 h-4" />,
                        desc: t('nav.the12RashisDesc')
                    },
                    { 
                        label: t('nav.theNavagraha'), 
                        href: "/blogs/planets", 
                        icon: <Compass className="w-4 h-4" />,
                        desc: t('nav.theNavagrahaDesc')
                    },
                    { 
                        label: t('nav.the12Houses'), 
                        href: "/blogs/houses", 
                        icon: <Gem className="w-4 h-4" />,
                        desc: t('nav.the12HousesDesc')
                    },
                    { 
                        label: t('nav.the27Nakshatras'), 
                        href: "/blogs/nakshatras", 
                        icon: <Sparkles className="w-4 h-4" />,
                        desc: t('nav.the27NakshatrasDesc')
                    },
                    { 
                        label: t('nav.planetaryYogas'), 
                        href: "/blogs/yogas", 
                        icon: <BookOpen className="w-4 h-4" />,
                        desc: t('nav.planetaryYogasDesc')
                    },
                ]
            },
            {
                id: "community",
                label: t('nav.community'),
                items: [
                    { 
                        label: t('nav.naviAiModels'), 
                        href: "/chat", 
                        icon: <Brain className="w-4 h-4" />,
                        desc: t('nav.naviAiModelsDesc')
                    },
                    { 
                        label: t('nav.helpSupport'), 
                        href: "/support", 
                        icon: <ShieldQuestion className="w-4 h-4" />,
                        desc: t('nav.helpSupportDesc')
                    },
                ]
            }
        ];
    }

    // Public / Logged Out View
    return [
        {
            id: "explore",
            label: t('nav.platform'),
            items: [
                { 
                    label: t('nav.cosmicDashboard'), 
                    href: "/", 
                    icon: <Compass className="w-4 h-4" />,
                    desc: t('nav.cosmicDashboardDesc')
                },
                { 
                    label: t('nav.ourMission'), 
                    href: "/about", 
                    icon: <User className="w-4 h-4" />,
                    desc: t('nav.ourMissionDesc')
                },
                { 
                    label: t('nav.naviAiModels'), 
                    href: "/chat", 
                    icon: <Brain className="w-4 h-4" />,
                    desc: t('nav.naviAiModelsDesc')
                },            
            ]
        },
        {
            id: "horoscope",
            label: t('nav.astrology'),
            items: [
                { 
                    label: t('nav.birthChart'), 
                    href: "/kundli", 
                    icon: <BookOpen className="w-4 h-4" />,
                    desc: t('nav.birthChartDesc')
                },
                { 
                    label: t('nav.chartMatching'), 
                    href: "/kundli/match", 
                    icon: <Heart className="w-4 h-4" />,
                    desc: t('nav.chartMatchingDesc')
                },
                { 
                    label: t('nav.zodiacSigns'), 
                    href: "/rashis", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: t('nav.zodiacSignsDesc')
                },
            ]
        },
        {
            id: "knowledge",
            label: t('nav.knowledge'),
            items: [
                { 
                    label: t('nav.encyclopedia'), 
                    href: "/blogs", 
                    icon: <BookOpen className="w-4 h-4" />,
                    desc: t('nav.encyclopediaDesc')
                },
                { 
                    label: t('nav.the12Rashis'), 
                    href: "/rashis", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: t('nav.the12RashisDesc')
                },
                { 
                    label: t('nav.theNavagraha'), 
                    href: "/blogs/planets", 
                    icon: <Compass className="w-4 h-4" />,
                    desc: t('nav.theNavagrahaDesc')
                },
                { 
                    label: t('nav.the12Houses'), 
                    href: "/blogs/houses", 
                    icon: <Gem className="w-4 h-4" />,
                    desc: t('nav.the12HousesDesc')
                },
                { 
                    label: t('nav.the27Nakshatras'), 
                    href: "/blogs/nakshatras", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: t('nav.the27NakshatrasDesc')
                },
                { 
                    label: t('nav.planetaryYogas'), 
                    href: "/blogs/yogas", 
                    icon: <BookOpen className="w-4 h-4" />,
                    desc: t('nav.planetaryYogasDesc')
                },
            ]
        },
        {
            id: "services",
            label: t('nav.services'),
            items: [
                {
                    label: t('nav.chatWithNavi'),
                    href: "/chat",
                    icon: <MessageSquare className="w-4 h-4" />,
                    desc: t('nav.chatWithNaviDesc')
                },
                {
                    label: t('nav.guidedSessions'),
                    href: "/consult", 
                    icon: <Compass className="w-4 h-4" />,
                    desc: t('nav.guidedSessionsDesc')
                },
                { 
                    label: t('nav.astraNaviPremium'), 
                    href: "/plans", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: t('nav.astraNaviPremiumDesc')
                },
            ]
        }
    ];
};

const Navbar: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn, logout, showLoading, user } = useAuth();
    const { success, ToastContainer } = useToast();
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);
    const desktopUserDropdownRef = useRef<HTMLDivElement>(null);
    const mobileUserDropdownRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);
    
    // Reset states on route change
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMenuOpen(false);
        setIsUserDropdownOpen(false);
        setHoveredSection(null);
    }, [pathname]);

    const isChatPage = pathname?.startsWith('/chat');
    const navSections = getNavSections(isLoggedIn, t);

    const handleLogout = async () => {
        setIsUserDropdownOpen(false);
        setIsMenuOpen(false);
        
        showLoading("Logging you out...", 2000);
        
        setTimeout(async () => {
            try {
                success("Signed out successfully.");
                await logout('/');
            } catch (err) {
                console.error('Logout failed:', err);
                router.replace('/');
            }
        }, 1500);
    };
    
    const isActive = (path:string) => pathname == path;

    return(
        <>
            {ToastContainer}
            <nav ref={navRef} className={`fixed top-0 w-full z-[210] bg-surface border-b border-outline-variant/30 transition-all duration-500 ${isChatPage ? 'hidden md:block' : ''}`}>
            {/* ===== DESKTOP NAVBAR (md+) ===== */}
            <div className="hidden md:grid grid-cols-3 items-center px-4 sm:px-8 lg:px-12 py-2 w-full mx-auto max-w-[1600px] 2xl:max-w-[2000px] 3xl:max-w-[2400px]">
                {/* Left: Logo */}
                <div className="flex justify-start">
                    <Link href="/" aria-label="Astra Navi Home" className="flex shrink-0 items-center justify-center text-lg lg:text-xl font-bold tracking-tighter text-primary font-headline whitespace-nowrap">
                        <Image src="/icons/logo.jpeg" alt="" height={26} width={26} style={{ width: "auto", height: "auto" }} className="object-contain mr-2.5 rounded-lg shadow-sm shadow-secondary/10" priority />
                        Astra Navi
                    </Link>
                </div>

                {/* Center: Navigation Dropdowns */}
                <div className="flex items-center justify-center space-x-1 lg:space-x-3" role="menubar">
                    {navSections.map((section) => (
                        <div 
                            key={section.id}
                            className="relative"
                            onMouseEnter={() => setHoveredSection(section.id)}
                            onMouseLeave={() => setHoveredSection(null)}
                            role="none"
                        >
                            <button 
                                role="menuitem"
                                aria-haspopup="true"
                                aria-expanded={hoveredSection === section.id}
                                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full transition-all duration-300 font-body font-bold text-[11px] lg:text-[12px] tracking-widest uppercase whitespace-nowrap ${hoveredSection === section.id ? 'text-secondary bg-secondary/5' : 'text-primary/70 hover:text-primary'}`}
                            >
                                {section.label}
                                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${hoveredSection === section.id ? 'rotate-180 text-secondary' : 'opacity-30'}`} />
                            </button>

                            {/* Mega Dropdown Bridge */}
                            <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 transform ${hoveredSection === section.id ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}`} role="menu">
                                {/* Hover Bridge Pseudo-element */}
                                <div className="absolute top-0 left-0 w-full h-4 -translate-y-full" />
                                
                                <div className="w-[300px] lg:w-[340px] p-2 bg-surface/95 backdrop-blur-xl rounded-[24px] border border-outline-variant/30 shadow-2xl shadow-black/40">
                                    <div className="space-y-1">
                                        {section.items.map((item, idx) => {
                                            return (
                                                <Link 
                                                    key={idx} 
                                                    href={item.href}
                                                    role="menuitem"
                                                    aria-label={`${item.label}: ${item.desc}`}
                                                    className={`group flex items-start gap-4 p-3 rounded-2xl transition-all duration-200 ${isActive(item.href) ? 'bg-secondary/10' : 'hover:bg-secondary/5'}`}
                                                >
                                                    <div className={`mt-0.5 w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border transition-all duration-300 ${isActive(item.href) ? 'bg-secondary text-white border-secondary' : 'bg-secondary/5 text-secondary border-secondary/10 group-hover:bg-secondary/10 group-hover:border-secondary/30'}`}>
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-[13px] font-headline font-semibold tracking-wide ${isActive(item.href) ? 'text-secondary' : 'text-primary'}`}>
                                                            {item.label}
                                                        </span>
                                                        <span className="text-[11px] text-on-surface-variant/60 leading-relaxed mt-1 line-clamp-2">
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
                    <LanguagePicker />
                    <ThemeToggle />
                    {!isLoggedIn ? (
                        <Button href={`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`} variant="primary" size="sm" className="!px-5 shadow-md shadow-secondary/10 text-xs">Login</Button>
                    ) : (
                        <div className="relative z-50" ref={desktopUserDropdownRef}>
                            <button 
                                aria-haspopup="true"
                                aria-expanded={isUserDropdownOpen}
                                className="profile-ring-glow cursor-pointer" 
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                            >
                                <div className="profile-comet-dot"></div>
                                <div className="profile-avatar-content !text-sm">{(user?.name?.[0] || user?.email?.[0] || 'S').toUpperCase()}</div>
                            </button>
                            {isUserDropdownOpen && (
                                <div className="absolute top-[calc(100%+8px)] right-0 w-60 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3.5 mb-2 border-b border-primary/5">
                                        <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em] font-bold">Account</p>
                                        <p className="text-sm font-bold text-primary truncate mt-0.5">{user?.name || user?.email?.split('@')[0] || "User"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
                                            <User className="w-4 h-4 mr-3.5 opacity-60" /> User Profile
                                        </Link>
                                        <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium">
                                            <LogOut className="w-4 h-4 mr-3.5 opacity-60" /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== MOBILE NAVBAR (<md) ===== */}
            <div className="flex md:hidden items-center px-4 py-2 w-full relative h-[56px]">
                {/* Left Section (33%) */}
                <div className="flex-[1] flex justify-start">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        className="p-2.5 -ml-2 text-primary/80 hover:text-primary transition-all rounded-xl hover:bg-primary/5 active:scale-90"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Center Section */}
                <div className="absolute left-1/2 -translate-x-1/2 flex justify-center pointer-events-auto">
                    <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tighter text-primary font-headline">
                        <Image src="/icons/logo.jpeg" alt="Astra Navi Logo" height={24} width={24} style={{ width: "auto", height: "auto" }} className="object-contain rounded-md" priority />
                        <span className="whitespace-nowrap">Astra Navi</span>
                    </Link>
                </div>

                {/* Right Section */}
                <div className="flex-[1] flex justify-end items-center gap-2.5 sm:gap-3">
                    <ThemeToggle />
                    {!isLoggedIn ? (
                        <Link href="/login" className="w-8 h-8 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                            <User className="w-4 h-4" />
                        </Link>
                    ) : (
                        <div className="relative z-50" ref={mobileUserDropdownRef}>
                            <div className="profile-ring-glow !w-8 !h-8 cursor-pointer" onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}>
                                <div className="profile-comet-dot"></div>
                                <div className="profile-avatar-content !text-[10px] font-bold">{(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</div>
                            </div>
                            {isUserDropdownOpen && (
                                <div className="absolute top-[56px] right-0 w-60 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3.5 mb-2 border-b border-primary/5">
                                        <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em] font-bold">Account</p>
                                        <p className="text-sm font-bold text-primary truncate mt-0.5">{user?.name || user?.email?.split('@')[0] || "User"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
                                            <User className="w-4 h-4 mr-3.5 opacity-60" /> User Profile
                                        </Link>
                                        <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium">
                                            <LogOut className="w-4 h-4 mr-3.5 opacity-60" /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== SITE MENU OVERLAY (Mobile) ===== */}
            <div className={`md:hidden fixed inset-0 top-[var(--navbar-height,56px)] bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
            
            <div className={`md:hidden fixed top-[var(--navbar-height,56px)] left-0 right-0 max-h-[calc(100vh-var(--navbar-height,56px))] bg-surface border-b border-secondary/15 shadow-2xl z-[105] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
                <div className="p-5 space-y-7 pb-12">
                    {navSections.map((section) => (
                        <div key={section.id} className="space-y-3">
                            <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] px-3 opacity-80">{section.label}</h3>
                            <div className="grid grid-cols-1 gap-1">
                                {section.items.map((item, idx) => {
                                    return (
                                        <Link key={idx} href={item.href} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all active:scale-[0.98] ${isActive(item.href) ? 'bg-secondary/10' : 'hover:bg-primary/5'}`}>
                                            <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isActive(item.href) ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary'}`}>
                                                {cloneElement(item.icon as React.ReactElement<Record<string, unknown>>, { size: 18 })}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-[13px] font-bold tracking-tight ${isActive(item.href) ? 'text-secondary' : 'text-primary'}`}>
                                                    {item.label}
                                                </span>
                                                {item.desc && (
                                                    <span className="text-[10px] text-on-surface-variant/50 leading-tight mt-0.5 truncate pr-2">
                                                        {item.desc}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {!isLoggedIn && (
                        <div className="pt-2">
                            <Button href="/login" onClick={() => setIsMenuOpen(false)} fullWidth size="lg" className="rounded-2xl shadow-lg shadow-secondary/20 font-bold tracking-wider">GET STARTED</Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
        </>
    )
}    

export default Navbar;    
